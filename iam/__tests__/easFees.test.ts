import { getEASFeeAmount } from "../src/utils/easFees.js";
import { parseEther } from "ethers";
import Moralis from "moralis";
import { PassportCache } from "@gitcoin/passport-platforms";

jest.mock("moralis", () => ({
  EvmApi: {
    token: {
      getTokenPrice: jest.fn().mockResolvedValue({
        result: { usdPrice: 3000 },
      }),
    },
  },
}));

jest.spyOn(PassportCache.prototype, "init").mockImplementation(() => Promise.resolve());

describe("EthPriceLoader", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.advanceTimersByTime(1000 * 60 * 6); // Advance by 6 minutes
    jest.clearAllMocks();
  });

  describe("getEASFeeAmount", () => {
    it("should calculate the correct EAS Fee amount based on the current ETH price", async () => {
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        if (key === "ethPrice") {
          return Promise.resolve("3000");
        } else if (key === "ethPriceLastUpdate") {
          return Promise.resolve(null);
        }
      });
      const usdFeeAmount = 2;
      const result = await getEASFeeAmount(usdFeeAmount);

      const expectedEthFeeAmount = usdFeeAmount / 3000;
      const expectedBigNumberValue = parseEther(expectedEthFeeAmount.toFixed(18));

      expect(result).toEqual(expectedBigNumberValue);
    });

    it("should handle Moralis errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      let count = 0;
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        count += 1;
        if (key === "ethPrice") {
          if (count === 1) {
            return Promise.resolve(null);
          }
          return Promise.resolve("3000");
        } else if (key === "ethPriceLastUpdate") {
          return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
        }
      });

      jest.spyOn(PassportCache.prototype, "set").mockImplementation(() => Promise.resolve());

      (Moralis.EvmApi.token.getTokenPrice as jest.Mock).mockRejectedValueOnce(new Error("Failed fetching price"));
      await getEASFeeAmount(2);
      expect(consoleSpy).toHaveBeenCalledWith("MORALIS ERROR: Failed to get ETH price, Error: Failed fetching price");
    });

    it("should handle Redis errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      let count = 0;
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        count += 1;
        if (key === "ethPrice") {
          if (count === 1) {
            return Promise.resolve(null);
          }
          return Promise.resolve("3000");
        } else if (key === "ethPriceLastUpdate") {
          return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
        }
      });

      jest.spyOn(PassportCache.prototype, "set").mockRejectedValueOnce(new Error("Failed to store in cache"));

      await getEASFeeAmount(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        "REDIS CONNECTION ERROR: Failed to cache ETH price, Error: Failed to store in cache"
      );
    });
  });

  it("should call Moralis API only once if getEASFeeAmount is called multiple times in succession before cachePeriod is reached", async () => {
    let calls = 0;
    jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
      calls += 1;
      if (key === "ethPrice") {
        return Promise.resolve("3000");
      } else if (key === "ethPriceLastUpdate") {
        if (calls === 1) {
          return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
        } else {
          return Promise.resolve((Date.now() - 1000).toString());
        }
      }
    });

    jest.spyOn(PassportCache.prototype, "set").mockImplementation(() => Promise.resolve());

    await getEASFeeAmount(2);
    await getEASFeeAmount(3);
    await getEASFeeAmount(4);

    expect(Moralis.EvmApi.token.getTokenPrice).toHaveBeenCalledTimes(1);
  });

  it("should call Moralis API again if cachePeriod is exceeded", async () => {
    let calls = 0;
    jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
      calls += 1;
      if (key === "ethPrice") {
        return Promise.resolve("3000");
      } else if (key === "ethPriceLastUpdate") {
        return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
      }
    });

    await getEASFeeAmount(2);

    jest.advanceTimersByTime(1000 * 60 * 6);

    await getEASFeeAmount(2);

    expect(Moralis.EvmApi.token.getTokenPrice).toHaveBeenCalledTimes(2);
  });
});
