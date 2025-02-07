import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import { platforms } from "@gitcoin/passport-platforms";

jest.unstable_mockModule("@gitcoin/passport-platforms", () => ({
  platforms,
  providers: {
    verify: jest.fn(async (type: string, payload: RequestPayload, context: ProviderContext) => {
      return Promise.resolve({
        valid: true,
        record: { key: "verified-condition" },
      });
    }),
  },
}));

jest.unstable_mockModule("../src/credentials.js", async () => {
  return {
    issueHashedCredential: jest.fn(),
  };
});

jest.unstable_mockModule("../src/bans.js", () => ({
  checkCredentialBans: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

import { VerifiableCredential, RequestPayload, ProviderContext, IssuedCredential } from "@gitcoin/passport-types";
import * as DIDKit from "@spruceid/didkit-wasm-node";
const { issueHashedCredential } = await import("../src/credentials.js");
const { verifyTypes, verifyProvidersAndIssueCredentials } = await import("../src/verification.js");
const { getIssuerKey } = await import("../src/issuers.js");
const { checkCredentialBans } = await import("../src/bans.js");
const {
  providers: { verify },
} = await import("@gitcoin/passport-platforms");

const createMockVerifiableCredential = (provider: string, address: string): VerifiableCredential => ({
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/security/suites/eip712sig-2021/v1"],
  type: ["VerifiableCredential", "EVMCredential"],
  credentialSubject: {
    id: `did:pkh:eip155:1:${address}`,
    "@context": {
      hash: "https://schema.org/Text",
      provider: "https://schema.org/Text",
      address: "https://schema.org/Text",
      challenge: "https://schema.org/Text",
      metaPointer: "https://schema.org/URL",
    },
    hash: "0x123456789",
    provider: provider,
    address: address,
    challenge: "test-challenge",
    metaPointer: "https://example.com/metadata",
  },
  issuer: "did:key:test-issuer",
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  proof: {
    "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
    type: "EthereumEip712Signature2021",
    proofPurpose: "assertionMethod",
    proofValue: "0xabcdef1234567890",
    verificationMethod: "did:key:test-verification",
    created: new Date().toISOString(),
    eip712Domain: {
      domain: {
        name: "GitcoinVerifiableCredential",
      },
      primaryType: "VerifiableCredential",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ],
        VerifiableCredential: [
          { name: "id", type: "string" },
          { name: "address", type: "string" },
        ],
      },
    },
  },
});

function getMockedIssuedCredential(provider: string, address: string): IssuedCredential {
  const credential: IssuedCredential = {
    credential: createMockVerifiableCredential(provider, address),
  };
  return credential;
}

describe("verifyTypes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.only("should call providers.verify for the 'regular' providers in providersByPlatform and accumulate values in the context", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
    };

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        // update the context
        context[`context-${provider}`] = true;
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const result = await verifyTypes(
      [
        ["provider-1", "provider-2"],
        ["provider-3", "provider-4"],
      ],
      payload
    );

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(4);
    expect(verifySpy).toHaveBeenCalledWith("provider-1", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-2", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-3", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-4", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });

    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "provider-1",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-3",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-4",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });

  it.only("should call providers.verify with proper providers for AllowList#... and DeveloperList#... types", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
    };

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const result = await verifyTypes(
      [
        ["AllowList#test-1", "AllowList#test-2"],
        ["DeveloperList#test-1#0x1234", "DeveloperList#test-2#0x5678"],
      ],
      payload
    );

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(4);
    expect(verifySpy).toHaveBeenCalledWith(
      "AllowList",
      {
        ...payload,
        proofs: {
          allowList: "test-1",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "AllowList",
      {
        ...payload,
        proofs: {
          allowList: "test-2",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "DeveloperList",
      {
        ...payload,
        proofs: {
          conditionName: "test-1",
          conditionHash: "0x1234",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "DeveloperList",
      {
        ...payload,
        proofs: {
          conditionName: "test-2",
          conditionHash: "0x5678",
        },
      },
      {}
    );
    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "AllowList#test-1",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "AllowList#test-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "DeveloperList#test-1#0x1234",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "DeveloperList#test-2#0x5678",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });

  it.only("should return an error if providers.verify throws", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
    };

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        if (provider === "test-1") {
          throw new Error("Some Error");
        }
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const result = await verifyTypes([["test-1"], ["test-2"]], payload);

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(2);
    expect(verifySpy).toHaveBeenCalledWith("test-1", payload, {});
    expect(verifySpy).toHaveBeenCalledWith("test-2", payload, {});
    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "test-1",
        verifyResult: {
          valid: false,
        },
        code: 400,
        error: "Unable to verify provider",
      },
      {
        type: "test-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });
});

describe("verifyProvidersAndIssueCredentials", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.only("should issue valid credentials via issueHashedCredentials", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
      signatureType: "EIP712",
    };

    const currentKey = getIssuerKey("EIP712");

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        // update the context
        context[`context-${provider}`] = true;
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const providersByPlatform = [
      ["provider-1", "provider-2"],
      ["provider-3", "provider-4"],
    ];
    await verifyProvidersAndIssueCredentials(providersByPlatform, mockAddress, payload);

    const verifyTypesSpy = verifyTypes as jest.Mock;

    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-1", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-2", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-3", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-4", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
  });

  it.only("should verify the issued credentials against the ban list", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
      signatureType: "EIP712",
    };

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        // update the context
        context[`context-${provider}`] = true;
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const providersByPlatform = [
      ["provider-1", "provider-2"],
      ["provider-3", "provider-4"],
    ];
    await verifyProvidersAndIssueCredentials(providersByPlatform, mockAddress, payload);

    expect(checkCredentialBans).toHaveBeenCalledTimes(1);
    expect(checkCredentialBans).toHaveBeenCalledWith(
      issuedCredentials.map((c) => ({
        credential: c,
        code: undefined,
        error: undefined,
        record: {
          key: "verified-condition",
          type: c.credentialSubject.provider,
          version: "0.0.0",
        },
      }))
    );
  });

  it.only("should override the provider if pii is provided", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
      signatureType: "EIP712",
    };
    const currentKey = getIssuerKey("EIP712");

    const verifySpy = (verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        // update the context
        context[`context-${provider}`] = true;
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition", pii: `pii-${provider}` },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const providersByPlatform = [
      ["provider-1", "provider-2"],
      ["provider-3", "provider-4"],
    ];
    const result = await verifyProvidersAndIssueCredentials(providersByPlatform, mockAddress, payload);

    expect(result).toEqual(
      issuedCredentials.map((c) => ({
        credential: c,
        code: undefined,
        error: undefined,
        record: {
          key: "verified-condition",
          type: c.credentialSubject.provider,
          pii: c.credentialSubject.provider?.split("#")[1],
          version: "0.0.0",
        },
      }))
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-1#pii-provider-1", pii: "pii-provider-1", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-2#pii-provider-2", pii: "pii-provider-2", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-3#pii-provider-3", pii: "pii-provider-3", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
    expect(issueHashedCredential).toHaveBeenCalledWith(
      DIDKit,
      currentKey,
      mockAddress,
      { type: "provider-4#pii-provider-4", pii: "pii-provider-4", version: "0.0.0", key: "verified-condition" },
      undefined,
      payload.signatureType
    );
  });
});
