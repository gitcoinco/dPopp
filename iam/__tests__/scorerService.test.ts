import { fetchPassportScore } from "../src/utils/scorerService.js";

// Import the entire module to help with typing
import * as scorerService from "../src/utils/scorerService.js";

// Type for the mocked function (adjust as needed based on the actual implementation)
type MockedFunction = jest.MockedFunction<typeof scorerService.fetchPassportScore>;

jest.mock("../src/utils/scorerService", () => {
  const actualModule = jest.requireActual("../src/utils/scorerService");
  return {
    ...actualModule,
    fetchPassportScore: jest.fn(),
  } as typeof scorerService;
});

describe("score utilities", () => {
  let mockedFetchPassportScore: MockedFunction;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Get the mocked function
    mockedFetchPassportScore = scorerService.fetchPassportScore as MockedFunction;
  });

  it("should return custom scorer id if provided", async () => {
    // Set up the mock implementation for this specific test
    mockedFetchPassportScore.mockResolvedValue({ score: 10, scorer_id: 1 });

    const score = await fetchPassportScore("recipient", 1);
    expect(score).toEqual({ score: 10, scorer_id: 1 });
    expect(mockedFetchPassportScore).toHaveBeenCalledWith("recipient", 1);
  });
});
