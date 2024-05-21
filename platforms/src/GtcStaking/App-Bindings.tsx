/* eslint-disable */
import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GTCStakingPlatform extends Platform {
  platformId = "GtcStaking";
  path = "GtcStaking";
  isEVM = true;
  clientId: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }


  banner = {
    content: (
      <div>
        If you haven't staked yet, you can do so now.
        <a
          href="https://support.passport.xyz/passport-knowledge-base/gtc-staking/identity-staking-questions"
          style={{
            color: "rgb(var(--color-foreground-2))",
            textDecoration: "underline",
            cursor: "pointer",
            paddingLeft: "2px",
          }}
          target="_blank"
          rel="noreferrer"
        >
          Learn more
        </a>
      </div>
    ),
    cta: {
      label: "Identity Staking",
      url: "https://www.staking.passport.gitcoin.co/",
    },
  };

}
