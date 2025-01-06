// ---- Web3 packages
import { getAddress, verifyMessage } from "ethers";

// ---- Types
import {
  RequestPayload,
  CredentialResponseBody,
  ProviderContext,
  VerifiedPayload,
  VerifiableCredential,
  ProofRecord,
} from "@gitcoin/passport-types";

import { getIssuerKey } from "../issuers.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { issueHashedCredential, verifyCredential } from "@gitcoin/passport-identity";

// All provider exports from platforms
import { providers, platforms } from "@gitcoin/passport-platforms";
import { ApiError } from "./helpers.js";
import { checkCredentialBans } from "./bans.js";
import { recordToNullifier } from "./oprf.js";

const providerTypePlatformMap = Object.entries(platforms).reduce(
  (acc, [platformName, { providers }]) => {
    providers.forEach(({ type }) => {
      acc[type] = platformName;
    });

    return acc;
  },
  {} as { [k: string]: string }
);

function groupProviderTypesByPlatform(types: string[]): string[][] {
  return Object.values(
    types.reduce(
      (groupedProviders, type) => {
        const platform = providerTypePlatformMap[type] || "generic";

        if (!groupedProviders[platform]) groupedProviders[platform] = [];
        groupedProviders[platform].push(type);

        return groupedProviders;
      },
      {} as { [k: keyof typeof platforms]: string[] }
    )
  );
}

// return response for given payload
const issueCredentials = async (
  types: string[],
  address: string,
  payload: RequestPayload
): Promise<CredentialResponseBody[]> => {
  // if the payload includes an additional signer, use that to issue credential.
  if (payload.signer) {
    // We can assume that the signer is a valid address because the challenge was verified within the /verify endpoint
    payload.address = payload.signer.address;
  }

  const results = await verifyTypes(types, payload);

  const credentials = await Promise.all(
    results.map(async ({ verifyResult, code: verifyCode, error: verifyError, type }) => {
      let code = verifyCode;
      let error = verifyError;
      let record: ProofRecord | undefined;
      let credential;

      try {
        // check if the request is valid against the selected Identity Provider
        if (verifyResult.valid === true) {
          // construct a set of Proofs to issue a credential against (this record will be used to generate a sha256 hash of any associated PII)
          record = {
            // type and address will always be known and can be obtained from the resultant credential
            type: verifyResult.record.pii ? `${type}#${verifyResult.record.pii}` : type,
            // version is defined by entry point
            version: "0.0.0",
            // extend/overwrite with record returned from the provider
            ...(verifyResult?.record || {}),
          };

          const currentKey = getIssuerKey(payload.signatureType);
          // generate a VC for the given payload
          ({ credential } = await issueHashedCredential(
            DIDKit,
            currentKey,
            address,
            record,
            verifyResult.expiresInSeconds,
            payload.signatureType,
            () => recordToNullifier({ record })
          ));
        }
      } catch (e) {
        console.error(e);
        error = "Unable to produce a verifiable credential";
        code = 500;
      }

      return {
        record,
        credential,
        code,
        error,
      };
    })
  );

  const credentialsAfterBanCheck = await checkCredentialBans(credentials);

  return credentialsAfterBanCheck;
};

type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
};

export async function verifyTypes(types: string[], payload: RequestPayload): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    groupProviderTypesByPlatform(types).map(async (platformTypes) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (let type of platformTypes) {
        let verifyResult: VerifiedPayload = { valid: false };
        let code, error;

        const realType = type;
        if (type.startsWith("AllowList")) {
          payload.proofs = {
            ...payload.proofs,
            allowList: type.split("#")[1],
          };
          type = "AllowList";
        } else if (type.startsWith("DeveloperList")) {
          // Here we handle the custom DeveloperList stamps
          const [_type, conditionName, conditionHash, ..._rest] = type.split("#");
          payload.proofs = {
            ...payload.proofs,
            conditionName,
            conditionHash,
          };
          type = "DeveloperList";
        }

        try {
          // verify the payload against the selected Identity Provider
          verifyResult = await providers.verify(type, payload, context);
          if (!verifyResult.valid) {
            code = 403;
            // TODO to be changed to just verifyResult.errors when all providers are updated
            const resultErrors = verifyResult.errors;
            error = resultErrors?.join(", ")?.substring(0, 1000) || "Unable to verify provider";
            if (error.includes(`Request timeout while verifying ${type}.`)) {
              console.log(`Request timeout while verifying ${type}`);
              // If a request times out exit loop and return results so additional requests are not made
              break;
            }
          }
          if (type === "AllowList") {
            type = `AllowList#${verifyResult.record.allowList}`;
          } else {
            type = realType;
          }
        } catch (e) {
          error = "Unable to verify provider";
          code = 400;
        }

        results.push({ verifyResult, type, code, error });
      }
    })
  );

  return results;
}

const verifyAdditionalSigner = async ({
  challenge,
  signature,
  address,
}: {
  challenge: VerifiableCredential;
  signature: string;
  address: string;
}): Promise<{ verifiedAddress: string }> => {
  const additionalSignerCredential = await verifyCredential(DIDKit, challenge);
  const verifiedAddress = getAddress(verifyMessage(challenge.credentialSubject.challenge, signature));

  if (!additionalSignerCredential || verifiedAddress.toLowerCase() !== address.toLowerCase()) {
    throw new ApiError("Unable to verify payload signer", 401);
  }

  return { verifiedAddress };
};

export const checkConditionsAndIssueCredentials = async (
  payload: RequestPayload,
  address: string
): Promise<CredentialResponseBody[] | CredentialResponseBody> => {
  // Verify additional signer if provided
  if (payload.signer) {
    const { verifiedAddress } = await verifyAdditionalSigner(payload.signer);
    payload.signer.address = verifiedAddress;
  }

  const singleType = !payload.types?.length;
  const types = (!singleType ? payload.types : [payload.type]).filter((type) => type);

  // Validate requirements and issue credentials
  if (payload && payload.type) {
    const responses = await issueCredentials(types, address, payload);

    if (singleType) {
      const response = responses[0];
      if ("error" in response && response.code && response.error) {
        throw new ApiError(response.error, response.code);
      }
      return response;
    }
    return responses;
  }

  throw new ApiError("Invalid payload", 400);
};
