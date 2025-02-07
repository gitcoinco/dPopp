import { jest } from "@jest/globals";

export const keyToDID = jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY"));

export const keyToVerificationMethod = jest.fn(() => Promise.resolve("did:key:PUBLIC_KEY#PUBLIC_KEY"));

export const issueCredential = jest.fn((credential) =>
  Promise.resolve(
    JSON.stringify({
      ...JSON.parse(credential),
      proof: {},
    })
  )
);
export const verifyCredential = jest.fn(() =>
  Promise.resolve(
    JSON.stringify({
      checks: [],
      warnings: [],
      errors: [],
    })
  )
);

export const clearDidkitMocks = () => {
  keyToDID.mockClear();
  keyToVerificationMethod.mockClear();
  issueCredential.mockClear();
  verifyCredential.mockClear();
};
