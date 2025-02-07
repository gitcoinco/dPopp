import { VerifiableEip712Credential } from "@gitcoin/passport-types";
import { issueNullifiableCredential } from "../src/credentials";
import { HashNullifierGenerator, objToSortedArray } from "../src/nullifierGenerators";
import { getIssuerKey, getEip712Issuer } from "../src/issuers";
import * as DIDKit from "@spruceid/didkit-wasm-node";
import * as base64 from "@ethersproject/base64";

// ---- crypto lib for hashing
import { createHash } from "crypto";

const nullifierGenerator = HashNullifierGenerator({ key: "test" });
const nullifierGenerators = [nullifierGenerator];

// this would need to be a valid key but we've mocked out didkit (and no verifications are made)
describe("EIP712 credential", function () {
  it("can issue credentials with valid EIP712 signature, and ethers can validate the credential", async () => {
    const originalEthers = jest.requireActual("ethers");

    const record = {
      type: "Simple",
      version: "Test-Case-1",
      address: "0x0",
    };

    const expectedHash: string =
      "v0.0.0:" +
      base64.encode(
        createHash("sha256")
          .update(getIssuerKey("EIP712"))
          .update(JSON.stringify(objToSortedArray(record)))
          .digest()
      );

    // Details of this credential are created by issueNullifiableCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueNullifiableCredential({
      DIDKit,
      issuerKey: getIssuerKey("EIP712"),
      address: "0x0",
      record,
      expiresInSeconds: 100,
      signatureType: "EIP712",
      nullifierGenerators,
    });
    const signedCredential = credential as VerifiableEip712Credential;

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

    const expectedEthSignerAddress = getEip712Issuer().split(":").pop();
    expect(signerAddress.toLowerCase()).toEqual(expectedEthSignerAddress);
    expect(signedCredential.credentialSubject.hash).toEqual(expectedHash);
  });
});
