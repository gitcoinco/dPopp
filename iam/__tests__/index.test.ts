// ---- Testing libraries
import request from "supertest";
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { PassportCache, providers } from "@gitcoin/passport-platforms";

// ---- Test subject
import { app } from "../src/index.js";
import { getAttestationDomainSeparator } from "../src/utils/attestations.js";

// ---- Types
import {
  ErrorResponseBody,
  ProviderContext,
  RequestPayload,
  ValidResponseBody,
  VerifiableCredential,
  VerifiableEip712Credential,
  VerifiedPayload,
} from "@gitcoin/passport-types";

import { MultiAttestationRequest, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

import { parseEther } from "ethers";
import * as easFeesMock from "../src/utils/easFees.js";
import * as identityMock from "@gitcoin/passport-identity";
import * as easSchemaMock from "../src/utils/easStampSchema.js";
import * as easPassportSchemaMock from "../src/utils/easPassportSchema.js";
import { IAMError } from "../src/utils/scorerService.js";
import { VerifyDidChallengeBaseError, verifyDidChallenge } from "../src/utils/verifyDidChallenge.js";
import { getEip712Issuer } from "../src/issuers.js";
import { toJsonObject } from "../src/utils/json.js";

const issuer = getEip712Issuer();

jest.mock("../src/utils/oprf", () => ({
  recordToNullifier: async ({ record }: any) => {
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256");

    hash.update(JSON.stringify(record));

    return hash.digest("hex");
  },
}));

jest.mock("../src/utils/bans", () => ({
  checkCredentialBans: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("../src/utils/revocations", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("../src/utils/verifyDidChallenge", () => ({
  verifyDidChallenge: jest.fn().mockImplementation(() => "0x0"),
  VerifyDidChallengeBaseError: jest.requireActual("../src/utils/verifyDidChallenge").VerifyDidChallengeBaseError,
}));

jest.mock("../src/index", () => {
  // Require the actual module
  const actualModule = jest.requireActual("../src/index");
  return {
    ...actualModule, // Spread all original functions and attributes
    validIssuers: new Set([]),
  };
});

jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");

  return {
    ...originalModule,
    getAddress: jest.fn().mockImplementation(() => {
      return "0x0";
    }),
    verifyMessage: jest.fn().mockImplementation(() => {
      return "string";
    }),
  };
});

jest.mock("@ethereum-attestation-service/eas-sdk", () => {
  return {
    SchemaEncoder: jest.fn().mockImplementation(() => {
      return {
        encodeData: jest.fn().mockImplementation(() => {
          return "0x1234";
        }),
      };
    }),
    ZERO_BYTES32: "0x0000000000000000000000000000000000000000000000000000000000000000",
    NO_EXPIRATION: 0,
  };
});

jest.mock("moralis", () => ({
  EvmApi: {
    token: {
      getTokenPrice: jest.fn().mockResolvedValue({
        result: { usdPrice: 3000 },
      }),
    },
  },
}));

const chainIdHex = "0xa";

describe("POST /challenge", function () {
  it("handles valid challenge requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: "0x0",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  it("handles valid challenge request with signatureType", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: "0x0",
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  it("handles missing address from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Missing address from challenge request body");
  });

  it("handles missing type from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Missing type from challenge request body");
  });

  it("handles malformed payload from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = "bad :(";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);
  });
});

