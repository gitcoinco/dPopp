import { JsonRpcSigner } from "@ethersproject/providers";
// BrightId Shared Types
export { BrightIdProcedureResponse, BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "./brightid";

import { MultiAttestationRequest } from "@ethereum-attestation-service/eas-sdk";
import { JWSSignature } from "dids";

// Typing for required parts of DIDKit
export type DIDKitLib = {
  verifyCredential: (vc: string, proofOptions: string) => Promise<string>;
  issueCredential: (credential: string, proofOptions: string, key: string) => Promise<string>;
  keyToDID: (method_pattern: string, jwk: string) => string;
  keyToVerificationMethod: (method_pattern: string, jwk: string) => Promise<string>;
  /**
   * @param {string} credential
   * @param {string} linked_data_proof_options
   * @param {string} public_key
   * @returns {Promise<any>}
   */
  prepareIssueCredential(credential: string, linked_data_proof_options: string, public_key: string): Promise<any>;
} & { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

// rough outline of a VerifiableCredential
export type VerifiableEd25519Credential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string }[];
    hash?: string;
    provider?: string;
    address?: string;
    challenge?: string;
    metaPointer?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof?: {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    created: string;
    jws: string;
    eip712Domain?: {
      primaryType: string;
      types: {
        [key: string]: {
          name: string;
          type: string;
        }[];
      };
    };
  };
};

export type VerifiableEip712Credential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string };

    // Deprecated, should be removed once existing
    // credentials are expired
    hash?: string;

    nullifiers?: string[];
    provider?: string;
    address?: string;
    challenge?: string;
    metaPointer?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof: {
    "@context": string;
    type: string;
    proofPurpose: string;
    proofValue: string;
    verificationMethod: string;
    created: string;
    eip712Domain: {
      domain: {
        name: string;
      };
      primaryType: string;
      types: {
        [key: string]: {
          name: string;
          type: string;
        }[];
      };
    };
  };
};

