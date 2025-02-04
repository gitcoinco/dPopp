import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { CivicPassType } from "./Providers/types.js";
import { CivicPassProvider } from "./Providers/civic.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/civicStampIcon.svg",
  platform: "Civic",
  name: "Civic",
  description: "Connect to Civic to verify your identity.",
  connectMessage: "Verify Account",
  website: "https://www.civic.com",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "CAPTCHA Pass",
    providers: [{ title: "holds a Civic CAPTCHA Pass", name: "CivicCaptchaPass" }],
  },
  {
    platformGroup: "Uniqueness Pass",
    providers: [{ title: "holds a Civic Uniqueness Pass", name: "CivicUniquenessPass" }],
  },
  {
    platformGroup: "Liveness Pass",
    providers: [{ title: "holds a Civic Liveness Pass", name: "CivicLivenessPass" }],
  },
];

/////////////////////////////////////////////////////////////
// Civic Passes: Keep in sync with https://docs.com/integration-guides/civic-idv-services/available-networks
// By default, excludes testnets. To include testnets, add `includeTestnets: true` to each provider.
////////////////////////////////////////////////////////////
export const providers: Provider[] = [
  new CivicPassProvider({
    passType: CivicPassType.CAPTCHA,
    type: "CivicCaptchaPass",
  }),
  new CivicPassProvider({
    passType: CivicPassType.UNIQUENESS,
    type: "CivicUniquenessPass",
  }),
  new CivicPassProvider({
    passType: CivicPassType.LIVENESS,
    type: "CivicLivenessPass",
  }),
];
