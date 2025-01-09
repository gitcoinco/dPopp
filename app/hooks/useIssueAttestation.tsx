import { EasPayload } from "@gitcoin/passport-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOnChainData } from "./useOnChainData";
import { useMessage } from "./useMessage";
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { Chain } from "../utils/chains";
import { useQueryClient } from "@tanstack/react-query";
import { cleanAndParseAbi } from "../utils/helpers";
import { ContractFunctionExecutionErrorType, WriteContractErrorType } from "viem";

const useChainSwitch = ({ chain }: { chain?: Chain }) => {
  const { chain: connectedChain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const chainId = chain && parseInt(chain.id);

  const switchChain = useCallback(async (): Promise<Boolean> => {
    if (!(connectedChain && chainId)) {
      return false;
    }
    if (connectedChain.id === chainId) {
      return true;
    }
    try {
      await switchChainAsync({ chainId });
      return true;
    } catch {
      return false;
    }
  }, [connectedChain, chain, switchChainAsync]);

  const needToSwitchChain = connectedChain?.id !== chainId;

  return useMemo(() => ({ needToSwitchChain, switchChain }), [needToSwitchChain, switchChain]);
};

const useVerifierContractInfo = ({ chain }: { chain?: Chain }) => {
  const contractAddress = (chain?.attestationProvider?.verifierAddress() as `0x${string}`) || undefined;
  const abi = chain?.attestationProvider ? cleanAndParseAbi(chain.attestationProvider.verifierAbi()) : [];

  return useMemo(() => ({ contractAddress, abi }), [contractAddress, abi]);
};

export const useAttestationNonce = ({
  chain,
}: {
  chain?: Chain;
}): {
  isLoading: boolean;
  isError: boolean;
  nonce?: number;
  refresh: () => void;
} => {
  const { address } = useAccount();
  const { contractAddress, abi } = useVerifierContractInfo({ chain });

  const { failure } = useMessage();
  const queryClient = useQueryClient();

  const enabled = Boolean(chain && address && abi && contractAddress);

  const { data, isLoading, isError, error, queryKey } = useReadContract({
    query: { enabled },
    abi,
    address: contractAddress,
    functionName: "recipientNonces",
    args: [address],
    chainId: parseInt(chain?.id || "1"),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (isError) {
      console.error("Failed reading attestation nonce", error);
      failure({
        title: "Error",
        message: "Failed reading attestation nonce",
      });
    }
  }, [isError, failure]);

  const nonce = data !== undefined ? Number(data as bigint) : undefined;

  return useMemo(() => {
    if (enabled) return { nonce, isLoading, refresh, isError };
    else return { isLoading: true, refresh: () => {}, isError: false };
  }, [nonce, isLoading, refresh, isError]);
};

export const useIssueAttestation = ({ chain }: { chain?: Chain }) => {
  const { address } = useAccount();
  const { contractAddress, abi } = useVerifierContractInfo({ chain });
  const { success, failure } = useMessage();
  const { needToSwitchChain, switchChain } = useChainSwitch({ chain });
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({
    chainId: parseInt(chain?.id || "1"),
  });
  const { refresh: refreshNonce } = useAttestationNonce({ chain });
  const { refresh: refreshOnchainData } = useOnChainData();

  const issueAttestation = useCallback(
    async ({ data }: { data: EasPayload }) => {
      if (chain && abi && contractAddress) {
        if (needToSwitchChain) {
          const switched = await switchChain();
          if (!switched) {
            return;
          }
        }

        try {
          const { v, r, s } = data.signature;

          const chainId = parseInt(chain.id);

          const txhash = await writeContractAsync({
            abi,
            chainId,
            address: contractAddress,
            functionName: "verifyAndAttest",
            args: [data.passport, v, r, s] as unknown[],
            value: data.passport.fee,
          });

          success({
            title: "Submitted",
            message: "Attestation submitted to chain.",
          });

          await publicClient?.waitForTransactionReceipt({
            hash: txhash,
          });

          refreshNonce();
          refreshOnchainData(chain.id);

          success({
            title: "Success",
            message: (
              <p>
                Passport successfully synced to chain.{" "}
                {chain?.attestationProvider?.hasWebViewer && address && (
                  <a
                    href={chain.attestationProvider.viewerUrl(address)}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Check your attestations
                  </a>
                )}
              </p>
            ),
          });
        } catch (e: any) {
          const error = e as WriteContractErrorType | ContractFunctionExecutionErrorType;

          console.error("error syncing credentials to chain: ", e);

          let errorMessage: JSX.Element | string =
            ("details" in error && error.details) ||
            ("shortMessage" in error && error.shortMessage) ||
            error.message ||
            "An unexpected error occurred while trying to bring the data onchain.";

          if (errorMessage.includes("rejected") || errorMessage.includes("User denied transaction")) {
            errorMessage = "Transaction rejected by user";
          } else if (
            errorMessage.includes("insufficient funds") ||
            e?.info?.error?.data?.message?.includes("insufficient funds") ||
            errorMessage.includes("cost exceeds account balance") ||
            e?.info?.error?.data?.message?.includes("cost exceeds account balance")
          ) {
            errorMessage =
              "You don't have sufficient funds to bring your data onchain. Consider funding your wallet first.";
          } else {
            errorMessage = <ErrorDetails msg={errorMessage} error={e} />;
          }

          failure({
            title: "Error",
            message: errorMessage,
          });
        }
      }
    },
    [
      chain,
      address,
      contractAddress,
      abi,
      needToSwitchChain,
      switchChain,
      writeContractAsync,
      success,
      failure,
      refreshNonce,
      refreshOnchainData,
    ]
  );

  return useMemo(() => ({ issueAttestation, needToSwitchChain }), [issueAttestation, needToSwitchChain]);
};

export type ErrorDetailsProps = {
  msg: string;
  error: {
    message: string;
  };
};

export const ErrorDetails = ({ msg, error }: ErrorDetailsProps): JSX.Element => {
  const [displayDetails, setDisplayDetails] = useState<string>("none");
  const [textLabelDisplay, setTextLabelDisplay] = useState<string>("Show details");

  const copyDetailsToClipboard = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(error.message || error.toString());
  };

  const toggleDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (displayDetails === "none") {
      setDisplayDetails("block");
      setTextLabelDisplay("Hide details");
    } else {
      setDisplayDetails("none");
      setTextLabelDisplay("Show details");
    }
  };
  return (
    <div>
      <p>{msg}</p>
      <br></br>
      Please{" "}
      <b>
        <a href="#" onClick={copyDetailsToClipboard}>
          copy transaction details{" "}
        </a>
      </b>{" "}
      in case you contact our support.{" "}
      <b>
        <a href="#" onClick={toggleDetails}>
          {textLabelDisplay}
        </a>
      </b>
      <div style={{ display: displayDetails, overflowY: "scroll", maxHeight: "200px" }}>{error.message}</div>
    </div>
  );
};
