import React, { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { CollapseMode, DarkTheme, PassportScoreWidget } from "@passportxyz/passport-embed";
import { Button } from "./Button";
import BodyWrapper from "./BodyWrapper";
import PageRoot from "./PageRoot";
import HeaderContentFooterGrid from "./HeaderContentFooterGrid";
import WelcomeFooter from "./WelcomeFooter";
import MinimalHeader from "./MinimalHeader";
import { PAGE_PADDING } from "./PageWidthGrid";
import { Disclosure } from "@headlessui/react";

const passportEmbedParams = {
  apiKey: process.env.NEXT_PUBLIC_EMBED_CAMPAIGN_API_KEY as string,
  scorerId: process.env.NEXT_PUBLIC_EMBED_CAMPAIGN_SCORER_ID as string,
  overrideEmbedServiceUrl: process.env.NEXT_PUBLIC_EMBED_SERVICE_URL as string,
};

const Heading = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`font-heading text-4xl md:text-5xl text-foreground-2 ${className}`}>{children}</div>
);

type OptionSelectProps<T extends readonly string[]> = {
  options: T;
  selectedOption: T[number];
  setSelectedOption: (option: T[number]) => void;
};

const Option = <const T extends readonly string[]>({
  heading,
  ...props
}: {
  heading: string;
} & OptionSelectProps<T>) => (
  <div className="flex flex-col gap-1">
    <div className="text-sm text-foreground-3">{heading}</div>
    <OptionSelect {...props} />
  </div>
);

const OptionSelect = <const T extends readonly string[]>({
  options,
  selectedOption,
  setSelectedOption,
}: OptionSelectProps<T>) => {
  const [slidePosition, setSlidePosition] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const selectedIndex = options.indexOf(selectedOption);
    if (optionRefs.current[selectedIndex]) {
      const optionElement = optionRefs.current[selectedIndex];
      const containerElement = containerRef.current;

      if (optionElement && containerElement) {
        const optionRect = optionElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();

        setSlidePosition({
          left: optionRect.left - containerRect.left,
          width: optionRect.width,
        });
      }
    }
  }, [selectedOption, options]);

  return (
    <div ref={containerRef} className="flex gap-4 bg-opacity-15 bg-white relative p-1 rounded-[10px] w-fit">
      <div
        className="absolute bg-white rounded-md transition-all duration-300 ease-in-out"
        style={{
          left: `${slidePosition.left}px`,
          width: `${slidePosition.width}px`,
          height: "calc(100% - 0.5rem)",
          top: "0.25rem",
        }}
      />

      {options.map((option, index) => {
        const selected = option === selectedOption;
        return (
          <div
            key={option}
            ref={(el: HTMLDivElement | null) => {
              optionRefs.current[index] = el;
            }}
            className={`px-2 py-[2px] cursor-pointer rounded-md relative transition-colors duration-300 z-10
              ${selected ? "text-color-4" : "text-color-1 hover:text-opacity-80"}`}
            onClick={() => setSelectedOption(option as T[number])}
          >
            {option}
          </div>
        );
      })}
    </div>
  );
};

export default OptionSelect;

type ThemeOption = "Dark" | "Light";