describe("POST /verify", function () {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles valid wallet-signed challenge requests", async () => {
    // Mock the did-session method to throw an error, to ensure we're not calling it
    (verifyDidChallenge as jest.Mock).mockImplementation(() => {
      throw new VerifyDidChallengeBaseError("Verification failed, challenge mismatch");
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid did-session signed challenge requests", async () => {
    (verifyDidChallenge as jest.Mock).mockImplementationOnce(() => {
      return "0x123456";
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x123456",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
      },
    };

    const signedChallenge = {
      signatures: [
        {
          protected: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ",
          signature: "0x0",
        },
      ],
      payload: "I commit that this wallet is under my control",
      cid: [0, 1, 2],
      cacao: [3, 4, 5],
      issuer: "0x123456",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload, signedChallenge })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles invalid did-session signed challenge requests", async () => {
    (verifyDidChallenge as jest.Mock).mockImplementationOnce(() => {
      throw new VerifyDidChallengeBaseError("Verification failed, challenge mismatch");
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x123456",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
      },
    };

    const signedChallenge = {
      signatures: [
        {
          protected: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ",
          signature: "0x0",
        },
      ],
      payload: "I commit that this wallet is under my control",
      cid: [0, 1, 2],
      cacao: [3, 4, 5],
      issuer: "0x123456",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload, signedChallenge })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Invalid challenge signature: Error");
  });
  it("handles valid verify requests with EIP712 signature", async () => {
    // challenge received from the challenge endpoint
    const eip712Key = process.env.IAM_JWK_EIP712;
    const eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);
    const challenge = {
      issuer: eip712Issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid verify requests with EIP712 signature, and ethers can validate the credential", async () => {
    const originalEthers = jest.requireActual("ethers");
    // challenge received from the challenge endpoint
    const eip712Key = process.env.IAM_JWK_EIP712;
    const eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);
    const challenge = {
      issuer: eip712Issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const signedCredential = response.body.credential as VerifiableEip712Credential;

    const standardizedTypes = signedCredential.proof.eip712Domain.types;
    const domain = signedCredential.proof.eip712Domain.domain;

    // Delete EIP712Domain so that ethers does not complain about the ambiguous primary type
    delete standardizedTypes.EIP712Domain;

    const signerAddress = originalEthers.verifyTypedData(
      domain,
      standardizedTypes,
      signedCredential,
      signedCredential.proof.proofValue
    );

    const signerIssuedCredential = signerAddress.toLowerCase() === signedCredential.issuer.split(":").pop();

    if (signerIssuedCredential) {
      const splitSignature = originalEthers.Signature.from(signedCredential.proof.proofValue);
      return splitSignature;
    }
  });

  it("handles valid challenge request returning PII", async () => {
    const provider = "ClearTextSimple";
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: `challenge-${provider}`,
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: provider,
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const expectedProvider = `${provider}#Username`;

    // check that PII is returned with provider
    expect((response.body as ValidResponseBody).credential.credentialSubject.provider).toEqual(expectedProvider);
    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid challenge requests with multiple types", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
  });

  it("handles valid challenge requests with multiple types, and acumulates values between provider calls", async () => {
    // Just pick the first 3 providers
    const providerNamesKeys = Object.keys(providers._providers);
    const provider_1 = providerNamesKeys[0];
    const provider_2 = providerNamesKeys[1];
    const provider_3 = providerNamesKeys[2];

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: `challenge-${provider_1}`,
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: provider_1,
      types: [provider_1, provider_2, provider_3],
      address: "0x0",
      proofs: {
        code: "SECRET_CODE",
      },
    };

    // spy on the providers
    jest
      .spyOn(providers._providers[provider_1], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        context["update_1"] = true;
        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "10",
          },
        };
      });
    jest
      .spyOn(providers._providers[provider_2], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        context["update_2"] = true;
        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "25",
          },
        };
      });
    const gitcoinGte100 = jest
      .spyOn(providers._providers[provider_3], "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            numGrantsContributeToGte: "100",
          },
        };
      });

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);

    expect(gitcoinGte100).toHaveBeenCalledWith(
      {
        // issuer: issuer,
        type: provider_1,
        types: [provider_1, provider_2, provider_3],
        address: "0x0",
        proofs: { code: "SECRET_CODE" },
      },
      // The expected acumulated value in the context
      { update_1: true, update_2: true }
    );
  });

  it("handles invalid challenge requests where credential.issuer is unknown", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: "unknown",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge requests where challenge credential subject signature checks fail", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress#challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Invalid challenge 'signer' and 'provider'");
  });

  it("handles invalid challenge requests where 'valid' proof is passed as false (test against Simple Provider)", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(403)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Proof is not valid");
  });

  it("handles exception if verify credential throws", async () => {
    (identityMock.verifyCredential as jest.Mock).mockRejectedValueOnce(new Error("Verify Credential Error"));

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress",
        type: "challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload: Error");
  });

  it("handles invalid challenge request passed by the additional signer", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        challenge: {
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true).mockResolvedValue(false);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);
  });

  it("handles valid challenge request passed by the additional signer", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        signature: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    response.body.forEach((item: any) => {
      expect(item).toHaveProperty("record");
      expect(item.record).toMatchObject({ type: "Simple" });
    });
  });
  it("should not issue credential for additional signer when invalid address is provided", async () => {
    (identityMock.verifyCredential as jest.Mock).mockResolvedValueOnce(true);
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0xbadAddress",
        signature: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);
  });
});

