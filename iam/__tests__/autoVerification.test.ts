import { Request, Response } from "express";
import { isAddress } from "ethers";
import axios from "axios";
import { autoVerificationHandler } from "../src/utils/autoVerification.js";
import { ApiError } from "../src/utils/helpers.js";
import { checkConditionsAndIssueCredentials } from "../src/utils/credentials.js";
import { VerifiableCredential } from "@gitcoin/passport-types";

// Mock all external dependencies
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  isAddress: jest.fn(),
}));

jest.mock("axios");
jest.mock("../src/utils/credentials");

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
    process.env.SCORER_API_KEY = "test-api-key";
  });

  const createMockVerifiableCredential = (address: string): VerifiableCredential => ({
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
      provider: "test-provider",
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

  it("should handle valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    const mockStamp = createMockVerifiableCredential(mockAddress);

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
      },
    };

    // Mock ethers address validation
    (isAddress as unknown as jest.Mock).mockReturnValue(true);

    // Mock credentials check
    (checkConditionsAndIssueCredentials as jest.Mock).mockResolvedValue([
      {
        credential: mockStamp,
      },
    ]);

    // Mock axios response
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        score: {
          score: "1.00000",
          evidence: {
            rawScore: "75",
            threshold: "20",
          },
        },
      },
    });

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith({
      score: "75",
      threshold: "20",
    });

    // Verify the stamp was sent correctly to the scorer
    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/internal/stamps/${mockAddress}`,
      {
        stamps: [mockStamp],
        scorer_id: mockScorerId,
      },
      expect.any(Object)
    );
  });

  it("should work with weighted scorer", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    const mockStamp = createMockVerifiableCredential(mockAddress);

    mockReq = {
      body: {
        address: mockAddress,
        scorerId: mockScorerId,
      },
    };

    (isAddress as unknown as jest.Mock).mockReturnValue(true);

    (checkConditionsAndIssueCredentials as jest.Mock).mockResolvedValue([
      {
        credential: mockStamp,
      },
    ]);

    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        score: {
          score: "75",
        },
      },
    });

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith({
      score: "75",
      threshold: "20",
    });

    // Verify the stamp was sent correctly to the scorer
    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/internal/stamps/${mockAddress}`,
      {
        stamps: [mockStamp],
        scorer_id: mockScorerId,
      },
      expect.any(Object)
    );
  });

  it("should return error for invalid address", async () => {
    mockReq = {
      body: {
        address: "invalid-address",
        scorerId: "test-scorer",
      },
    };

    (isAddress as unknown as jest.Mock).mockReturnValue(false);

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Invalid address",
    });
  });

  it("should handle API errors correctly", async () => {
    const mockAddress = "0x123";
    mockReq = {
      body: {
        address: mockAddress,
        scorerId: "test-scorer",
      },
    };

    (isAddress as unknown as jest.Mock).mockReturnValue(true);
    (checkConditionsAndIssueCredentials as jest.Mock).mockRejectedValue(new ApiError("API Error", 403));

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "API Error",
    });
  });

  it("should handle unexpected errors", async () => {
    const mockAddress = "0x123";
    mockReq = {
      body: {
        address: mockAddress,
        scorerId: "test-scorer",
      },
    };

    (isAddress as unknown as jest.Mock).mockReturnValue(true);
    (checkConditionsAndIssueCredentials as jest.Mock).mockRejectedValue(new Error("Unexpected error"));

    await autoVerificationHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining("Unexpected error when processing request"),
    });
  });

  describe("getEvmProviders", () => {
    it("should return only EVM providers", async () => {
      const mockAddress = "0x123";
      mockReq = {
        body: {
          address: mockAddress,
          scorerId: "test-scorer",
        },
      };

      (isAddress as unknown as jest.Mock).mockReturnValue(true);
      (checkConditionsAndIssueCredentials as jest.Mock).mockResolvedValue([]);
      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          score: {
            score: "0",
            evidence: {
              rawScore: "0",
              threshold: "20",
            },
          },
        },
      });

      await autoVerificationHandler(mockReq as Request, mockRes as Response);

      // Verify that only EVM providers were used
      expect(checkConditionsAndIssueCredentials).toHaveBeenCalledWith(
        expect.objectContaining({
          types: expect.arrayContaining(["SelfStakingBronze"]) && expect.not.arrayContaining(["Google"]),
        }),
        mockAddress
      );
    });
  });
});
