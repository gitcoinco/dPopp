import { RequestPayload } from "@gitcoin/passport-types";
import { getChallenge } from "../src/challenge.js";

describe("getChallenge", () => {
  it("Dummy test to keep jest happy - remove when fixing test file", () => {});

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
