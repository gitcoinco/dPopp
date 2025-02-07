import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../src/credentials.js", () => ({
  issueHashedCredential: jest.fn(),
}));

jest.unstable_mockModule("../src/bans.js", () => ({
  checkCredentialBans: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.unstable_mockModule("@gitcoin/passport-platforms", () => ({
  providers: {
    verify: jest.fn(async (type: string, payload: RequestPayload, context: ProviderContext) => {
      return Promise.resolve({
        valid: true,
        record: { key: "veirfied-condition" },
      });
    }),
  },
  platforms: {
    "provider-ok-1": {
      PlatformDetails: {
        platform: "ETH",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: true,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "ETHDaysActive#50",
              title: "test-1",
            },
            {
              name: "ETHGasSpent#0.25",
              title: "test-1",
            },
          ],
        },
        {
          platformGroup: "Group 2",
          providers: [
            {
              name: "ETHScore#50",
              title: "test-1",
            },
            {
              name: "ETHScore#75",
              title: "test-1",
            },
            {
              name: "ETHScore#90",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-ok-2": {
      PlatformDetails: {
        platform: "Holonym",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: true,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "HolonymGovIdProvider",
              title: "test-1",
            },
            {
              name: "HolonymPhone",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-bad-1": {
      PlatformDetails: {
        platform: "Facebook",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: false,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "Facebook",
              title: "test-1",
            },
            {
              name: "FacebookProfilePicture",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-bad-2": {
      PlatformDetails: {
        platform: "Github",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: false,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "githubContributionActivityGte#120",
              title: "test-1",
            },
            {
              name: "githubContributionActivityGte#30",
              title: "test-1",
            },
          ],
        },
        {
          platformGroup: "Group 2",
          providers: [
            {
              name: "githubContributionActivityGte#60",
              title: "test-1",
            },
          ],
        },
      ],
    },
  },
}));

jest.unstable_mockModule("ethers", () => ({
  isAddress: jest.fn(() => {
    return true;
  }),
}));

const { autoVerifyStamps, getEvmProvidersByPlatform } = await import("../src/autoVerification.js");
const { providers } = await import("@gitcoin/passport-platforms");
const { issueHashedCredential } = await import("../src/credentials.js");
import {
  PROVIDER_ID,
  VerifiableCredential,
  RequestPayload,
  ProviderContext,
  IssuedCredential,
} from "@gitcoin/passport-types";
import { PassportScore } from "../src/verification.js";

const expectedEvmProvidersToSucceed = new Set<PROVIDER_ID>([
  "ETHDaysActive#50",
  "ETHGasSpent#0.25",
  "ETHScore#50",
  "ETHScore#75",
]);

const expectedEvmProvidersToFail = new Set<PROVIDER_ID>(["ETHScore#90", "HolonymGovIdProvider", "HolonymPhone"]);

const createMockVerifiableCredential = (provider: string, address: string): VerifiableCredential => ({
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/security/suites/eip712sig-2021/v1"],
  type: ["VerifiableCredential", "EVMCredential"],
  credentialSubject: {
    id: `did:pkh:eip155:1:${address}`,
    "@context": {
      hash: "https://schema.org/Text",
      provider: "https://schema.org/Text",
      address: "https://schema.org/Text",
      challenge: "https://schema.org/Text",
      metaPointer: "https://schema.org/URL",
    },
    hash: "0x123456789",
    provider: provider,
    address: address,
    challenge: "test-challenge",
    metaPointer: "https://example.com/metadata",
  },
  issuer: "did:key:test-issuer",
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  proof: {
    "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
    type: "EthereumEip712Signature2021",
    proofPurpose: "assertionMethod",
    proofValue: "0xabcdef1234567890",
    verificationMethod: "did:key:test-verification",
    created: new Date().toISOString(),
    eip712Domain: {
      domain: {
        name: "GitcoinVerifiableCredential",
      },
      primaryType: "VerifiableCredential",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ],
        VerifiableCredential: [
          { name: "id", type: "string" },
          { name: "address", type: "string" },
        ],
      },
    },
  },
});

function getMockedIssuedCredential(provider: string, address: string): IssuedCredential {
  const credential: IssuedCredential = {
    credential: createMockVerifiableCredential(provider, address),
  };
  return credential;
}

const mockedScore: PassportScore = {
  address: "0x0000000000000000000000000000000000000000",
  score: "12",
  passing_score: true,
  last_score_timestamp: new Date().toISOString(),
  expiration_timestamp: new Date().toISOString(),
  threshold: "20.000",
  error: "",
  stamps: { "provider-1": { score: "12", dedup: true, expiration_date: new Date().toISOString() } },
};

describe("autoVerificationHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, payload: RequestPayload, context: ProviderContext) => {
        if (expectedEvmProvidersToSucceed.has(type as PROVIDER_ID)) {
          return Promise.resolve({
            valid: true,
            record: { key: "verified-condition" },
          });
        } else {
          return Promise.resolve({
            valid: false,
          });
        }
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const stamps = await autoVerifyStamps({ address: mockAddress, scorerId: mockScorerId });
    expect(stamps).toEqual(issuedCredentials);

    expect(verifySpy).toHaveBeenCalledTimes(expectedEvmProvidersToSucceed.size + expectedEvmProvidersToFail.size);
  });

  it("should filter providers if valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, payload: RequestPayload, context: ProviderContext) => {
        if (expectedEvmProvidersToSucceed.has(type as PROVIDER_ID)) {
          return Promise.resolve({
            valid: true,
            record: { key: "verified-condition" },
          });
        } else {
          return Promise.resolve({
            valid: false,
          });
        }
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const stamps = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
      credentialIds: [
        "ETHDaysActive#50",
        "HolonymPhone",
        "HolonymGovIdProvider",
        "githubContributionActivityGte#120", // not marked as evm
        "githubContributionActivityGte#30", // not marked as evm
      ],
    });
    expect(stamps).toEqual(issuedCredentials);
    expect(verifySpy).toHaveBeenCalledTimes(3); // We only had 3 selected EVM providers
  });

  it("should handle any errors from the embed scorer API correctly", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, payload: RequestPayload, context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const stamps: VerifiableCredential[] = await autoVerifyStamps({ address: mockAddress, scorerId: mockScorerId });

    expect(stamps).toEqual(issuedCredentials);

    expect(verifySpy).toHaveBeenCalledTimes(expectedEvmProvidersToSucceed.size + expectedEvmProvidersToFail.size);
  });
});

describe("getEvmProvidersByPlatform", () => {
  it("should correctly filter returned providers", async () => {
    const providersByPlatform = getEvmProvidersByPlatform({
      scorerId: "123",
      onlyCredentialIds: [
        "ETHDaysActive#50",
        "HolonymPhone",
        "HolonymGovIdProvider",
        "githubContributionActivityGte#120", // not marked as evm
        "githubContributionActivityGte#30", // not marked as evm
      ],
    });
    expect(providersByPlatform).toEqual([["ETHDaysActive#50"], ["HolonymGovIdProvider", "HolonymPhone"]]);
  });
});
