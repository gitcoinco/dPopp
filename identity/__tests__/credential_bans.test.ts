import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("axios", () => {
  return {
    // postFn: jest.fn(),
    default: {
      post: jest.fn(),
      isAxiosError: jest.fn(),
    },
  };
});

const { checkCredentialBans } = await import("../src/bans.js");
const { ApiError, UnexpectedApiError } = await import("../src/helpers.js");

const {
  default: { post, isAxiosError },
} = await import("axios");

const mockedAxiosPost = post as jest.Mock;
const mockedIsAxiosError = isAxiosError as unknown as jest.Mock;

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

  it.only("should return original response for invalid credentials", async () => {
    const input = [invalidCredential];
    const result = await checkCredentialBans(input);
    expect(result).toEqual(input);
    expect(mockedAxiosPost).not.toHaveBeenCalled();
  });

  it.only("should check bans for valid credentials", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
      data: [
        {
          hash: "hash123",
          is_banned: false,
        },
      ],
    });

    const input = [validCredential];
    const result = await checkCredentialBans(input);

    expect(mockedAxiosPost).toHaveBeenCalledWith(
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

  it.only("should handle banned credentials", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
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

  it.only("should handle indefinite bans", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
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

  it.only("should process multiple credentials", async () => {
    mockedAxiosPost.mockResolvedValueOnce({
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

  it.only("should handle API errors gracefully", async () => {
    class MockAxiosError extends Error {
      response: { data: string; status: number; headers: { [key: string]: string } };
      request: string;
      constructor() {
        super("API Error");
        this.response = { data: "response", status: 500, headers: { TEST: "header" } };
        this.request = "request";
      }
      isAxiosError: true;
    }

    mockedAxiosPost.mockImplementationOnce(() => {
      throw new MockAxiosError();
    });

    mockedIsAxiosError.mockImplementationOnce((_: any) => {
      return true;
    });

    await expect(checkCredentialBans([validCredential])).rejects.toThrowError(
      new UnexpectedApiError(
        'Error making Bans request, received error response with code 500: "response", headers: {"TEST":"header"}'
      )
    );
  });

  it.only("should handle missing API response data", async () => {
    mockedAxiosPost.mockResolvedValueOnce({});

    const input = [validCredential];

    await expect(checkCredentialBans(input)).rejects.toThrowError(
      new ApiError("Ban not found for hash hash123. This should not happen.", 500)
    );
  });
});
