import React, { useEffect } from "react";
import { ScorerContext } from "../context/scorerContext";

import { useCustomization } from "../hooks/useCustomization";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import Tooltip from "./Tooltip";

const PanelDiv = ({ className, children }: { className: string; children: React.ReactNode }) => {
  return (
    <div
      className={`flex flex-col items-center p-4 w-full rounded-lg bg-gradient-to-t from-background to-[#082F2A] ${className}`}
    >
      {children}
    </div>
  );
};

const LoadingScoreImage = () => <img src="/assets/scoreLogoLoading.svg" alt="loading" className="h-20 w-auto" />;

const SuccessScoreImage = () => <img src="/assets/scoreLogoSuccess.svg" alt="success" className="h-20 w-auto" />;

const Ellipsis = () => {
  return (
    <div className="flex">
      .<div className="animate-[visible-at-one-third_1.5s_steps(1)_infinite]">.</div>
      <div className="animate-[visible-at-two-thirds_1.5s_steps(1)_infinite]">.</div>
    </div>
  );
};

export const DashboardScorePanel = ({ className }: { className: string }) => {
  const { rawScore, passportSubmissionState, threshold } = React.useContext(ScorerContext);
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [displayScore, setDisplayScore] = React.useState(0);
  const customization = useCustomization();

  // This enables the animation on page load
  useEffect(() => {
    if (verificationState.loading) {
      setDisplayScore(0);
    } else {
      setDisplayScore(rawScore);
    }
  }, [rawScore, verificationState.loading]);

  const customTitle = customization?.scorerPanel?.title;

  const loading = true || passportSubmissionState === "APP_REQUEST_PENDING" || verificationState.loading;

  return (
    <PanelDiv className={`text-color-2 font-heading ${className}`}>
      <div className="flex items-center w-full">
        <span className="grow">{customTitle || "Unique Humanity Score"}</span>
        <Tooltip className="px-0">
          Your Unique Humanity Score is based out of 100 and measures your uniqueness. The current passing threshold is{" "}
          {threshold}. Scores may vary across different apps, especially due to abuse or attacks on the service.
        </Tooltip>
      </div>
      <div className="flex grow items-center align-middle text-xl mt-6 mb-10">
        <div className="m-4">{loading ? <LoadingScoreImage /> : <SuccessScoreImage />}</div>
        {loading ? (
          <div className="leading-none">
            Updating
            <div className="flex">
              score
              <Ellipsis />
            </div>
          </div>
        ) : (
          <span>{+displayScore.toFixed(2)}</span>
        )}
      </div>
    </PanelDiv>
  );
};

export const DashboardScoreExplanationPanel = ({ className }: { className: string }) => {
  const { passportSubmissionState } = React.useContext(ScorerContext);
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const customization = useCustomization();

  const loading = true || passportSubmissionState === "APP_REQUEST_PENDING" || verificationState.loading;

  // TODO
  const customText = customization?.scorerPanel?.text;
  return (
    <PanelDiv className={`px-6 ${className}`}>
      <div className="h-10 w-full bg-gradient-to-r from-loading-start from-loading-start-position to-loading-end to-loading-end-position animate-[loading-gradient_1s_ease-in-out_infinite] transition-all rounded-lg" />
    </PanelDiv>
  );
};
