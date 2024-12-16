// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export const holonymApiPhoneEndpoint = "https://api.holonym.io/sybil-resistance/phone/optimism";

type SybilResistanceResponse = {
  result: boolean;
};

const actionId = 123456789;

export class HolonymPhone implements Provider {
  // Give the provider a type so that we can select it from a payload
  type = "HolonymPhone";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address defined in the payload has proven uniqueness using Holonym
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();
    const errors = [];
    let record = undefined,
      valid = false;

    try {
      // Check if address is unique for default Holonym action ID
      const response = await getIsPhoneValid(address);
      valid = response.result;

      if (valid) {
        record = {
          // store the address into the proof records
          address,
        };
      } else {
        errors.push(
          `We were unable to verify that your address was unique for action -- isUniqueForAction: ${String(valid)}.`
        );
      }

      if (!valid && errors.length === 0) {
        errors.push("We are unable to determine the error at this time.");
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Holonym Government ID verification failure: ${JSON.stringify(e)}.`);
    }
  }
}

const getIsPhoneValid = async (address: string): Promise<SybilResistanceResponse> => {
  try {
    const requestResponse = await axios.get(`${holonymApiPhoneEndpoint}?user=${address}&action-id=${actionId}`);

    if (requestResponse.status != 200) {
      throw [`HTTP Error '${requestResponse.status}'. Details: '${requestResponse.statusText}'.`];
    }

    return requestResponse.data as SybilResistanceResponse;
  } catch (error: unknown) {
    handleProviderAxiosError(error, "holonym", [address]);
  }
};
