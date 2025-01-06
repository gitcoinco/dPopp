import { RequestPayload } from "@gitcoin/passport-types";
import { getChallenge } from "../src/utils/challenge.js";

describe("getChallenge", () => {
  it("returns a challenge for SignerChallenge", () => {
    const requestPayload: RequestPayload = {
      type: "SignerChallenge",
      address: "0x1234567890123456789012345678901234567890",
      version: "",
    };

    const challenge = getChallenge(requestPayload);

    expect(challenge.valid).toBe(true);
    expect(challenge.record?.address).toEqual(requestPayload.address);
    expect(challenge.record?.type).toEqual(requestPayload.type);
    expect(challenge.record?.challenge).toMatch(/^I commit that this wallet is under my control/);
  });

  it("returns a challenge for Signer", () => {
    const requestPayload = {
      type: "Signer",
      address: "0x1234567890123456789012345678901234567890",
      signer: { address: "0x1234567890123456789012345678901234567890" },
    } as RequestPayload;

    const challenge = getChallenge(requestPayload);

    expect(challenge.valid).toBe(true);
    expect(challenge.record?.address).toEqual(requestPayload.signer.address);
    expect(challenge.record?.type).toEqual(requestPayload.type);
    expect(challenge.record?.challenge).toMatch(/^I commit that I wish to register all ETH stamps/);
  });

  it("returns a challenge for EVMBulkVerify", () => {
    const requestPayload = {
      type: "EVMBulkVerify",
      address: "0x1234567890123456789012345678901234567890",
    } as RequestPayload;

    const challenge = getChallenge(requestPayload);

    expect(challenge.valid).toBe(true);
    expect(challenge.record?.address).toEqual(requestPayload.address);
    expect(challenge.record?.type).toEqual(requestPayload.type);
    expect(challenge.record?.challenge).toMatch(/^I commit that I wish to verify all the selected EVM stamps/);
  });

  it("returns a challenge for custom provider", () => {
    const requestPayload = {
      type: "CustomProvider",
      address: "0x1234567890123456789012345678901234567890",
    } as RequestPayload;

    const challenge = getChallenge(requestPayload);

    expect(challenge.valid).toBe(true);
    expect(challenge.record?.address).toEqual(requestPayload.address);
    expect(challenge.record?.type).toEqual(requestPayload.type);
    expect(challenge.record?.challenge).toMatch(/^I commit that this stamp is my unique and only CustomProvider/);
  });

  it("returns an error when address is missing", () => {
    const requestPayload = {
      type: "SignerChallenge",
    } as RequestPayload;

    const challenge = getChallenge(requestPayload);

    expect(challenge.valid).toBe(false);
    expect(challenge.error).toEqual(["Missing address"]);
  });
});
