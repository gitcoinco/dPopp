// --- Types
import { ProofRecord } from "@gitcoin/passport-types";

// --- Base64 encoding
import * as base64 from "@ethersproject/base64";

// --- Crypto lib for hashing
import { createHash } from "crypto";

// Keeping track of the hashing mechanism (algo + content)
export const VERSION = "v0.0.0";

export type NullifierGenerator = ({ record }: { record: ProofRecord }) => Promise<string>;

// Create an ordered array of the given input (of the form [[key:string, value:string], ...])
export const objToSortedArray = (obj: { [k: string]: string }): string[][] => {
  const keys: string[] = Object.keys(obj).sort();
  return keys.reduce((out: string[][], key: string) => {
    out.push([key, obj[key]]);
    return out;
  }, [] as string[][]);
};

const hashValueWithSecret = ({ secret, value }: { secret: string; value: string }) =>
  base64.encode(createHash("sha256").update(secret, "utf-8").update(value, "utf-8").digest());

export const HashNullifierGenerator =
  ({ key }: { key: string }): NullifierGenerator =>
  ({ record }) => {
    const value = JSON.stringify(objToSortedArray(record));
    const hashedRecord = hashValueWithSecret({ secret: key, value });
    return Promise.resolve(`${VERSION}:${hashedRecord}`);
  };

// TODO MishtiNullifierGenerator = ({ mishtiClientKey, secret }: { mishtiClientKey: string, secret: string }): NullifierGenerator => async ({ record }) => {
