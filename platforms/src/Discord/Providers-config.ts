import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { DiscordProvider } from "./Providers/discord.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/discordStampIcon.svg",
  platform: "Discord",
  name: "Discord",
  description: "Connect your Discord account to Passport to identity and reputation in Web3 communities.",
  connectMessage: "Connect Account",
  website: "https://discord.com/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Encrypted", name: "Discord" }],
  },
];

export const providers: Provider[] = [new DiscordProvider()];