const ComputerGraphic = ({ theme, className }: { theme: ThemeOption; className?: string }) => {
  const computerBackgroundColor = theme === "Dark" ? "rgba(0,0,0,0)" : "#FFFCFC";

  return (
    <div className={className}>
      <svg
        className="hidden lg:block w-full"
        width="1156"
        height="724"
        viewBox="0 0 1156 724"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_f_17190_8155)">
          <ellipse cx="578.572" cy="672.598" rx="518.089" ry="5.72474" stroke="#4A5065" strokeWidth="1.5" />
        </g>
        <path
          d="M113.151 29.6592C113.151 14.1952 125.687 1.65918 141.151 1.65918H1019.43C1034.89 1.65918 1047.43 14.1952 1047.43 29.6592V627.38C1047.43 629.589 1045.64 631.38 1043.43 631.38H117.151C114.942 631.38 113.151 629.589 113.151 627.38V29.6592Z"
          stroke="#4A5065"
          strokeWidth="1.5"
        />
        <path
          d="M118.876 29.3425C118.876 17.1923 128.726 7.34259 140.876 7.34259H1019.7C1031.85 7.34259 1041.7 17.1923 1041.7 29.3426V607.51H118.876V29.3425Z"
          stroke="#4A5065"
          strokeWidth="1.5"
        />
        <rect
          x="137.195"
          y="36.8963"
          width="881.609"
          height="545.607"
          stroke="#4A5065"
          strokeWidth="1.5"
          fill={computerBackgroundColor}
        />
        <path
          d="M0.946655 633.38C0.946655 632.276 1.84209 631.38 2.94666 631.38H1153.05C1154.16 631.38 1155.05 632.276 1155.05 633.38V651.989H0.946655V633.38Z"
          stroke="#4A5065"
          strokeWidth="1.5"
        />
        <path
          d="M0.946655 651.989H1155.05L1126.07 657.834C1100.04 663.084 1073.55 665.729 1046.99 665.729H106.683C77.4978 665.729 48.4005 662.534 19.9105 656.203L0.946655 651.989Z"
          stroke="#4A5065"
          strokeWidth="1.5"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M483.007 631.38C483.596 640.331 491.043 647.409 500.143 647.409H657.001C666.101 647.409 673.549 640.331 674.138 631.38H483.007Z"
          stroke="#4A5065"
          strokeWidth="1.5"
        />

        <g transform="translate(165, 60)">
          <path d="M0.0827637 42.39H827.329" stroke="#4A5065" strokeWidth="2" />
          <circle cx="19.9904" cy="17.0217" r="15.0393" stroke="#4A5065" strokeWidth="2" />
          <circle cx="792.961" cy="17.0217" r="15.0393" stroke="#4A5065" strokeWidth="2" />
          <circle cx="750.039" cy="17.0217" r="15.0393" stroke="#4A5065" strokeWidth="2" />
          <circle cx="704.937" cy="17.0217" r="15.0393" stroke="#4A5065" strokeWidth="2" />
          <path d="M52.069 18.2879L185.801 18.2879" stroke="#4A5065" strokeWidth="2" />
          <path d="M31.069 120.288L164.801 120.288" stroke="#4A5065" strokeWidth="2" />
          <path d="M10.069 263.288L143.801 263.288" stroke="#4A5065" strokeWidth="2" />
          <path d="M13.069 318.288H308.963" stroke="#4A5065" strokeWidth="2" />
          <path d="M13.069 344.505H248.414" stroke="#4A5065" strokeWidth="2" />
          <path d="M13.069 375.716H274.631" stroke="#4A5065" strokeWidth="2" />
          <rect x="4.95105" y="86.1624" width="411.952" height="128" rx="15" stroke="#4A5065" strokeWidth="2" />
        </g>

        <defs>
          <filter
            id="filter0_f_17190_8155"
            x="15.7339"
            y="622.123"
            width="1125.68"
            height="100.949"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_17190_8155" />
          </filter>
        </defs>
      </svg>
      <svg
        className="block lg:hidden w-full rotate-180"
        viewBox="0 0 400 840"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0"
          y="16"
          width="400"
          height="808"
          rx="44"
          stroke="#4A5065"
          strokeWidth="2"
          fill={computerBackgroundColor}
        />
        <path
          d="M0 148C0 77.6081 57.6081 17 154 17H246C342.392 17 400 77.6081 400 148V192H0V148Z"
          stroke="#4A5065"
          strokeWidth="2"
        />
        <circle cx="200" cy="104" r="32" stroke="#4A5065" strokeWidth="2" />
        <rect x="160" y="776" width="80" height="12" rx="6" stroke="#4A5065" strokeWidth="2" />
      </svg>
    </div>
  );
};

