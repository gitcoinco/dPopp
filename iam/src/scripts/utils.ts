import { BigNumber } from "ethers";

export interface UserStakes {
  selfStake?: BigNumber;
  communityStake?: BigNumber;
}

export interface Output {
  ScoreType: string;
  Score: Promise<number> | number;
  GTCStaked: number;
  AdditionalCriteria?: object;
}

export interface VerificationResults {
  valid?: boolean;
  type: string;
  code?: number;
  error?: string;
}

export interface Checkpoint {
  lastProcessedAddress?: string; // This can be expanded as per your needs
};

export const GITCOIN_PASSPORT_WEIGHTS = [
  { name: "Brightid", score: "0.689" },
  // {name: "CivicCaptchaPass", score: "1"},
  // {name: "CivicLivenessPass", score: "2.25"},
  // {name: "CivicUniquenessPass", score: "2.25"},
  { name: "CommunityStakingBronze", score: "1.27" },
  { name: "CommunityStakingGold", score: "1.27" },
  { name: "CommunityStakingSilver", score: "1.27" },
  { name: "Ens", score: "2.2" },
  { name: "EthGasProvider", score: "2.4" },
  { name: "EthGTEOneTxnProvider", score: "1.27" },
  { name: "ethPossessionsGte#1", score: "1.79" },
  { name: "ethPossessionsGte#10", score: "1.27" },
  { name: "ethPossessionsGte#32", score: "1.27" },
  { name: "FirstEthTxnProvider", score: "1.16" },
  // {name: "GitcoinContributorStatistics#numGr14ContributionsGte#1", score: "1.41"},
  // {name: "GitcoinContributorStatistics#numGrantsContributeToGte#1", score: "1.57"},
  // {name: "GitcoinContributorStatistics#numGrantsContributeToGte#10", score: "2.30"},
  // {name: "GitcoinContributorStatistics#numGrantsContributeToGte#100", score: "0.52"},
  // {name: "GitcoinContributorStatistics#numGrantsContributeToGte#25", score: "1.48"},
  // {name: "GitcoinContributorStatistics#numRoundsContributedToGte#1", score: "1.57"},
  // {name: "GitcoinContributorStatistics#totalContributionAmountGte#10", score: "1.53"},
  // {name: "GitcoinContributorStatistics#totalContributionAmountGte#100", score: "1.37"},
  // {name: "GitcoinContributorStatistics#totalContributionAmountGte#1000", score: "1.18"},
  { name: "GnosisSafe", score: "2.65" },
  { name: "GuildAdmin", score: "0.689" },
  { name: "GuildMember", score: "0.689" },
  { name: "GuildPassportMember", score: "0.689" },
  { name: "HolonymGovIdProvider", score: "4" },
  { name: "Hypercerts", score: "0.689" },
  // {name: "IdenaAge#10", score: "1.48"},
  // {name: "IdenaAge#5", score: "1.48"},
  // {name: "IdenaStake#100k", score: "1.41"},
  // {name: "IdenaStake#10k", score: "1.16"},
  // {name: "IdenaStake#1k", score: "0.9"},
  // {name: "IdenaState#Human", score: "1.61"},
  // {name: "IdenaState#Newbie", score: "0.51"},
  // {name: "IdenaState#Verified", score: "1.35"},
  { name: "Lens", score: "2.45" },
  { name: "NFT", score: "0.69" },
  { name: "PHIActivityGold", score: "1.16" },
  { name: "PHIActivitySilver", score: "1.67" },
  { name: "Poh", score: "1.21" },
  { name: "SelfStakingBronze", score: "1.21" },
  { name: "SelfStakingGold", score: "1.21" },
  { name: "SelfStakingSilver", score: "1.21" },
  { name: "SnapshotProposalsProvider", score: "2.82" },
  { name: "SnapshotVotesProvider", score: "1.41" },
  { name: "ZkSync", score: "0.400" },
  { name: "ZkSyncEra", score: "0.400" },
  { name: "CyberProfilePremium", score: "1.21" },
  { name: "CyberProfilePaid", score: "1.21" },
  { name: "CyberProfileOrgMember", score: "1.21" },
  // {name: "GrantsStack3Projects", score: "1.07"},
  // {name: "GrantsStack5Projects", score: "1.07"},
  // {name: "GrantsStack7Projects", score: "1.07"},
  // {name: "GrantsStack2Programs", score: "1.07"},
  // {name: "GrantsStack4Programs", score: "1.07"},
  // {name: "GrantsStack6Programs", score: "1.07"},
  { name: "TrustaLabs", score: "1.54" },
];

export const TYPE = [
  "Ens",
  "Poh",
  "Brightid",
  "Gitcoin",
  "Signer",
  "Snapshot",
  "ETH",
  "GtcStaking",
  "NFT",
  "ZkSync",
  "Lens",
  "GnosisSafe",
  "GuildXYZ",
  "Hypercerts",
  "PHI",
  "Holonym",
  "Civic",
  "CyberConnect",
  "GrantsStack",
  "TrustaLabs",
];

