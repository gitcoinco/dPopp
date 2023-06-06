import crypto from "crypto";
import axios, { AxiosInstance, AxiosResponse } from "axios";

// Idena SignIn session
type Session = {
  // Unique internal ID of the session
  token: string;
  // Randomly generated nonce which Idena app signs with users private key
  nonce?: string;
  // Identity address provided by Idena app
  address?: string;
  // Nonce signature provided by Idena app
  signature?: string;
  cache: Record<string, AxiosResponse>;
};

// Idena API url
const API_URL = "https://api.idena.io/";

const TIMEOUT_IN_MS = 300000; // 300000ms = 5min

// Map <Token, Session>
const sessions: Record<string, Session> = {};

const generateToken = (): string => {
  return `idena-${crypto.randomBytes(32).toString("hex")}`;
};

const generateNonce = (): string => {
  return `signin-${crypto.randomBytes(32).toString("hex")}`;
};

export const initSession = (): string => {
  const token = generateToken();
  sessions[token] = {
    token: token,
    cache: {},
  };
  setTimeout(() => {
    deleteSession(token);
  }, TIMEOUT_IN_MS);
  return token;
};

const deleteSession = (token: string): void => {
  delete sessions[token];
};

const getSession = (token: string): Session | undefined => {
  return sessions[token];
};

export const startIdenaSession = (token: string, address: string): string | undefined => {
  const session = getSession(token);
  if (!session || session.nonce) {
    return;
  }
  session.nonce = generateNonce();
  session.address = address;
  return session.nonce;
};

export const authenticate = async (token: string, signature: string): Promise<boolean> => {
  const session = getSession(token);
  if (!session || !session.address || session.signature) {
    return;
  }
  let address;
  try {
    address = await requestSignatureAddress(session.nonce, signature);
  } catch (e) {
    return false;
  }
  if (!address || address.toLowerCase() !== session.address.toLowerCase()) {
    return false;
  }
  session.signature = signature;
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

const requestSignatureAddress = async (nonce: string, signature: string): Promise<string> => {
  const response: { data: SignatureAddressResponse } = await apiClient().get(
    `/api/SignatureAddress?value=${nonce}&signature=${signature}`
  );
  return response.data.result;
};

const requestValidationTime = async (token: string): Promise<string> => {
  const data: EpochResponse = await request(token, "/api/epoch/last");
  return data.result.validationTime;
};

export const requestIdentityState = async (
  token: string
): Promise<{ address: string; state: string; expirationDate: string }> => {
  const data: IdentityResponse = await request(token, "/api/identity/_address_");
  const expirationDate = await requestValidationTime(token);
  return { address: data.address, state: data.result.state, expirationDate };
};

export const requestIdentityAge = async (
  token: string
): Promise<{ address: string; age: number; expirationDate: string }> => {
  const data: IdentityAgeResponse = await request(token, "/api/identity/_address_/age");
  const expirationDate = await requestValidationTime(token);
  return { address: data.address, age: +data.result, expirationDate };
};

export const requestIdentityStake = async (
  token: string
): Promise<{ address: string; stake: number; expirationDate: string }> => {
  const data: AddressResponse = await request(token, "/api/address/_address_");
  const expirationDate = await requestValidationTime(token);
  return { address: data.address, stake: +data.result.stake, expirationDate };
};

const apiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: API_URL,
  });
};

const request = async <T>(token: string, method: string): Promise<T> => {
  const session = getSession(token);
  if (!session) {
    throw "session not found or expired";
  }
  if (!session.signature) {
    throw "authentication not passed";
  }
  method = method.replace("_address_", session.address);
  let response = session.cache[method];
  if (!response) {
    response = await apiClient().get(method);
    session.cache[method] = response;
  }
  if (response.status != 200) {
    throw `get ${method} returned status code ${response.status} instead of the expected 200`;
  }
  return { ...response.data, address: session.address } as T;
};