export const EmbedCampaign = () => {
  const { open: openWeb3Modal } = useAppKit();
  const { address } = useAccount();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeOption>("Dark");
  const [collapseType, setCollapseType] = React.useState<"Shift" | "Overlay" | "None">("Shift");
  const { signMessageAsync } = useSignMessage();

  const hexToUtf8 = (hexString: string): string => {
    return Buffer.from(hexString.replace(/^0x/, ""), "hex").toString("utf8");
  };

  const generateSignature = async (message: string) => {
    const strMsg = hexToUtf8(message);
    try {
      const signature = signMessageAsync({
        account: address,
        message: strMsg,
      });
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      alert("Failed to sign message");
      throw error;
    }
  };

  return (
    <PageRoot className="text-color-1">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-foreground-6`} />
        </div>
        <BodyWrapper className="text-color-1 grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center gap-6 pb-6 mt-0 lg:mt-6 grid-flow-dense w-full h-full">
          <div className="grid grid-cols-1 w-full max-w-md lg:max-w-full h-auto place-items-center lg:col-start-2 -my-16 lg:my-0">
            <img
              className="w-full h-auto col-start-1 row-start-1"
              src="./assets/passportBackgroundLogo.svg"
              alt="Background Icon"
            />
            <img
              className="h-[50%] w-auto col-start-1 row-start-1"
              src="./assets/isometricEmbed.png"
              alt="Embed Widget"
            />
          </div>
          <div className="flex flex-col gap-8">
            <Heading>Install Component</Heading>
            <div>
              Verify your identity with just one click. Our system will check your ETH account for activities that match
              our Stamp criteria. If you still need help verifying your identity, the embed component will walk you
              through claiming the best stamps for your account.
            </div>
            <Button
              variant="primary"
              className="w-full md:max-w-64"
              onClick={() => window.open("https://github.com/passportxyz/passport-embed", "_blank")?.focus()}
            >
              Go to documentation
            </Button>
          </div>
          <Heading className="col-span-1 lg:col-span-2">Component Showcase</Heading>
          <ComputerGraphic
            theme={selectedTheme}
            className="col-start-1 col-end-2 row-start-4 lg:col-end-3 lg:row-start-3 w-full max-w-[330px] h-auto lg:max-w-full"
            aria-hidden="true"
          />
          <div className="shadow-[0px_6px_34px_11px_#ACCDFC30] backdrop-blur-sm col-start-1 col-end-2 lg:row-start-3 lg:justify-self-start lg:self-start lg:mt-[20%] lg:ml-[10%] bg-gradient-to-b from-background/[.6] to-background-3/[.6] p-6 rounded-md border-foreground border gap-2 flex flex-col">
            <div className="text-2xl font-heading text-foreground-2">Settings tryout</div>
            <Option
              heading="Theme"
              options={["Dark", "Light"]}
              selectedOption={selectedTheme}
              setSelectedOption={setSelectedTheme}
            />
            <Option
              heading="Collapse Type"
              options={["Shift", "Overlay", "None"]}
              selectedOption={collapseType}
              setSelectedOption={setCollapseType}
            />
          </div>
          <div className="col-start-1 col-end-2 row-start-4 lg:col-start-2 lg:col-end-3 lg:row-start-3 lg:justify-self-start self-start mt-40 lg:mt-[20%] lg:ml-[10%] flex flex-col items-center gap-6 w-full max-w-[320px] z-10">
            <PassportScoreWidget
              theme={
                selectedTheme === "Dark"
                  ? DarkTheme
                  : {
                      colors: {
                        primary: "55, 55, 55",
                        secondary: "201, 201, 201",
                        background: "255, 255, 255",
                        success: "164, 255, 169",
                        failure: "55, 55, 55",
                      },
                    }
              }
              address={address}
              connectWalletCallback={openWeb3Modal}
              generateSignatureCallback={generateSignature}
              collapseMode={{ None: "off", Shift: "shift", Overlay: "overlay" }[collapseType] as CollapseMode}
              {...passportEmbedParams}
            />
            <div className={selectedTheme === "Dark" ? "text-color-1" : "text-color-4"}>Text below the widget.</div>
          </div>
          <img
            className="w-full h-auto col-start-1 row-start-4 hidden lg:block"
            src="./assets/passportBackgroundLogo.svg"
            alt="Background Icon"
          />
          <Heading className="col-start-1 col-end-1 lg:max-w-sm lg:row-start-4 lg:self-start lg:mt-16">
            Frequently Asked Questions
          </Heading>
          <FAQ className="col-span-1 w-full self-start" />
        </BodyWrapper>
        <WelcomeFooter displayPrivacyPolicy={true} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
};

const FAQ_ENTRIES = [
  {
    title: "How does it work?",
    body: (
      <p>
        Passport Embed allows developers to easily integrate identity verification and unique humanity score directly
        into their dApp. This enables a seamless experience for end users.
      </p>
    ),
  },
  {
    title: "How do I use Passport Embed in my application?",
    body: (
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae ipsum dui. Morbi dictum orci id tempus
        laoreet. Nulla iaculis sapien et tempus lobortis. Aenean ut enim eu diam venenatis vehicula. Donec eu placerat
        eros. Vestibulum porttitor maximus ultrices.
      </p>
    ),
  },
  {
    title: "What sort of customizations can I do?",
    body: (
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae ipsum dui. Morbi dictum orci id tempus
        laoreet. Nulla iaculis sapien et tempus lobortis. Aenean ut enim eu diam venenatis vehicula. Donec eu placerat
        eros. Vestibulum porttitor maximus ultrices.
      </p>
    ),
  },
  {
    title: "What programming languages and frameworks are compatible with Passport Embed?",
    body: (
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae ipsum dui. Morbi dictum orci id tempus
        laoreet. Nulla iaculis sapien et tempus lobortis. Aenean ut enim eu diam venenatis vehicula. Donec eu placerat
        eros. Vestibulum porttitor maximus ultrices.
      </p>
    ),
  },
  {
    title: "Where can I learn more about this functionality?",
    body: (
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae ipsum dui. Morbi dictum orci id tempus
        laoreet. Nulla iaculis sapien et tempus lobortis. Aenean ut enim eu diam venenatis vehicula. Donec eu placerat
        eros. Vestibulum porttitor maximus ultrices.
      </p>
    ),
  },
];

const FAQ = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      {FAQ_ENTRIES.map((entry, index) => (
        <Disclosure key={index} as="div" className="py-4 border-b border-foreground-4 faq">
          <Disclosure.Button className="group text-foreground-2 flex text-left">{entry.title}</Disclosure.Button>
          <Disclosure.Panel className="mt-2 text-foreground-1 flex text-left">{entry.body}</Disclosure.Panel>
        </Disclosure>
      ))}
    </div>
  );
};
