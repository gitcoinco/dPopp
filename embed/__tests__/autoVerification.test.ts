import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { autoVerificationHandler, PassportScore } from "../src/handlers";
import {
  PROVIDER_ID,
  VerifiableCredential,
  RequestPayload,
  ProviderContext,
  IssuedCredential,
} from "@gitcoin/passport-types";
import { autoVerifyStamps, AutoVerificationFields } from "@gitcoin/passport-identity/dist/commonjs/identity/src/index.js";

// Mock all external dependencies
jest.mock("ethers", () => {
  const originalModule = jest.requireActual<typeof import("ethers")>("ethers");
  return {
    ...originalModule,
    isAddress: jest.fn(() => {
      return true;
    }),
  };
});

jest.mock("axios");

jest.mock("@gitcoin/passport-identity");

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

jest.mock("@gitcoin/passport-platforms", () => {
  const originalModule =
    jest.requireActual<typeof import("@gitcoin/passport-platforms")>("@gitcoin/passport-platforms");
  return {
    ...originalModule,
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
  };
});

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
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    process.env.SCORER_ENDPOINT = "http://test-endpoint";
    process.env.SCORER_API_KEY = "abcd";
  });

  it("should handle valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
      },
    };

    const postSpy = (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          score: mockedScore,
        },
      });
    });

    const issuedCredentials: VerifiableCredential[] = [
      createMockVerifiableCredential("provider-1", mockAddress),
      createMockVerifiableCredential("provider-2", mockAddress),
      createMockVerifiableCredential("provider-3", mockAddress),
    ];
    (autoVerifyStamps as jest.Mock).mockImplementation(
      ({ address, scorerId }: AutoVerificationFields): Promise<VerifiableCredential[]> => {
        return Promise.resolve(issuedCredentials);
      }
    );

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/${mockAddress}`,
      {
        stamps: issuedCredentials,
        scorer_id: mockScorerId,
      },
      {
        headers: {
          Authorization: process.env.SCORER_API_KEY,
        },
      }
    );
    expect(mockRes.json).toHaveBeenCalledWith(mockedScore);
  });

  it("should handle axios API errors from the embed scorer API correctly", async () => {
    const mockAxiosError = new Error("API error") as AxiosError;

    mockAxiosError.isAxiosError = true;
    mockAxiosError.response = {
      status: 500,
      data: {},
      headers: {},
      statusText: "Internal Server Error",
      config: {},
    };

    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
      },
    };

    const postSpy = (axios.post as jest.Mock).mockImplementation((url) => {
      throw mockAxiosError;
    });

    const issuedCredentials: VerifiableCredential[] = [
      createMockVerifiableCredential("provider-1", mockAddress),
      createMockVerifiableCredential("provider-2", mockAddress),
      createMockVerifiableCredential("provider-3", mockAddress),
    ];
    (autoVerifyStamps as jest.Mock).mockImplementation(
      ({ address, scorerId }: AutoVerificationFields): Promise<VerifiableCredential[]> => {
        return Promise.resolve(issuedCredentials);
      }
    );

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/${mockAddress}`,
      {
        stamps: issuedCredentials,
        scorer_id: mockScorerId,
      },
      {
        headers: {
          Authorization: process.env.SCORER_API_KEY,
        },
      }
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Error making Scorer Embed API request, received error response with code 500: {}, headers: {}",
    });
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it("should only verify specified credentials when credentialIds is provided", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    const specificCredentials = ["ETHDaysActive#50", "ETHScore#75"];

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
        credentialIds: specificCredentials,
      },
    };

    const postSpy = (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          score: mockedScore,
        },
      });
    });

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

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    // Should only verify the specified credentials
    expect(verifySpy).toHaveBeenCalledTimes(specificCredentials.length);

    // Verify that only the specified credentials were checked
    const verifiedTypes = verifySpy.mock.calls.map((call) => call[0]);
    expect(verifiedTypes).toEqual(expect.arrayContaining(specificCredentials));

    // Verify that no other credentials were checked
    verifiedTypes.forEach((type) => {
      expect(specificCredentials).toContain(type);
    });

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(mockRes.json).toHaveBeenCalledWith(mockedScore);
  });

  it("should only score if credentialIds is an empty array", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
        credentialIds: [],
      },
    };

    const postSpy = (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          score: mockedScore,
        },
      });
    });

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, payload: RequestPayload, context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    // Should only verify the specified credentials
    expect(verifySpy).not.toHaveBeenCalled();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(mockRes.json).toHaveBeenCalledWith(mockedScore);
  });

  it("should handle any errors from the embed scorer API correctly", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
      },
    };

    const postSpy = (axios.post as jest.Mock).mockImplementation((url) => {
      throw new Error("Some API error");
    });

    const issuedCredentials: VerifiableCredential[] = [
      createMockVerifiableCredential("provider-1", mockAddress),
      createMockVerifiableCredential("provider-2", mockAddress),
      createMockVerifiableCredential("provider-3", mockAddress),
    ];
    (autoVerifyStamps as jest.Mock).mockImplementation(
      ({ address, scorerId }: AutoVerificationFields): Promise<VerifiableCredential[]> => {
        return Promise.resolve(issuedCredentials);
      }
    );

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/${mockAddress}`,
      {
        stamps: issuedCredentials,
        scorer_id: mockScorerId,
      },
      {
        headers: {
          Authorization: process.env.SCORER_API_KEY,
        },
      }
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unexpected error when processing request, Error: Some API error",
    });
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
