// ---- Testing libraries
import request from "supertest";

// ---- Test subject
import { app } from "../src/index.js";
import { getEip712Issuer } from "../src/issuers.js";

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

jest.mock("../src/utils/verifyDidChallenge", () => ({
  verifyDidChallenge: jest.fn().mockImplementation(() => true),
}));

jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers") as any;

  return {
    ...originalModule,
    getAddress: jest
      .fn()
      .mockImplementationOnce(() => {
        return "0x1";
      })
      .mockImplementationOnce(() => {
        return "0xAbC";
      })
      .mockImplementationOnce(() => {
        return "0xAbC";
      }),
    verifyMessage: jest.fn().mockImplementation(() => {
      return "string";
    }),
  };
});

describe("POST /verify", function () {
  it("produces the same hash for an additional signer as if the passport is used directly", async () => {
    const challengeForReqWithAdditionalSigner = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x1",
        provider: "challenge-any",
        address: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payloadWithAdditionalSigner = {
      type: "any",
      types: ["SimpleEvm"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0xabc",
        signature: "0x123456",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    const challengeForReqWithoutAdditionalSigner = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xAbC",
        provider: "challenge-any",
        address: "0xabc",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payloadWithoutAdditionalSigner = {
      type: "any",
      types: ["SimpleEvm"],
      address: "0xabc",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    const res = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge: challengeForReqWithAdditionalSigner, payload: payloadWithAdditionalSigner })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const hashWithAdditionalSigner = res.body[0].credential.credentialSubject.hash;

    const res2 = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge: challengeForReqWithoutAdditionalSigner, payload: payloadWithoutAdditionalSigner })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const hashWithoutAdditionalSigner = res2.body[0].credential.credentialSubject.hash;

    expect(hashWithAdditionalSigner).toEqual(hashWithoutAdditionalSigner);
  });
});