describe("POST /check", function () {
  it("handles valid check requests", async () => {
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[0].valid).toBe(true);
    expect(response.body[0].type).toEqual("Simple");
  });

  it("handles valid check request with AllowListStamp", async () => {
    const allowProvider = "AllowList#test";
    jest
      .spyOn(providers._providers.AllowList, "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            allowList: "test",
          },
        };
      });
    const payload = {
      types: ["Simple", allowProvider],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[1].valid).toBe(true);
    expect(response.body[1].type).toEqual("AllowList#test");
  });

  it("handles valid check request with DeveloperList stamp", async () => {
    const customGithubProvider = "DeveloperList#test#0xtest";
    jest
      .spyOn(providers._providers.DeveloperList, "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            conditionName: "test",
            conditionHash: "0xtest",
          },
        };
      });
    const payload = {
      types: ["Simple", customGithubProvider],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[1].valid).toBe(true);
    expect(response.body[1].type).toEqual("DeveloperList#test#0xtest");
  });

  it("handles valid check requests with multiple types", async () => {
    const payload = {
      types: ["Simple", "AnotherType"],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.length).toBe(2);

    const simple = response.body.find((item: any) => item.type === "Simple");
    const anotherType = response.body.find((item: any) => item.type === "AnotherType");

    expect(simple.valid).toBe(true);
    expect(anotherType.valid).toBe(false);
    expect(anotherType.error).toBeDefined();
    expect(anotherType.code).toBeDefined();
  });

  it("handles missing payload in the check request body", async () => {
    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({})
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Incorrect payload");
  });

  it("handles malformed payload in the check request body", async () => {
    const payload = "bad :(";

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Incorrect payload");
  });

  it("handles empty types array in the check request body", async () => {
    const payload = {
      types: [] as unknown as string[],
      address: "0x0",
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.length).toEqual(0);
  });
});

const mockMultiAttestationRequestWithPassportAndScore: MultiAttestationRequest[] = [
  {
    schema: "0x853a55f39e2d1bf1e6731ae7148976fbbb0c188a898a233dba61a233d8c0e4a4",
    data: [
      {
        recipient: "0x0987654321098765432109876543210987654321",
        data: easSchemaMock.encodeEasScore({
          score: 23.45,
          scorer_id: 123,
        }),
        expirationTime: NO_EXPIRATION,
        revocable: false,
        refUID: ZERO_BYTES32,
        value: BigInt("25000000000000000"),
      },
    ],
  },
  {
    schema: "0x853a55f39e2d1bf1e6731ae7148976fbbb0c188a898a233dba61a233d8c0e4a4",
    data: [
      {
        recipient: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        data: easSchemaMock.encodeEasScore({
          score: 23.45,
          scorer_id: 123,
        }),
        expirationTime: NO_EXPIRATION,
        revocable: true,
        refUID: ZERO_BYTES32,
        value: BigInt("25000000000000000"),
      },
    ],
  },
];

