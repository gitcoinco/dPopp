import axios from "axios";
import { Score } from "./easStampSchema.js";
import { handleAxiosError } from "@gitcoin/passport-platforms";

export class IAMError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

type GetScoreResponse = {
  data: {
    status: string;
    evidence: {
      rawScore: string;
    };
  };
};

const apiKey = process.env.SCORER_API_KEY;

// Use public endpoint and static api key to fetch score
export async function fetchPassportScore(address: string, customScorerId?: number): Promise<Score> {
  const scorer_id = customScorerId || Number(process.env.ALLO_SCORER_ID);

  const response = await requestScore(address, scorer_id);

  const { data } = response;
  if (data.status !== "DONE") {
    throw new IAMError(`Score not ready yet. Status: ${data.status}`);
  }

  const score: Score = {
    score: Number(data.evidence.rawScore),
    scorer_id,
  };

  return score;
}

async function requestScore(address: string, scorerId: number): Promise<GetScoreResponse> {
  const getScoreUrl = `${process.env.SCORER_ENDPOINT}/ceramic-cache/score/${scorerId}/${address}`;

  try {
    return await axios.get(getScoreUrl, {
      headers: {
        Authorization: apiKey,
      },
    });
  } catch (error) {
    handleAxiosError(error, "Passport score", IAMError, [apiKey]);
  }
}
