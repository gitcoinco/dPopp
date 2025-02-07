// --- Types
import {
  DIDKitLib,
  ProofRecord,
  RequestPayload,
  VerifiableCredential,
  IssuedCredential,
  SignatureType,
} from "@gitcoin/passport-types";

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
import { NullifierGenerator } from "nullifierGenerators.js";

// Control expiry times of issued credentials
export const CHALLENGE_EXPIRES_AFTER_SECONDS = 60; // 1min
export const CREDENTIAL_EXPIRES_AFTER_SECONDS = 90 * 86400; // 90days

// utility to add a number of seconds to a date
const addSeconds = (date: Date, seconds: number): Date => {
  const result = new Date(date);
  result.setSeconds(result.getSeconds() + seconds);

  return result;
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

// Return a verifiable credential with embedded hash
export const issueNullifiableCredential = async ({
  DIDKit,
  issuerKey,
  address,
  record,
  nullifierGenerators,
  expiresInSeconds = CREDENTIAL_EXPIRES_AFTER_SECONDS,
  signatureType,
}: {
  DIDKit: DIDKitLib;
  issuerKey: string;
  address: string;
  record: ProofRecord;
  nullifierGenerators: NullifierGenerator[];
  expiresInSeconds: number;
  signatureType?: string;
}): Promise<IssuedCredential> => {
  // Generate a hash like SHA256(IAM_PRIVATE_KEY+PII), where PII is the (deterministic) JSON representation
  // of the PII object after transforming it to an array of the form [[key:string, value:string], ...]
  // with the elements sorted by key

  const nullifiers = await Promise.all(nullifierGenerators.map((g) => g({ record })));

  let credential: VerifiableCredential;
  if (signatureType === "EIP712") {
    const verificationMethod = await DIDKit.keyToVerificationMethod("ethr", issuerKey);
    // generate a verifiableCredential
    credential = await issueEip712Credential(
      DIDKit,
      issuerKey,
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
          nullifiers,
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
    credential = await _issueEd25519Credential(DIDKit, issuerKey, expiresInSeconds, {
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
        nullifiers,
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
