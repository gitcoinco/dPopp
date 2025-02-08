import crypto from "crypto";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { initCacheSession, loadCacheSession, clearCacheSession, PlatformSession } from "../../utils/platform-cache.js";
import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, ProviderInternalVerificationError } from "../../types.js";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

type IdenaCache = {
  address?: string;
  nonce?: string;
  signature?: string;
};

// Idena API url
const API_URL = "https://api.idena.io/";

const generateToken = (): string => {
  return `idena-${crypto.randomBytes(32).toString("hex")}`;
};

const generateNonce = (): string => {
  return `signin-${crypto.randomBytes(32).toString("hex")}`;
};

export const initSession = async (): Promise<string> => {
  const token = await initCacheSession(generateToken());
  return token;
};

const loadIdenaCache = async (token: string): Promise<PlatformSession<IdenaCache>> => await loadCacheSession(token);

export const loadIdenaSession = async (token: string, address: string): Promise<string | undefined> => {
  try {
    const session = await loadIdenaCache(token);
    const nonce = generateNonce();

    await session.set("nonce", nonce);
    await session.set("address", address);

    return nonce;
  } catch (error) {
    throw new ProviderInternalVerificationError("Session missing or expired, try again");
  }
};

export const authenticate = async (token: string, signature: string): Promise<boolean> => {
  const session = await loadCacheSession(token);
  if (!session.get("address") || session.get("signature")) {
    return false;
  }
  let address;
  try {
    address = await requestSignatureAddress(session.get("nonce"), signature);
  } catch (e) {
    return false;
  }
  if (!address || address.toLowerCase() !== session.get("address").toLowerCase()) {
    return false;
  }
  await session.set("signature", signature);
  return true;
};

type SignatureAddressResponse = {
  result: string;
};

type EpochResponse = {
  result: { validationTime: string };
};

type IdentityResponse = {
  result: { state: string };
  address: string;
};

type IdentityAgeResponse = {
  result: string;
  address: string;
};

type AddressResponse = {
  result: { stake: string };
  address: string;
};

type IdenaMethod =
  | "/api/epoch/last"
  | "/api/identity/_address_"
  | "/api/identity/_address_/age"
  | "/api/address/_address_";

export type IdenaContext = ProviderContext & {
  idena: {
    address?: string;
    responses: {
      [key in IdenaMethod]?: AxiosResponse<{ error?: { message?: string } }>;
    };
  };
};

const requestSignatureAddress = async (nonce: string, signature: string): Promise<string> => {
  const response: { data: SignatureAddressResponse } = await apiClient().get(
    `/api/SignatureAddress?value=${nonce}&signature=${signature}`
  );
  return response.data.result;
};

const requestValidationTime = async (token: string, context: IdenaContext): Promise<string> => {
  const data: EpochResponse = await request(token, context, "/api/epoch/last");
  return data.result.validationTime;
};

export const requestIdentityState = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; state: string; expirationDate: string }> => {
  const data: IdentityResponse = await request(token, context, "/api/identity/_address_");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, state: data?.result?.state ? data.result.state : "N/A", expirationDate };
};

export const requestIdentityAge = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; age: number; expirationDate: string }> => {
  const data: IdentityAgeResponse = await request(token, context, "/api/identity/_address_/age");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, age: +data.result, expirationDate };
};

export const requestIdentityStake = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; stake: number; expirationDate: string }> => {
  const data: AddressResponse = await request(token, context, "/api/address/_address_");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, stake: data?.result?.stake ? +data.result.stake : 0, expirationDate };
};

const apiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: API_URL,
  });
};

const loadSessionAddress = async (token: string, context: IdenaContext): Promise<string> => {
  if (!context.idena) context.idena = { responses: {} };
  if (!context.idena.address) {
    let session;
    try {
      session = await loadIdenaCache(token);
    } catch {}

    if (!session || !session.get("address") || !session.get("signature")) {
      throw new ProviderInternalVerificationError("Session missing or expired, try again");
    }
    context.idena.address = session.get("address");
    await clearCacheSession(token);
  }
  return context.idena.address;
};

const request = async <T>(token: string, context: IdenaContext, method: IdenaMethod): Promise<T> => {
  const address = await loadSessionAddress(token, context);

  let response = context.idena.responses[method];
  if (!response) {
    try {
      response = await apiClient().get<{ error?: { message?: string } }>(method.replace("_address_", address));
    } catch (error: unknown) {
      handleProviderAxiosError(error, `Idena ${method}`);
    }
    context.idena.responses[method] = response;
  }

  const { data } = response;
  if (data.error?.message) {
    throw new ProviderExternalVerificationError("Idena API returned error: " + data.error.message);
  }

  return { ...data, address } as T;
};
