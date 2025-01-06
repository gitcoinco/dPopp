import { Request, Response } from "express";
import { Signature, Contract } from "ethers";
import { scrollDevBadgeHandler, getScrollRpcUrl } from "../src/utils/scrollDevBadge.js";
import { getAttestationSignerForChain } from "../src/utils/attestations.js";
import { hasValidIssuer } from "../src/issuers.js";
import { getEASFeeAmount } from "../src/utils/easFees.js";

// Mock external dependencies
jest.mock("@spruceid/didkit-wasm-node");
jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");

  return {
    ...originalModule,
    Contract: jest.fn(),
  };
});

jest.mock("../src/utils/easFees");
jest.mock("../src/issuers");
jest.mock("../src/utils/attestations");

describe("scrollDevBadgeHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    const mockSigner = {
      signTypedData: jest.fn().mockResolvedValue("0xSignature"),
    };
    (getAttestationSignerForChain as jest.Mock).mockResolvedValue(mockSigner);

    (hasValidIssuer as jest.Mock).mockReturnValue(true);

    (getEASFeeAmount as jest.Mock).mockReturnValue(1234);

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
    mockReq = {
      body: {
        credentials: [],
        nonce: "123",
        chainIdHex: "0x82750",
      },
    };

    // Mock environment variables
    process.env.SCROLL_BADGE_PROVIDER_INFO = JSON.stringify({
      "test-provider": {
        contractAddress: "0x1234567890123456789012345678901234567890",
        level: 1,
      },
    });
    process.env.SCROLL_BADGE_ATTESTATION_SCHEMA_UID = "0xSchema";
    process.env.ALCHEMY_API_KEY = "test-api-key";

    (Contract as unknown as jest.Mock).mockImplementation(() => ({
      badgeLevel: jest.fn().mockResolvedValue(BigInt(0)),
    }));
  });

  it("should return an error if no credentials are provided", async () => {
    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "No stamps provided" });
  });

  it("should return an error if the recipient is invalid", async () => {
    mockReq.body.credentials = [{ credentialSubject: { id: "invalid:id" } }];
    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({ error: "Invalid recipient" });
  });

  it("should process valid credentials and return a signed payload", async () => {
    const mockCredential = {
      credentialSubject: {
        id: "did:pkh:eip155:1:0x1234567890123456789012345678901234567890",
        provider: "test-provider",
        hash: "v0.0.0:JnHtXuRm2roGRwbYfHtWYSwMma3Oeh3yUl3hmZ3k96U=",
      },
      issuer: "did:key:test",
    };
    mockReq.body.credentials = [mockCredential];

    // Mock the necessary functions
    jest.spyOn(Signature, "from").mockReturnValue({ v: 27, r: "0xr", s: "0xs" } as any);

    await scrollDevBadgeHandler(mockReq as Request, mockRes as Response);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(mockJson).toHaveBeenCalled();
    const response = mockJson.mock.calls[0][0];
    expect(response).toHaveProperty("passport");
    expect(response).toHaveProperty("signature");
    expect(response.signature).toEqual({ v: 27, r: "0xr", s: "0xs" });
  });
});

describe("getScrollRpcUrl", () => {
  it("should return the correct mainnet URL", () => {
    const url = getScrollRpcUrl({ chainIdHex: "0x82750" });
    expect(url).toBe("https://scroll-mainnet.g.alchemy.com/v2/test-api-key");
  });

  it("should return the correct sepolia URL", () => {
    const url = getScrollRpcUrl({ chainIdHex: "0x1234" });
    expect(url).toBe("https://scroll-sepolia.g.alchemy.com/v2/test-api-key");
  });
});
