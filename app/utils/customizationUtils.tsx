import React, { useMemo } from "react";
import { CustomizationTheme } from "../utils/theme/types";
import { CUSTOMIZATION_ENDPOINT } from "../config/customization_config";
import axios from "axios";
import * as DOMPurify from "dompurify";
import parse from "html-react-parser";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformGroupSpec } from "@gitcoin/passport-platforms/*";

const sanitize = DOMPurify.sanitize;

export const initializeDOMPurify = () => {
  // This fails if done at the top level of the file
  DOMPurify.addHook("afterSanitizeAttributes", function (node) {
    // set all elements owning target to target=_blank and rel=noopener
    // otherwise DOMPurify removes the target attribute
    if ("target" in node) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener");
    }
  });
};

export type CustomizationLogoBackground = "dots" | "none";

export type Customization = {
  key: string;
  useCustomDashboardPanel: boolean;
  dashboardPanel: {
    logo: {
      image: React.ReactNode;
      caption?: React.ReactNode;
      background?: CustomizationLogoBackground;
    };
    body: {
      mainText: React.ReactNode;
      subText: React.ReactNode;
      action: {
        text: string;
        url: string;
      };
    };
  };
  customizationTheme?: CustomizationTheme;
  scorer?: {
    id?: number;
    weights?: Record<PROVIDER_ID, string>;
  };
  scorerPanel?: {
    title?: string;
    text?: string;
  };
  allowListProviders?: PlatformGroupSpec[];
  includedChainIds?: string[];
};

type CustomizationResponse = {
  customizationTheme?: CustomizationTheme;
  useCustomDashboardPanel?: boolean;
  scorer?: {
    id?: number;
    weights?: Record<PROVIDER_ID, string>;
  };
  scorerPanel?: {
    title?: string;
    text?: string;
  };
  dashboardPanel?: {
    logo?: {
      image?: string;
      caption?: string;
      background?: string;
    };
    body?: {
      mainText?: string;
      subText?: string;
      action?: {
        text?: string;
        url?: string;
      };
    };
  };
  includedChainIds?: string[];
};

const SanitizedHTMLComponent = ({ html }: { html: string }) => {
  const sanitizedHTML = useMemo(() => html && sanitize(html), [html]);

  if (!html) {
    return null;
  }

  return parse(sanitizedHTML);
};

export const buildAllowListProviders = (weights?: Record<PROVIDER_ID, string>) => {
  return Object.keys(weights || [])
    .filter((key) => key.startsWith("AllowList"))
    .map((name) => {
      return {
        platformGroup: "Custom Allow Lists",
        providers: [
          {
            title: "Allow List Provider",
            description: "Check to see if you are on the Guest List.",
            name: name as PROVIDER_ID,
          },
        ],
      };
    });
};

export const requestCustomizationConfig = async (customizationKey: string): Promise<Customization | undefined> => {
  const response = await axios.get(`${CUSTOMIZATION_ENDPOINT}/${customizationKey}`);
  const customizationResponse: CustomizationResponse = response.data;
  const allowListProviders: PlatformGroupSpec[] = buildAllowListProviders(customizationResponse.scorer?.weights);

  return {
    key: customizationKey,
    customizationTheme: customizationResponse.customizationTheme,
    useCustomDashboardPanel: customizationResponse.useCustomDashboardPanel || false,
    scorer: {
      id: customizationResponse.scorer?.id,
      weights: customizationResponse.scorer?.weights,
    },
    scorerPanel: {
      title: customizationResponse.scorerPanel?.title,
      text: customizationResponse.scorerPanel?.text,
    },
    dashboardPanel: {
      logo: {
        image: <SanitizedHTMLComponent html={customizationResponse.dashboardPanel?.logo?.image || ""} />,
        caption: <SanitizedHTMLComponent html={customizationResponse.dashboardPanel?.logo?.caption || ""} />,
        background:
          (customizationResponse.dashboardPanel?.logo?.background?.toLowerCase() as CustomizationLogoBackground) ||
          "none",
      },
      body: {
        mainText: <SanitizedHTMLComponent html={customizationResponse.dashboardPanel?.body?.mainText || ""} />,
        subText: <SanitizedHTMLComponent html={customizationResponse.dashboardPanel?.body?.subText || ""} />,
        action: {
          text: customizationResponse.dashboardPanel?.body?.action?.text || "",
          url: sanitize(customizationResponse.dashboardPanel?.body?.action?.url || ""),
        },
      },
    },
    allowListProviders: allowListProviders.length ? allowListProviders : undefined,
    includedChainIds: customizationResponse.includedChainIds,
  };
};

export const isDynamicCustomization = (config: Customization): config is Customization => {
  return (config as Customization).useCustomDashboardPanel !== undefined;
};
