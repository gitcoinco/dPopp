// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ------ Ethers Library
import { Contract, utils } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// ------ GoodDollar identity ABI & Address
import Contracts from "@gooddollar/goodprotocol/releases/deployment.json";
import Identity from "@gooddollar/goodprotocol/artifacts/contracts/Interfaces.sol/IIdentity.json";
import { parseLoginResponse } from "@gooddollar/goodlogin-sdk";

type EnvKey = keyof typeof Contracts;
const IDENTITY_ADDRESS_FUSE = Contracts[(process.env.GOODDOLLAR_ENV || "fuse") as EnvKey].Identity;

const fuse_rpc = process.env.RPC_FUSE_URL || "https://rpc.fuse.io"; //TODO: add env to build-process

type LoginResult = Parameters<typeof parseLoginResponse>[0];
export class GoodDollarProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "GoodDollar";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address, proofs } = payload;

    try {
      const providerFuse: StaticJsonRpcProvider = new StaticJsonRpcProvider(fuse_rpc);
      const contract = new Contract(IDENTITY_ADDRESS_FUSE, Identity.abi, providerFuse);
      const whitelistedAddress = utils.getAddress(proofs.whitelistedAddress);
      //if we have gooddollar login response, this will verify it was signed by owner and recently(nonce)
      if (proofs.signedResponse) {
        const result = await parseLoginResponse(
          proofs.signedResponse as unknown as LoginResult,
          process.env.GOODDOLLAR_ENV || "fuse"
        );
        // console.log({ result, proofs });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const signedAddress = result && result.walletAddress.value;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const isWhitelisted =
          result &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.isAddressWhitelisted.isVerified &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          result.isAddressWhitelisted.value;
        if (!isWhitelisted || signedAddress != whitelistedAddress)
          throw new Error("whitelist address mismatch or not whitelisted");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const valid = await contract.isWhitelisted(whitelistedAddress);
        if (!valid || address !== whitelistedAddress) throw new Error("whitelist address mismatch or not whitelisted");
      }

      return {
        valid: true,
        record: {
          // store the address into the proof records
          address,
          whitelistedAddress,
        },
      };
    } catch (e) {
      return {
        valid: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error: [e.message as string, JSON.stringify(e)],
      };
    }
  }
}
