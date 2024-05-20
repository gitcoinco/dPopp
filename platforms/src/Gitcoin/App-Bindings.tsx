import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GitcoinPlatform extends Platform {
  platformId = "Gitcoin";
  path = "Gitcoin";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading: (
      <div>
        To qualify for the Gitcoin stamp, your contributions must be made to grant rounds officially funded by Gitcoin.
        This includes designated rounds such as Citizens rounds, GG18, GG19, among others, as detailed{" "}
        <a
          href="https://github.com/ufkhan97/gitcoin-grants-heroku/blob/main/all_rounds.csv"
          target="_blank"
          rel="noreferrer"
          className="underline text-foreground-4"
        >
          here
        </a>
        .
      </div>
    ),
    content: (
      <div>
        Please note, contributions to self-serve rounds (those with type{" "}
        <span className="text-xs font-alt text-foreground-2">independent</span> in the chart) are not eligible.
        Eligibility requires a passing Passport score and adherence to our fraud prevention guidelines. Contributions
        are recognized approximately three weeks following the conclusion of an eligible round.
      </div>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-gitcoin-grants-to-passport",
    },
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
