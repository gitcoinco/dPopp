import * as easPassportModule from "../src/utils/easPassportSchema.js";
import * as easStampModule from "../src/utils/easStampSchema.js";
import onchainInfo from "../../deployments/onchainInfo.json";

import { VerifiableCredential } from "@gitcoin/passport-types";
import { NO_EXPIRATION, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";

jest.mock("../src/utils/scorerService", () => ({
  fetchPassportScore: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      score: 10,
      scorer_id: 335,
    });
  }),
}));

// Prepare a mock stamp
const mockStamp = {
  name: "mockProvider",
  index: 0,
  bit: 1,
};

const mockStamp1 = {
  name: "mockProvider1",
  index: 1,
  bit: 0,
};

jest.mock("../src/static/providerBitMapInfo.json", () => [
  {
    name: "mockProvider",
    index: 0,
    bit: 1,
  },

  {
    name: "mockProvider1",
    index: 1,
    bit: 0,
  },
]);

const defaultRequestData = {
  recipient: "0x123",
  expirationTime: NO_EXPIRATION,
  revocable: true,
  refUID: ZERO_BYTES32,
  value: BigInt(0),
};

describe("formatMultiAttestationRequestWithPassportAndScore", () => {
  it("should return formatted attestation request containing passport and score attestations", async () => {
    const validatedCredentials = [
      {
        credential: {
          credentialSubject: {
            provider: "mockProvider",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
          issuanceDate: "2023-05-10T11:00:14.986Z",
          expirationDate: "2023-08-10T11:00:14.986Z",
        } as unknown as VerifiableCredential,
        verified: true,
      },
      {
        credential: {
          credentialSubject: {
            provider: "mockProvider1",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
          issuanceDate: "2023-05-10T11:00:14.986Z",
          expirationDate: "2023-08-10T11:00:14.986Z",
        } as unknown as VerifiableCredential,
        verified: false,
      },
    ];

    const recipient = "0x123";

    const chainIdHex = "0x14a33";
    const result = await easPassportModule.formatMultiAttestationRequestWithPassportAndScore(
      validatedCredentials,
      recipient,
      chainIdHex
    );
    const scoreSchema = onchainInfo[chainIdHex].easSchemas.score.uid;
    const passportSchema = onchainInfo[chainIdHex].easSchemas.passport.uid;

    expect(result).toEqual([
      {
        schema: passportSchema,
        data: [
          {
            ...defaultRequestData,
            data: expect.any(String),
          },
        ],
      },
      {
        schema: scoreSchema,
        data: [
          {
            ...defaultRequestData,
            data: expect.any(String),
          },
        ],
      },
    ]);
  });
});

describe("formatMultiAttestationRequestWithScore", () => {
  it("should return formatted attestation request containing passport and score attestations", async () => {
    jest.spyOn(easStampModule, "encodeEasScore").mockReturnValue("0x00000000000000000000000");

    const recipient = "0x123";
    const chainIdHex = "0x14a33";
    const result = await easPassportModule.formatMultiAttestationRequestWithScore(recipient, chainIdHex);
    const scoreSchema = onchainInfo[chainIdHex].easSchemas.score.uid;

    expect(result).toEqual([
      {
        schema: scoreSchema,
        data: [
          {
            ...defaultRequestData,
            data: "0x00000000000000000000000",
          },
        ],
      },
    ]);
  });
});

describe("formatPassportAttestationData", () => {
  it("should format attestation data correctly", async () => {
    // Prepare a mock credential
    const mockCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "mockProvider",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const result: easPassportModule.PassportAttestationData = easPassportModule.formatPassportAttestationData([
      mockCredential,
    ]);

    // Check that the resulting providers array has the expected value
    // For the mockStamp, it should be [BigInt(1 << 1)]
    expect(result.providers).toEqual([BigInt(1 << mockStamp.bit)]);

    // Check that the info array contains an object with the expected values
    expect(result.info).toHaveLength(1);
    expect(result.info[0]).toMatchObject({
      hash: "0x" + Buffer.from(mockCredential.credentialSubject.hash.split(":")[1], "base64").toString("hex"),
      issuanceDate: BigInt(Math.floor(new Date(mockCredential.issuanceDate).getTime() / 1000)),
      expirationDate: BigInt(Math.floor(new Date(mockCredential.expirationDate).getTime() / 1000)),
      stampInfo: mockStamp,
    });
  });

  it("should return multiple provider bitmaps/bns if index exceeds range", async () => {
    // Prepare a mock credential
    const mockCredential = {
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "mockProvider",
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
    } as unknown as VerifiableCredential;

    const mockCredential1 = {
      credentialSubject: {
        hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
        provider: "mockProvider1",
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
    } as unknown as VerifiableCredential;

    const result: easPassportModule.PassportAttestationData = easPassportModule.formatPassportAttestationData([
      mockCredential,
      mockCredential1,
    ]);

    expect(result.providers).toEqual([BigInt(1 << mockStamp.bit), BigInt(1 << mockStamp1.bit)]);

    // Check that the info array contains an object with the expected values
    expect(result.info).toHaveLength(2);
    expect(result.info[0]).toMatchObject({
      hash: "0x" + Buffer.from(mockCredential.credentialSubject.hash.split(":")[1], "base64").toString("hex"),
      issuanceDate: BigInt(Math.floor(new Date(mockCredential.issuanceDate).getTime() / 1000)),
      expirationDate: BigInt(Math.floor(new Date(mockCredential.expirationDate).getTime() / 1000)),
      stampInfo: mockStamp,
    });
  });
  it("should throw an error if the provider is not supported", async () => {
    // Prepare a mock credential
    const mockCredential = {
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "newProvider",
      },
      issuer: "string",
      issuanceDate: "2023-01-01T00:00:00.000Z",
      expirationDate: "2023-12-31T23:59:59.999Z",
    } as unknown as VerifiableCredential;

    expect(() => easPassportModule.formatPassportAttestationData([mockCredential])).toThrow(
      `Provider ${mockCredential.credentialSubject.provider} not supported. Please contact support.`
    );
  });
});

describe("sortPassportAttestationData", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("should correctly sort the Attestation data", () => {
    const stamp1 = {
      name: "TestStamp1",
      index: 2,
      bit: 1,
    };

    const stamp2 = {
      name: "TestStamp2",
      index: 1,
      bit: 2,
    };

    const stamp3 = {
      name: "TestStamp3",
      index: 2,
      bit: 0,
    };

    const attestation: easPassportModule.PassportAttestationData = {
      providers: [BigInt(3), BigInt(1), BigInt(2)],
      info: [
        {
          hash: "0x123",
          issuanceDate: BigInt(1000),
          expirationDate: BigInt(2000),
          stampInfo: stamp1,
        },
        {
          hash: "0x456",
          issuanceDate: BigInt(1001),
          expirationDate: BigInt(2001),
          stampInfo: stamp2,
        },
        {
          hash: "0x789",
          issuanceDate: BigInt(1002),
          expirationDate: BigInt(2002),
          stampInfo: stamp3,
        },
      ],
    };

    const sortedAttestation: easPassportModule.AttestationData =
      easPassportModule.sortPassportAttestationData(attestation);

    expect(sortedAttestation.hashes).toEqual(["0x456", "0x789", "0x123"]);
    expect(sortedAttestation.issuancesDates).toEqual([BigInt(1001), BigInt(1002), BigInt(1000)]);
    expect(sortedAttestation.expirationDates).toEqual([BigInt(2001), BigInt(2002), BigInt(2000)]);
  });
});

describe("buildProviderBitMapInfo", () => {
  it("should correctly utilize the first bit of the new bitmap when a new bitmap is created", async () => {
    const stampNames = Array(257)
      .fill(null)
      .map((_, idx) => `stamp${idx}`);
    const groupStamps = stampNames.map((name) => ({ name }));
    const group = { name: "group1", stamps: groupStamps };
    const stampMetadata: easPassportModule.StampMetadata = [{ id: "1", name: "metadata1", groups: [group] }];

    const bitmapInfo = easPassportModule.mapBitMapInfo(stampMetadata);

    expect(bitmapInfo[bitmapInfo.length - 2]).toEqual({ bit: 255, index: 0, name: "stamp255" });
    expect(bitmapInfo[bitmapInfo.length - 1]).toEqual({ bit: 0, index: 1, name: "stamp256" });
  });
});
