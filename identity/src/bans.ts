import { CredentialResponseBody, ValidResponseBody, VerifiableCredential } from "@gitcoin/passport-types";
import { handleAxiosError } from "@gitcoin/passport-platforms";
import { UnexpectedApiError } from "./helpers.js";
import axios from "axios";

const SCORER_ENDPOINT = process.env.SCORER_ENDPOINT;
const SCORER_API_KEY = process.env.SCORER_API_KEY;

type Ban = {
  hash: string;
  is_banned: boolean;
  end_time?: string;
  ban_type?: "account" | "hash" | "single_stamp";
  reason?: string;
};

export const checkCredentialBans = async (
  credentialResponses: CredentialResponseBody[]
): Promise<CredentialResponseBody[]> => {
  const credentialsToCheck = credentialResponses
    .filter((credentialResponse): credentialResponse is ValidResponseBody =>
      Boolean((credentialResponse as ValidResponseBody).credential)
    )
    .map(({ credential }) => credential);

  const bans = await fetchBans(credentialsToCheck);
  const bansByHash = bans.reduce((acc, ban) => {
    acc[ban.hash] = ban;
    return acc;
  }, {} as Record<string, Ban>);

  return credentialResponses.map((credentialResponse) => {
    const credential = (credentialResponse as ValidResponseBody).credential;
    if (!credential) {
      return credentialResponse;
    }

    const ban = bansByHash[credential.credentialSubject.hash];

    if (!ban) {
      throw new UnexpectedApiError(
        `Ban not found for hash ${credential.credentialSubject.hash}. This should not happen.`
      );
    }

    if (ban.is_banned) {
      return {
        error:
          `Credential is banned. Type=${ban.ban_type}, End=${ban.end_time || "indefinite"},` +
          (ban.reason ? ` Reason=${ban.reason}` : ""),
        code: 403,
      };
    }

    return credentialResponse;
  });
};

const fetchBans = async (credentials: VerifiableCredential[]): Promise<Ban[]> => {
  if (!credentials.length) {
    return [];
  }

  const payload = credentials.map((credential) => {
    const { hash, provider, id } = credential.credentialSubject;
    return {
      credentialSubject: {
        hash,
        provider,
        id,
      },
    };
  });

  try {
    const banResponse: {
      data?: Ban[];
    } = await axios.post(`${SCORER_ENDPOINT}/internal/check-bans`, payload, {
      headers: {
        Authorization: SCORER_API_KEY,
      },
    });

    return banResponse.data || [];
  } catch (e) {
    handleAxiosError(e, "Bans", UnexpectedApiError, [SCORER_API_KEY]);
  }
};
