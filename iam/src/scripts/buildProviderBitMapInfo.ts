import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";
import axios from "axios";

import { StampMetadata, mapBitMapInfo } from "../utils/easPassportSchema.js";

dotenv.config();

const stampMetadataEndpoint = process.env.PASSPORT_STAMP_METADATA_PATH || "";

const formatProviderBitMapInfo = async (): Promise<void> => {
  const stampMetadata: {
    data: StampMetadata;
  } = await axios.get(stampMetadataEndpoint);

  const bitMapInfo = mapBitMapInfo(stampMetadata.data);

  const outPath = join(__dirname, "..", "static", "providerBitMapInfo.json");
  console.log(`Saving platform info to JSON file at ${outPath}`);

  writeFileSync(outPath, JSON.stringify(bitMapInfo));
};

formatProviderBitMapInfo()
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    console.log("Done! BitMap info saved");
  });
