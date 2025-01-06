import axios from "axios";
import { checkCredentialBans } from "../src/utils/bans.js";
import { ErrorResponseBody } from "@gitcoin/passport-types";
import { ApiError } from "../src/utils/helpers.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("checkCredentialBans", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validCredential = {
    record: { type: "test" },
    credential: {
      credentialSubject: {
        hash: "hash123",
        provider: "provider123",
        id: "did:0x123",
      },
    },
    code: 200,
  };

  const invalidCredential = {
    error: "Invalid credential",
    code: 400,
  };

  it("should return original response for invalid credentials", async () => {
    const input = [invalidCredential];
    const result = await checkCredentialBans(input);
    expect(result).toEqual(input);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("should check bans for valid credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: false,
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/internal/check-bans"),
      [
        {
          credentialSubject: {
            hash: "hash123",
            provider: "provider123",
            id: "did:0x123",
          },
        },
      ],
      expect.any(Object)
    );
    expect(result).toEqual(input);
  });

  it("should handle banned credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: true,
          ban_type: "hash",
          reason: "Suspicious activity",
          end_time: "2024-12-31",
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(result).toEqual([
      {
        error: "Credential is banned. Type=hash, End=2024-12-31, Reason=Suspicious activity",
        code: 403,
      },
    ]);
  });

  it("should handle indefinite bans", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: true,
          ban_type: "account",
          reason: "Violation",
        },
      ],
    });

    const result = await checkCredentialBans([validCredential]);

    expect(result[0]).toEqual({
      error: `Credential is banned. Type=account, End=indefinite, Reason=Violation`,
      code: 403,
    });
  });

  it("should process multiple credentials", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: [
        { hash: "hash123", is_banned: true, ban_type: "hash" },
        { hash: "hash456", is_banned: false },
      ],
    });

    const anotherValidCredential = JSON.parse(JSON.stringify(validCredential));
    anotherValidCredential.credential.credentialSubject.hash = "hash456";

    const input = [validCredential, anotherValidCredential];
    const result = await checkCredentialBans(input);

    expect((result[0] as ErrorResponseBody).code).toBe(403);
    expect((result[1] as ErrorResponseBody).code).toBe(200);
  });

  it("should handle API errors gracefully", async () => {
    class MockAxiosError extends Error {
      response: { data: string; status: number; headers: { [key: string]: string } };
      request: string;
      constructor() {
        super("API Error");
        this.response = { data: "response", status: 500, headers: { TEST: "header" } };
        this.request = "request";
      }
      isAxiosError = true;
    }
    mockedAxios.post.mockImplementationOnce(() => {
      throw new MockAxiosError();
    });

    await expect(checkCredentialBans([validCredential])).rejects.toThrowError(
      'Error making Bans request, received error response with code 500: "response", headers: {"TEST":"header"}'
    );
  });

  it("should handle missing API response data", async () => {
    mockedAxios.post.mockResolvedValueOnce({});

    const input = [validCredential];

    await expect(checkCredentialBans(input)).rejects.toThrowError(
      new ApiError("Ban not found for hash hash123. This should not happen.", 500)
    );
  });
});
