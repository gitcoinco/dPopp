import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { providers } from "./Providers-config";
import { CivicPassType } from "./Providers/passType";
import { CivicPassProvider } from "./Providers/civic";

const DEFAULT_SCOPE = "uniqueness";

const mapProviderIDToScope = (provider: PROVIDER_ID): string | undefined => {
  const foundProvider = providers.find((p) => p.type === provider);
  const passTypes = (foundProvider as CivicPassProvider)?._options.passTypes;
  if (passTypes && passTypes.length > 0) {
    return CivicPassType[passTypes[0]].toLowerCase();
  }
  return undefined;
};

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";
  isEVM = true;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  getOAuthUrl(state?: string, providers?: PROVIDER_ID[]): Promise<string> {
    const scope = providers?.length > 1 ? mapProviderIDToScope(providers[0]) : DEFAULT_SCOPE;
    return Promise.resolve(
      `https://getpass.civic.com?chain=polygon&state=${state}&scope=${scope}&redirect_uri=${this.redirectUri}`
    );
  }

  banner = {
    heading: "How to get your Civic Pass",
    content: "Visit the Civic website to get your Civic Pass.",
    cta: {
      label: "Get Civic Pass",
      url: "https://getpass.civic.com?chain=polygon",
    },
  };
}
