// Need to do this here instead of in the identity package
// so that this isn't loaded in the browser

// ---- Types
import { ProofRecord } from "@gitcoin/passport-types";

// ---- Generate & Verify methods
import { objToSortedArray } from "@gitcoin/passport-identity";

// All provider exports from platforms
import { readFileSync } from "fs";
import { join, dirname } from "path";

import { initSync as mishtiInitSync, generate_oprf } from "@holonym-foundation/mishtiwasm";

let mishtiInitialized = false;
const initializeMishti = async () => {
  if (mishtiInitialized) return;

  await Promise.resolve();
  const monorepoBaseDir = dirname(process.cwd());
  const wasmPath = join(monorepoBaseDir, "node_modules/@holonym-foundation/mishtiwasm/pkg/esm", "mishtiwasm_bg.wasm");

  // console.log("Loading wasm module", wasmPath);
  const wasmModuleBuffer = readFileSync(wasmPath);

  mishtiInitSync({ module: wasmModuleBuffer });

  mishtiInitialized = true;
};

export const recordToNullifier = async ({ record }: { record: ProofRecord }) => {
  const cleartextNullifier = JSON.stringify(objToSortedArray(record));
  await initializeMishti();

  const nullifier = await generate_oprf(
    process.env.MISHTI_CLIENT_PRIVATE_KEY,
    cleartextNullifier,
    "OPRFSecp256k1",
    process.env.MISHTI_RELAY_URL
  );

  // console.log("nullifier", nullifier);
  return nullifier;
};
