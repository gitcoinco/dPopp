import { isAddress } from "ethers";

import { PROVIDER_ID, ValidResponseBody, SignatureType, VerifiableCredential } from "@gitcoin/passport-types";

import { platforms } from "@gitcoin/passport-platforms";
import { verifyProvidersAndIssueCredentials, VerificationError, addErrorDetailsToMessage } from "./verification.js";

export type AutoVerificationFields = {
  address: string;
  scorerId: string;
  credentialIds?: string[];
};

export type AutoVerificationResponseBodyType = {
  score: string;
  threshold: string;
};

export const getEvmProvidersByPlatform = ({
  scorerId,
  onlyCredentialIds,
}: {
  scorerId: string;
  onlyCredentialIds?: string[];
}): PROVIDER_ID[][] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  scorerId;

  return evmPlatforms.map(({ ProviderConfig }) =>
    ProviderConfig.reduce((acc, platformGroupSpec) => {
      const providers = platformGroupSpec.providers.map(({ name }) => name);

      const filteredProviders = !onlyCredentialIds
        ? providers
        : providers.filter((provider) => onlyCredentialIds.includes(provider));
      if (filteredProviders.length > 0) {
        return acc.concat(filteredProviders);
      }

      return acc;
    }, [] as PROVIDER_ID[])
  );
};

export const autoVerifyStamps = async ({
  address,
  scorerId,
  credentialIds,
}: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  try {
    const evmProvidersByPlatform = getEvmProvidersByPlatform({ scorerId, onlyCredentialIds: credentialIds });

    if (!isAddress(address)) {
      throw new VerificationError("Invalid address", 400);
    }

    const credentialsInfo = {
      address,
      type: "EVMBulkVerify",
      // types: evmProviders,
      version: "0.0.0",
      signatureType: "EIP712" as SignatureType,
    };

    const results = await verifyProvidersAndIssueCredentials(evmProvidersByPlatform, address, credentialsInfo);

    const ret = results
      .flat()
      .filter(
        (credentialResponse): credentialResponse is ValidResponseBody =>
          (credentialResponse as ValidResponseBody).credential !== undefined
      )
      .map(({ credential }) => credential);
    return ret;
  } catch (error) {
    // TODO: check if error is of a common type used in platforms and evtl. rethrow it
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    throw new VerificationError(message, 500);
  }
};
