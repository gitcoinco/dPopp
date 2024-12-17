// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import { HolonymGovIdProvider } from "../Providers/holonymGovIdProvider";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when valid response is received from the Holonym API endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        result: true,
      },
    });

    const holonym = new HolonymGovIdProvider();
    const verifiedPayload = await holonym.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(true);
  });

  it("should return false when invalid response is received from the Holonym API endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        result: false,
      },
    });

    const holonym = new HolonymGovIdProvider();
    const verifiedPayload = await holonym.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["We were unable to verify that your address was unique for action -- isUniqueForAction: false."],
      record: undefined,
    });
  });

  it("should return error response when isUniqueForAction call errors", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      status: 500,
      response: {
        data: {
          error: "Internal Server Error",
        },
      },
    });
    const UNREGISTERED_ADDRESS = "0xunregistered";

    const holonym = new HolonymGovIdProvider();

    await expect(async () => {
      return await holonym.verify({
        address: UNREGISTERED_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrow("Internal Server Error");
  });
});
