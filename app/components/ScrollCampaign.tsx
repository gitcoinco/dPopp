import React, { useEffect, useContext, useState, useCallback } from "react";
import NotFound from "../pages/NotFound";
import { useLoginFlow } from "../hooks/useLoginFlow";
import { LoadButton } from "./LoadButton";
import { useNextCampaignStep, useNavigateToRootStep } from "../hooks/useNextCampaignStep";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useSetCustomizationKey } from "../hooks/useCustomization";
import { ScrollCampaignPage } from "./scroll/ScrollCampaignPage";
import { ScrollConnectGithub } from "./scroll/ScrollConnectGithub";
import { ScrollMintBadge } from "./scroll/ScrollMintPage";
import { ScrollMintedBadge } from "./scroll/ScrollMintedBadge";

interface Provider {
  name: PROVIDER_ID;
  image: string;
  level: number;
}

export interface ProviderWithTitle extends Provider {
  title: string;
}

interface TopBadges {
  title: string;
  level: number;
  image: string;
}

const ScrollLogin = () => {
  const nextStep = useNextCampaignStep();
  const { isLoggingIn, signIn, loginStep } = useLoginFlow({ onLoggedIn: nextStep });

  return (
    <ScrollCampaignPage>
      <div className="text-5xl text-[#FFEEDA]">Developer Badge</div>
      <div className="text-xl mt-2">
        Connect your GitHub account to prove the number of contributions you have made, then mint your badge to prove
        you are a Rust developer.
      </div>
      <div className="mt-8">
        <LoadButton
          data-testid="connectWalletButton"
          variant="custom"
          onClick={signIn}
          isLoading={isLoggingIn}
          className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center">
            {isLoggingIn ? (
              <>
                <div>Connecting...</div>
                <div className="text-sm font-base">
                  (
                  {loginStep === "PENDING_WALLET_CONNECTION"
                    ? "Connect your wallet"
                    : loginStep === "PENDING_DATABASE_CONNECTION"
                      ? "Sign message in wallet"
                      : ""}
                  )
                </div>
              </>
            ) : (
              "Connect Wallet"
            )}
          </div>
        </LoadButton>
      </div>
    </ScrollCampaignPage>
  );
};

export const ScrollCampaign = ({ step }: { step: number }) => {
  const setCustomizationKey = useSetCustomizationKey();
  const goToLoginStep = useNavigateToRootStep();
  const { did, dbAccessToken } = useDatastoreConnectionContext();
  const { database } = useContext(CeramicContext);

  const [badgesFreshlyMinted, setBadgesFreshlyMinted] = useState(false);

  const onMinted = useCallback(() => {
    setBadgesFreshlyMinted(true);
  }, [setBadgesFreshlyMinted]);

  useEffect(() => {
    setCustomizationKey("scroll");
  }, [setCustomizationKey]);

  useEffect(() => {
    if ((!dbAccessToken || !did || !database) && step > 0) {
      console.log("Access token or did are not present. Going back to login step!");
      goToLoginStep();
    }
  }, [dbAccessToken, did, step, goToLoginStep, database]);

  if (step === 0) {
    return <ScrollLogin />;
  } else if (step === 1) {
    return <ScrollConnectGithub />;
  } else if (step === 2) {
    return <ScrollMintBadge onMinted={onMinted} />;
  } else if (step === 3) {
    return <ScrollMintedBadge badgesFreshlyMinted={badgesFreshlyMinted} />;
  }
  return <NotFound />;
};
