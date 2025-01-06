// --- Types
import {
  DIDKitLib,
  ProofRecord,
  RequestPayload,
  VerifiableCredential,
  IssuedCredential,
  IssuedChallenge,
  CredentialResponseBody,
  SignatureType,
  ValidResponseBody,
} from "@gitcoin/passport-types";

// --- Node/Browser http req library
import axios from "axios";

// --- Base64 encoding
import * as base64 from "@ethersproject/base64";

// --- Crypto lib for hashing
import { createHash } from "crypto";

// Keeping track of the hashing mechanism (algo + content)
export const VERSION = "v0.0.0";

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
export const MAX_VALID_DID_SESSION_AGE = ONE_DAY_IN_MS;

// EIP712 document types
import {
  DocumentSignatureTypes,
  challengeSignatureDocument,
  DocumentType,
  stampCredentialDocument,
} from "./signingDocuments.js";

// Control expiry times of issued credentials
export const CHALLENGE_EXPIRES_AFTER_SECONDS = 60; // 1min
export const CREDENTIAL_EXPIRES_AFTER_SECONDS = 90 * 86400; // 90days

// utility to add a number of seconds to a date
const addSeconds = (date: Date, seconds: number): Date => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
};

// Create an ordered array of the given input (of the form [[key:string, value:string], ...])
export const objToSortedArray = (obj: { [k: string]: string }): string[][] => {
  const keys: string[] = Object.keys(obj).sort();
  return keys.reduce((out: string[][], key: string) => {
    out.push([key, obj[key]]);
    return out;
  }, [] as string[][]);
};

// Internal method to issue a verifiable credential
const _issueEd25519Credential = async (
  DIDKit: DIDKitLib,
  key: string,
  expiresInSeconds: number,
  fields: { [k: string]: any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  issuanceDate?: string,
  expirationDate?: string
): Promise<VerifiableCredential> => {
  // get DID from key
  const issuer = DIDKit.keyToDID("key", key);
  // read method from key
  const verificationMethod = await DIDKit.keyToVerificationMethod("key", key);
  // stringify assertionMethod we feed to didkit-wasm-node
  const verifyWithMethod = JSON.stringify({
    proofPurpose: "assertionMethod",
    verificationMethod,
  });

  // generate a verifiableCredential
  const credential = await DIDKit.issueCredential(
    JSON.stringify({
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      issuer,
      issuanceDate: issuanceDate ? issuanceDate : new Date().toISOString(),
      expirationDate: expirationDate ? expirationDate : addSeconds(new Date(), expiresInSeconds).toISOString(),
      ...fields,
    }),
    verifyWithMethod,
    key
  );

  // parse the response of the DIDKit wasm
  return JSON.parse(credential) as VerifiableCredential;
};

type CredentialExpiresInSeconds = {
  expiresInSeconds: number;
};

type CredentialExpiresAt = {
  expiresAt: Date;
};

type Eip712CredentialSubject = {
  "@context": object;
  [k: string]: any;
};

type Eip712CredentialFields = {
  credentialSubject: Eip712CredentialSubject;
};

export const issueEip712Credential = async (
  DIDKit: DIDKitLib,
  key: string,
  expiration: CredentialExpiresInSeconds | CredentialExpiresAt,
  // fields: { [k: string]: any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  fields: Eip712CredentialFields,
  signingDocument: DocumentSignatureTypes<DocumentType>,
  additionalContexts: string[] = []
): Promise<VerifiableCredential> => {
  // get DID from key

  const issuer = DIDKit.keyToDID("ethr", key);

  const expiresInSeconds = (expiration as CredentialExpiresInSeconds).expiresInSeconds;
  const expirationDate =
    expiresInSeconds !== undefined
      ? addSeconds(new Date(), expiresInSeconds).toISOString()
      : (expiration as CredentialExpiresAt).expiresAt.toISOString();
  const credentialInput = {
    "@context": ["https://www.w3.org/2018/credentials/v1", ...additionalContexts],
    type: ["VerifiableCredential"],
    issuer,
    issuanceDate: new Date().toISOString(),
    expirationDate,
    ...fields,
  };

  const options = signingDocument;
  const credential = await DIDKit.issueCredential(JSON.stringify(credentialInput), JSON.stringify(options), key);

  // parse the response of the DIDKit wasm
  return JSON.parse(credential) as VerifiableCredential;
};

// Issue a VC with challenge data
export const issueChallengeCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  record: RequestPayload,
  signatureType?: SignatureType
): Promise<IssuedCredential> => {
  // generate a verifiableCredential (60s ttl)
  let credential: VerifiableCredential;
  if (signatureType === "EIP712") {
    const verificationMethod = await DIDKit.keyToVerificationMethod("ethr", key);

    credential = await issueEip712Credential(
      DIDKit,
      key,
      { expiresInSeconds: CHALLENGE_EXPIRES_AFTER_SECONDS },
      {
        credentialSubject: {
          "@context": {
            provider: "https://schema.org/Text",
            challenge: "https://schema.org/Text",
            address: "https://schema.org/Text",
          },

          id: `did:pkh:eip155:1:${record.address}`,
          provider: `challenge-${record.type}`,
          // extra fields to convey challenge data
          challenge: record.challenge,
          address: record.address,
        },
      },
      challengeSignatureDocument(verificationMethod)
    );
  } else {
    credential = await _issueEd25519Credential(DIDKit, key, CHALLENGE_EXPIRES_AFTER_SECONDS, {
      credentialSubject: {
        "@context": {
          provider: "https://schema.org/Text",
          challenge: "https://schema.org/Text",
          address: "https://schema.org/Text",
        },

        id: `did:pkh:eip155:1:${record.address}`,
        provider: `challenge-${record.type}`,
        // extra fields to convey challenge data
        challenge: record.challenge,
        address: record.address,
      },
    });
  }

  // didkit-wasm-node returns credential as a string - parse for JSON
  return {
    credential,
  } as IssuedCredential;
};

