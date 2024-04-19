import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { NFTProvider, DigitalCollectorProvider, ArtAficionadoProvider, NftVisionaryProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/nftStampIcon.svg",
  platform: "NFT",
  name: "NFT",
  description: "Connect your Ethereum wallet to verify your Ethereum Mainnet NFTs.",
  connectMessage: "Connect NFT",
  isEVM: true,
  website: "https://ethereum.org/en/nft/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Collector's Journey",
    providers: [
      {
        name: "DigitalCollector",
        title: "Digital Collector",
        description: "Recognizes users beginning to explore the NFT space with a budding collection.",
      },
      {
        name: "ArtAficionado",
        title: "Art Aficionado",
        description:
          "Highlights users with a significant, more curated NFT portfolio that demonstrates their deeper involvement and appreciation for digital art and assets.",
      },
      {
        name: "NftVisionary",
        title: "NFT Visionary",
        description:
          "Distinguishes users at the forefront of the NFT movement, showcasing exceptional collections that set trends within the community.",
      },
    ],
  },
  {
    platformGroup: "NFT Ownership Verification",
    providers: [
      {
        name: "NFT",
        title: "Holds at least 1 NFT (ERC-721)",
        description:
          "Verifies users possessing at least one ERC-721 NFT on the Ethereum mainnet, serving as the foundational credential within the NFT stamp category.",
      },
    ],
  },
];

export const providers: Provider[] = [
  new NFTProvider(),
  new DigitalCollectorProvider(),
  new ArtAficionadoProvider(),
  new NftVisionaryProvider(),
];