export const PROVIDER_ID = [
  "Signer",
  "Ens",
  "Poh",
  "Brightid",
  "GitcoinContributorStatistics#numGrantsContributeToGte#1",
  "GitcoinContributorStatistics#numGrantsContributeToGte#10",
  "GitcoinContributorStatistics#numGrantsContributeToGte#25",
  "GitcoinContributorStatistics#numGrantsContributeToGte#100",
  "GitcoinContributorStatistics#totalContributionAmountGte#10",
  "GitcoinContributorStatistics#totalContributionAmountGte#100",
  "GitcoinContributorStatistics#totalContributionAmountGte#1000",
  "GitcoinContributorStatistics#numRoundsContributedToGte#1",
  "GitcoinContributorStatistics#numGr14ContributionsGte#1",
  "Snapshot",
  "SnapshotProposalsProvider",
  "SnapshotVotesProvider",
  "ethPossessionsGte#1",
  "ethPossessionsGte#10",
  "ethPossessionsGte#32",
  "FirstEthTxnProvider",
  "EthGTEOneTxnProvider",
  "EthGasProvider",
  "SelfStakingBronze",
  "SelfStakingSilver",
  "SelfStakingGold",
  "CommunityStakingBronze",
  "CommunityStakingSilver",
  "CommunityStakingGold",
  "NFT",
  "ZkSync",
  "ZkSyncEra",
  "Lens",
  "GnosisSafe",
  "GuildMember",
  "GuildAdmin",
  "GuildPassportMember",
  "Hypercerts",
  "CyberProfilePremium",
  "CyberProfilePaid",
  "CyberProfileOrgMember",
  "PHIActivitySilver",
  "PHIActivityGold",
  "HolonymGovIdProvider",
  "CivicCaptchaPass",
  "CivicUniquenessPass",
  "CivicLivenessPass",
  "GrantsStack3Projects",
  "GrantsStack5Projects",
  "GrantsStack7Projects",
  "GrantsStack2Programs",
  "GrantsStack4Programs",
  "GrantsStack6Programs",
  "TrustaLabs",
];

export const web3Payloads = [
  {
    type: "Ens",
    types: ["Ens"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Poh",
    types: ["Poh"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Brightid",
    types: ["Brightid"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Gitcoin",
    types: [
      "GitcoinContributorStatistics#numGrantsContributeToGte#1",
      "GitcoinContributorStatistics#numGrantsContributeToGte#10",
      "GitcoinContributorStatistics#numGrantsContributeToGte#25",
      "GitcoinContributorStatistics#numGrantsContributeToGte#100",
      "GitcoinContributorStatistics#totalContributionAmountGte#10",
      "GitcoinContributorStatistics#totalContributionAmountGte#100",
      "GitcoinContributorStatistics#totalContributionAmountGte#1000",
      "GitcoinContributorStatistics#numRoundsContributedToGte#1",
      "GitcoinContributorStatistics#numGr14ContributionsGte#1",
    ],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Snapshot",
    types: ["SnapshotProposalsProvider", "SnapshotVotesProvider"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "ETH",
    types: [
      "ethPossessionsGte#1",
      "ethPossessionsGte#10",
      "ethPossessionsGte#32",
      "FirstEthTxnProvider",
      "EthGTEOneTxnProvider",
      "EthGasProvider",
    ],
    address: "",
    version: "0.0.0",
  },
  {
    type: "GtcStaking",
    types: [
      "SelfStakingBronze",
      "SelfStakingSilver",
      "SelfStakingGold",
      "CommunityStakingBronze",
      "CommunityStakingSilver",
      "CommunityStakingGold",
    ],
    address: "",
    version: "0.0.0",
  },
  {
    type: "NFT",
    types: ["NFT"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "ZkSync",
    types: ["ZkSync", "ZkSyncEra"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Lens",
    types: ["Lens"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "GnosisSafe",
    types: ["GnosisSafe"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "GuildXYZ",
    types: ["GuildMember", "GuildAdmin", "GuildPassportMember"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Hypercerts",
    types: ["Hypercerts"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "PHI",
    types: ["PHIActivitySilver", "PHIActivityGold"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "Holonym",
    types: ["HolonymGovIdProvider"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "CyberConnect",
    types: ["CyberProfilePremium", "CyberProfilePaid", "CyberProfileOrgMember"],
    address: "",
    version: "0.0.0",
  },
  {
    type: "GrantsStack",
    types: [
      "GrantsStack3Projects",
      "GrantsStack5Projects",
      "GrantsStack7Projects",
      "GrantsStack2Programs",
      "GrantsStack4Programs",
      "GrantsStack6Programs",
    ],
    address: "",
    version: "0.0.0",
  },
  {
    type: "TrustaLabs",
    types: ["TrustaLabs"],
    address: "",
    version: "0.0.0",
  },
];

export function hexToDecimal(hex: BigNumber): string {
  const bigNumberValue = BigNumber.from(hex);
  return bigNumberValue.toString();
}