describe("POST /eas", () => {
  let getEASFeeAmountSpy: jest.SpyInstance;
  let formatMultiAttestationRequestSpy: jest.SpyInstance;

  beforeEach(() => {
    getEASFeeAmountSpy = jest
      .spyOn(easFeesMock, "getEASFeeAmount")
      .mockReturnValue(Promise.resolve(parseEther("0.025")));
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  it("handles valid requests including some invalid credentials", async () => {
    formatMultiAttestationRequestSpy = jest
      .spyOn(easSchemaMock, "formatMultiAttestationRequest")
      .mockReturnValue(Promise.resolve(mockMultiAttestationRequestWithPassportAndScore));
    const nonce = 0;
    const failedCredential = {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: ["VerifiableCredential", "Stamp"],
      issuer: "BAD_ISSUER",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
        provider: "failure",
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
      },
      expirationDate: "9999-12-31T23:59:59Z",
    };

    const credentials = [failedCredential];

    const expectedPayload = {
      error: {
        invalidCredentials: [failedCredential],
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    console.error("ERROR:");
    console.error(response.body);
    console.error(expectedPayload);
    expect(response.body).toEqual(expectedPayload);
  });

  it("properly formats domain separator", () => {
    const domainSeparator = getAttestationDomainSeparator("0xa");
    expect(domainSeparator).toEqual({
      name: "GitcoinVerifier",
      version: "1",
      chainId: "10",
      verifyingContract: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
    });
  });

  it("handles request with only invalid credentials", async () => {
    formatMultiAttestationRequestSpy = jest
      .spyOn(easSchemaMock, "formatMultiAttestationRequest")
      .mockReturnValue(Promise.resolve([]));
    const nonce = 0;
    const failedCredential = {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: ["VerifiableCredential", "Stamp"],
      issuer: "BAD_ISSUER",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
        provider: "failure",
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
      },
      expirationDate: "9999-12-31T23:59:59Z",
    };

    const credentials = [failedCredential];
    const expectedPayload = {
      error: {
        invalidCredentials: [failedCredential],
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual(expectedPayload);
  });

  it("handles missing stamps in the request body", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No stamps provided");
  });

  it("handles bad chain ID", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex: "0x694206969" })
      .set("Accept", "application/json")
      .expect(404)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No onchainInfo found for chainId 0x694206969");
  });

  it("handles invalid recipient in the request body", async () => {
    const nonce = 0;
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("returns the fee information in the response as wei units", async () => {
    formatMultiAttestationRequestSpy = jest
      .spyOn(easSchemaMock, "formatMultiAttestationRequest")
      .mockReturnValue(Promise.resolve(mockMultiAttestationRequestWithPassportAndScore));
    const nonce = 0;
    const expectedFeeUsd = parseFloat(process.env.EAS_FEE_USD);

    expect(expectedFeeUsd).toBeDefined();
    expect(typeof expectedFeeUsd).toBe("number");
    expect(expectedFeeUsd).toBeGreaterThan(1);

    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const expectedPayload = {
      passport: {
        multiAttestationRequest: toJsonObject(mockMultiAttestationRequestWithPassportAndScore),
        fee: "25000000000000000",
        nonce,
      },
      signature: expect.any(Object),
      invalidCredentials: [] as VerifiableCredential[],
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject(expectedPayload);
    expect(getEASFeeAmountSpy).toHaveBeenCalledTimes(1);
    expect(getEASFeeAmountSpy).toHaveBeenCalledWith(expectedFeeUsd);
  });
  it("should throw a 400 error if every credentialSubject.id is not equivalent", async () => {
    const nonce = 0;
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000001",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHla=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Every credential's id must be equivalent");
  });
});

describe("POST /eas/passport", () => {
  let formatMultiAttestationRequestSpy: jest.SpyInstance;

  beforeEach(() => {
    (identityMock.verifyCredential as jest.Mock).mockReset();
    formatMultiAttestationRequestSpy = jest
      .spyOn(easPassportSchemaMock, "formatMultiAttestationRequestWithPassportAndScore")
      .mockResolvedValue(mockMultiAttestationRequestWithPassportAndScore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles missing stamps in the request body", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No stamps provided");
  });

  it("handles invalid recipient in the request body", async () => {
    const nonce = 0;
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("should throw a 400 error if every credentialSubject.id is not equivalent", async () => {
    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000001";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000002",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000003",
          provider: "test1",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Every credential's id must be equivalent to that of the recipient");
  });

  it("successfully verifies and formats passport", async () => {
    jest.spyOn(PassportCache.prototype, "init").mockImplementation(() => Promise.resolve());
    jest.spyOn(PassportCache.prototype, "set").mockImplementation(() => Promise.resolve());
    jest.spyOn(PassportCache.prototype, "get").mockImplementation((key: any) => {
      if (key === "ethPrice") {
        return Promise.resolve("3000");
      } else if (key === "ethPriceLastUpdate") {
        return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
      }
    });
    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.passport.multiAttestationRequest).toEqual(
      toJsonObject(mockMultiAttestationRequestWithPassportAndScore)
    );
    expect(response.body.passport.nonce).toEqual(nonce);
    expect(identityMock.verifyCredential).toHaveBeenCalledTimes(credentials.length);
    expect(formatMultiAttestationRequestSpy).toHaveBeenCalled();
  });

  it("handles error during the formatting of the passport", async () => {
    formatMultiAttestationRequestSpy.mockRejectedValue(new IAMError("Formatting error"));

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain passport, IAMError: Formatting error");
  });

  it("handles error during credential verification", async () => {
    (identityMock.verifyCredential as jest.Mock).mockRejectedValueOnce(new Error("Verification error"));

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain passport, Error: Verification error");
  });
});

describe("verifyTypes", () => {});