/// Define a type for the credential as it is stored in compose
/// This will be identical to VerifiableEip712Credential, with some characters like `@` escaped
// being changed to `_`
export type VerifiableEip712CredentialComposeEncoded = {
  _context: string[];
  type: string[];
  credentialSubject: {
    id: string;
    _context: { [key: string]: string };

    // Deprecated, should be removed once existing
    // credentials are expired
    hash?: string;

    nullifiers?: string[];
    provider?: string;
    address?: string;
    challenge?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof: {
    _context: string;
    type: string;
    proofPurpose: string;
    proofValue: string;
    verificationMethod: string;
    created: string;
    eip712Domain: {
      domain: {
        name: string;
      };
      primaryType: string;
      types: {
        [key: string]: {
          name: string;
          type: string;
        }[];
      };
    };
  };
};
export type VerifiableCredential = VerifiableEd25519Credential | VerifiableEip712Credential;

// A ProviderContext is used as a temporary storage so that providers can can share data
// between them, in case multiple VCs are requests in one http request
export type ProviderContext = {
  [key: string]: unknown;
};

export type SignatureType = "EIP712" | "Ed25519";

export type SignedDidChallenge = {
  signatures: JWSSignature[];
  payload: any;
  cid: number[];
  cacao: number[];
  issuer: string;
};

// values received from client and fed into the verify route
export type RequestPayload = {
  type: string;
  types?: string[];
  address: string;
  version: string;
  proofs?: {
    [k: string]: string;
  };
  jsonRpcSigner?: JsonRpcSigner;
  challenge?: string;
  signatureType?: SignatureType;
};

// response Object return by verify procedure
export type ChallengePayload = {
  valid: boolean;
  error?: string[];
  // This will overwrite the record presented in the Payload
  record?: {
    challenge: string;
  } & { [k: string]: string };
};

// response Object return by verify procedure
export type VerifiedPayload = {
  valid: boolean;
  // failureReason?: string;
  errors?: string[];
  // This will be combined with the ProofRecord (built from the verified content in the Payload)
  record?: { [k: string]: string };
  expiresInSeconds?: number;
};

export type CheckRequestBody = {
  payload: RequestPayload;
};

export type CheckResponseBody = {
  valid: boolean;
  type: string;
  error?: string;
  code?: number;
};

// these values are placed into a sha256 along with the IAM_PRIVATE_KEY to generate a deterministic but protected hash of the PII info
export type ProofRecord = {
  type: string;
  version: string;
  username?: string;
  email?: string;
  proofMsg?: string;
} & { [k: string]: string };

// IAM HTTP Request body types
export type ChallengeRequestBody = {
  payload: RequestPayload;
};
export type VerifyRequestBody = {
  challenge: VerifiableCredential;
  payload: RequestPayload;
  signedChallenge?: SignedDidChallenge;
};

// IAM HTTP Response body types
export type ValidResponseBody = {
  credential: VerifiableCredential;
  record?: ProofRecord;
};
export type ErrorResponseBody = {
  error?: string;
  code?: number;
};
export type CredentialResponseBody = ValidResponseBody | ErrorResponseBody;

// Issued Credential response
export type IssuedChallenge = {
  challenge: VerifiableCredential;
};
export type IssuedCredential = {
  credential: VerifiableCredential;
};

// Issued Credential and support material returned when fetching the VerifiableCredential
export type VerifiableCredentialRecord = {
  signature: string;
  challenge: VerifiableCredential;
  error?: string;
  record?: ProofRecord;
  credential?: VerifiableCredential;
  credentials?: CredentialResponseBody[];
};

export type Stamp = {
  id?: number;
  provider: PROVIDER_ID;
  credential: VerifiableEd25519Credential | VerifiableEip712Credential;
};

// StampPatch should have "provider" mandatory and "credential" optional
export type StampPatch = Pick<Stamp, "provider"> & Partial<Pick<Stamp, "credential">>;

export type ComposeDBSaveStatus = "saved" | "failed";
export type ComposeDBMetadataRequest = {
  id: number;
  compose_db_save_status: ComposeDBSaveStatus;
  compose_db_stream_id: string | undefined;
};

export type SecondaryStorageAddResponse = {
  provider: string;
  secondaryStorageId?: string;
  secondaryStorageError?: string;
};

export type SecondaryStorageDeleteResponse = {
  secondaryStorageId: string;
  secondaryStorageError?: string;
};

export type SecondaryStorageBulkPatchResponse = {
  adds: SecondaryStorageAddResponse[];
  deletes: SecondaryStorageDeleteResponse[];
};

export type Passport = {
  issuanceDate?: Date;
  expiryDate?: Date;
  stamps: Stamp[];
};

export type PassportLoadStatus =
  | "Success"
  | "DoesNotExist"
  | "ExceptionRaised"
  | "StampCacaoError"
  | "PassportCacaoError";

export type PassportLoadErrorDetails = {
  stampStreamIds?: string[];
  messages?: string[];
};

export type PassportLoadResponse = {
  passport?: Passport;
  status: PassportLoadStatus;
  errorDetails?: PassportLoadErrorDetails;
};

export type PassportAttestation = {
  multiAttestationRequest: MultiAttestationRequest[];
  nonce: number;
  fee: any;
};

export type EasPayload = {
  passport: PassportAttestation;
  signature: {
    v: number;
    r: string;
    s: string;
  };
  invalidCredentials: VerifiableCredential[];
  error?: string;
};

export type EasRequestBody = {
  nonce: number;
  recipient: string;
  credentials?: VerifiableCredential[];
  chainIdHex: string;
  customScorerId?: number;
};

// Passport DID
export type DID = string;

export type PLATFORM_ID =
  | "Google"
  | "Ens"
  | "Twitter"
  | "POAP"
  | "Facebook"
  | "Brightid"
  | "Github"
  | "Gitcoin"
  | "Linkedin"
  | "Discord"
  | "Signer"
  | "Snapshot"
  | "ETH"
  | "GtcStaking"
  | "NFT"
  | "Lens"
  | "GnosisSafe"
  | "Coinbase"
  | "GuildXYZ"
  | "Hypercerts"
  | "PHI"
  | "Holonym"
  | "PhoneVerification"
  | "Idena"
  | "Civic"
  | "GrantsStack"
  | "ZkSync"
  | "TrustaLabs"
  | "Outdid"
  | "AllowList"
  | "Binance"
  | "DeveloperList"
  | `Custom#${string}`;

export type PLATFORM_CATEGORY = {
  name: string;
  id?: string;
  description: string;
  platforms: PLATFORM_ID[];
};

export type PROVIDER_ID =
  | "Signer"
  | "Google"
  | "Ens"
  | "POAP"
  | "Facebook"
  | "FacebookProfilePicture"
  | "Brightid"
  | "Github"
  | "TenOrMoreGithubFollowers"
  | "FiftyOrMoreGithubFollowers"
  | "ForkedGithubRepoProvider"
  | "StarredGithubRepoProvider"
  | "FiveOrMoreGithubRepos"
  | "githubContributionActivityGte#30"
  | "githubContributionActivityGte#60"
  | "githubContributionActivityGte#120"
  | "GitcoinContributorStatistics#totalContributionAmountGte#10"
  | "GitcoinContributorStatistics#totalContributionAmountGte#100"
  | "GitcoinContributorStatistics#totalContributionAmountGte#1000"
  | "GitcoinContributorStatistics#numRoundsContributedToGte#1"
  | "GitcoinContributorStatistics#numGr14ContributionsGte#1"
  | "Linkedin"
  | "Discord"
  | "Snapshot"
  | "SnapshotProposalsProvider"
  | "ethPossessionsGte#1"
  | "ethPossessionsGte#10"
  | "ethPossessionsGte#32"
  | "FirstEthTxnProvider"
  | "EthGTEOneTxnProvider"
  | "EthGasProvider"
  | "SelfStakingBronze"
  | "SelfStakingSilver"
  | "SelfStakingGold"
  | "NFT"
  | "NFTScore#50"
  | "NFTScore#75"
  | "NFTScore#90"
  | "ZkSyncEra"
  | "zkSyncScore#20"
  | "zkSyncScore#50"
  | "zkSyncScore#5"
  | "Lens"
  | "GnosisSafe"
  | "CoinbaseDualVerification"
  | "CoinbaseDualVerification2"
  | "GuildAdmin"
  | "GuildPassportMember"
  | "Hypercerts"
  | "HolonymGovIdProvider"
  | "HolonymPhone"
  | "IdenaState#Newbie"
  | "IdenaState#Verified"
  | "IdenaState#Human"
  | "CivicCaptchaPass"
  | "CivicUniquenessPass"
  | "CivicLivenessPass"
  | "GrantsStack3Projects"
  | "GrantsStack5Projects"
  | "GrantsStack7Projects"
  | "GrantsStack2Programs"
  | "GrantsStack4Programs"
  | "GrantsStack6Programs"
  | "TrustaLabs"
  | "BeginnerCommunityStaker"
  | "ExperiencedCommunityStaker"
  | "TrustedCitizen"
  | "ETHScore#50"
  | "ETHScore#75"
  | "ETHScore#90"
  | "ETHDaysActive#50"
  | "ETHGasSpent#0.25"
  | "ETHnumTransactions#100"
  | "Outdid"
  | "AllowList"
  | `AllowList#${string}`
  | "BinanceBABT"
  | "BinanceBABT2"
  | `DeveloperList#${string}#${string}`;

export type StampBit = {
  bit: number;
  index: number;
  name: string;
};
