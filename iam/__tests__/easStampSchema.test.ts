import * as easStampModule from "../src/utils/easStampSchema.js";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { NO_EXPIRATION, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { parseUnits } from "ethers";
import onchainInfo from "../../deployments/onchainInfo.json";

jest.mock("../src/utils/scorerService", () => ({
  fetchPassportScore: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      score: 10,
      scorer_id: 335,
    });
  }),
}));

const ensProviderConfig = {
  platformGroup: "Account Name",
  providers: [
    {
      title: "Encrypted",
      name: "Ens",
      hash: "0xb4448bd57db012361e41665a60f3906dda48b4ffc1e4b8151cb2b6d431861fae",
    },
  ],
};

describe("eas encoding", () => {
  it("should use encodeEasStamp to format stamp data correctly", () => {
    const verifiableCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "Ens",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "string",
      expirationDate: "string",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const encodedData = easStampModule.encodeEasStamp(verifiableCredential);
    const stampSchemaEncoder = new SchemaEncoder("bytes32 provider, bytes32 hash");
    const decodedStampData = stampSchemaEncoder.decodeData(encodedData);
    expect(decodedStampData[0].value.value).toEqual(ensProviderConfig.providers[0].hash);
  });
});

it("should use encodeEasScore to format score data correctly", () => {
  const score = {
    score: 0.5,
    scorer_id: 1,
  };
  const encodedData = easStampModule.encodeEasScore(score);
  const scoreSchemaEncoder = new SchemaEncoder("uint256 score,uint32 scorer_id,uint8 score_decimals");
  const decodedScoreData = scoreSchemaEncoder.decodeData(encodedData);

  const decimals = 18;

  expect(decodedScoreData[0].value.value).toEqual(parseUnits(score.score.toString(), decimals));
  expect(decodedScoreData[1].value.value).toEqual(BigInt(score.scorer_id));
  expect(decodedScoreData[2].value.value).toEqual(BigInt(decimals));
});

const defaultRequestData = {
  recipient: "0x123",
  expirationTime: NO_EXPIRATION,
  revocable: true,
  refUID: ZERO_BYTES32,
  value: BigInt(0),
};

describe("formatMultiAttestationRequest", () => {
  it("should return formatted attestation request", async () => {
    const validatedCredentials = [
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential1",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
        } as unknown as VerifiableCredential,
        verified: true,
      },
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential2",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
        } as unknown as VerifiableCredential,
        verified: false,
      },
    ];

    const recipient = "0x123";

    const chainIdHex = "0x14a33";
    const result = await easStampModule.formatMultiAttestationRequest(validatedCredentials, recipient, chainIdHex);
    const scoreSchema = onchainInfo[chainIdHex].easSchemas.score.uid;

    expect(result).toEqual([
      {
        schema: process.env.EAS_GITCOIN_STAMP_SCHEMA,
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