const getNullifier = async ({
  key,
  record,
  oprf,
}: {
  key: string;
  record: ProofRecord;
  oprf?: () => Promise<string>;
}) => {
  if (oprf) {
    return oprf();
  } else {
    // Generate a hash like SHA256(IAM_PRIVATE_KEY+PII), where PII is the (deterministic) JSON representation
    // of the PII object after transforming it to an array of the form [[key:string, value:string], ...]
    // with the elements sorted by key
    return base64.encode(
      createHash("sha256")
        .update(key, "utf-8")
        .update(JSON.stringify(objToSortedArray(record)))
        .digest()
    );
  }
};

// Return a verifiable credential with embedded hash
export const issueHashedCredential = async (
  DIDKit: DIDKitLib,
  key: string,
  address: string,
  record: ProofRecord,
  expiresInSeconds: number = CREDENTIAL_EXPIRES_AFTER_SECONDS,
  signatureType?: string,
  oprf?: () => Promise<string>
): Promise<IssuedCredential> => {
  const hash = await getNullifier({ key, record, oprf });

  let credential: VerifiableCredential;
  if (signatureType === "EIP712") {
    const verificationMethod = await DIDKit.keyToVerificationMethod("ethr", key);
    // generate a verifiableCredential
    credential = await issueEip712Credential(
      DIDKit,
      key,
      { expiresInSeconds },
      {
        credentialSubject: {
          "@context": {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },

          // construct a pkh DID on mainnet (:1) for the given wallet address
          id: `did:pkh:eip155:1:${address}`,
          provider: record.type,
          hash: `${VERSION}:${hash}`,
        },
        // https://www.w3.org/TR/vc-status-list/#statuslist2021entry
        // Can be added to support revocation
        // credentialStatus: {
        //   id: "",
        //   type: "StatusList2021Entry",
        //   statusPurpose: "revocation",
        //   statusListIndex: "",
        //   statusListCredential: "",
        // },
      },
      stampCredentialDocument(verificationMethod),
      ["https://w3id.org/vc/status-list/2021/v1"]
    );
  } else {
    // generate a verifiableCredential
    credential = await _issueEd25519Credential(DIDKit, key, expiresInSeconds, {
      credentialSubject: {
        "@context": [
          {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
        ],
        // construct a pkh DID on mainnet (:1) for the given wallet address
        id: `did:pkh:eip155:1:${address}`,
        provider: record.type,
        hash: `${VERSION}:${hash}`,
      },
    });
  }

  // didkit-wasm-node returns credential as a string - parse for JSON
  return {
    credential,
  } as IssuedCredential;
};

// Verify that the provided credential is valid
export const verifyCredential = async (DIDKit: DIDKitLib, credential: VerifiableCredential): Promise<boolean> => {
  // extract expirationDate
  const { expirationDate, proof } = credential;
  // check that the credential is still valid
  if (new Date(expirationDate) > new Date()) {
    try {
      // parse the result of attempting to verify
      const verify = JSON.parse(
        await DIDKit.verifyCredential(JSON.stringify(credential), `{"proofPurpose":"${proof?.proofPurpose}"}`)
      ) as { checks: string[]; warnings: string[]; errors: string[] };

      // did we get any errors when we attempted to verify?
      return verify.errors.length === 0;
    } catch (e) {
      // if didkit throws, etc.
      return false;
    }
  } else {
    // past expiry :(
    return false;
  }
};

// Fetch a verifiable challenge credential
export const fetchChallengeCredential = async (iamUrl: string, payload: RequestPayload): Promise<IssuedChallenge> => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/challenge`,
    {
      payload: {
        address: payload.address,
        type: payload.type,
        // if an alt signer is being added pass it in to be included in the challenge string
        signer: payload.signer,
        signatureType: payload.signatureType,
      },
    }
  );

  const data = response.data;

  if ("error" in data && data.error) {
    console.error("Error fetching challenge credential", data.error);
    throw new Error("Unable to fetch challenge credential");
  } else {
    return {
      challenge: (data as ValidResponseBody).credential,
    } as IssuedChallenge;
  }
};

// Fetch a verifiableCredential
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: RequestPayload,
  createSignedPayload: (data: any) => Promise<any>
): Promise<{ credentials: CredentialResponseBody[] }> => {
  // first pull a challenge that can be signed by the user
  const { challenge } = await fetchChallengeCredential(iamUrl, payload);

  // sign the challenge provided by the IAM
  const signedChallenge = challenge.credentialSubject.challenge
    ? await createSignedPayload(challenge.credentialSubject.challenge)
    : "";

  // must provide signature for message
  if (!signedChallenge) {
    throw new Error("Unable to sign message");
  }

  // fetch a credential from the API that fits the version, payload and passes the signature message challenge
  const response: { data: CredentialResponseBody | CredentialResponseBody[] } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/verify`,
    {
      payload,
      challenge,
      signedChallenge,
    }
  );

  // return everything that was used to create the credential (along with the credential)
  return {
    credentials: Array.isArray(response.data) ? response.data : [response.data],
  };
};
