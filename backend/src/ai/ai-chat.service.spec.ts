import { AiChatService } from "./ai-chat.service";

describe("AiChatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "";
  });

  const promptBuilder = { buildSystemPrompt: jest.fn() };
  const catalogContext = {
    getCatalogItems: jest.fn().mockResolvedValue([]),
    getSaleProductsForPrompt: jest.fn().mockResolvedValue([]),
  };
  const fallback = {
    replyWithRules: jest.fn().mockResolvedValue({
      answer: "fallback",
      suggestions: ["a", "b"],
    }),
  };

  const createService = () =>
    new AiChatService(
      promptBuilder as any,
      catalogContext as any,
      fallback as any,
    );

  it("parses JSON replies and caps suggestions at four", () => {
    const service = createService();
    const input = 'Response { "answer": "Hello", "suggestions": ["one","two","three","four","five"] } extra';
    const reply = (service as any).safeParseLlmReply(input, "en");
    expect(reply.answer).toBe("Hello");
    expect(reply.suggestions).toEqual(["one", "two", "three", "four"]);
  });

  it("falls back to the raw text when parsing fails", () => {
    const service = createService();
    const reply = (service as any).safeParseLlmReply("plain text", "ko");
    expect(reply.answer).toBe("plain text");
    const suggestions = (service as any).defaultSuggestions("ko");
    expect(reply.suggestions).toEqual(suggestions);
  });

  it("parses retry hints from Gemini error messages", () => {
    const service = createService();
    expect(
      (service as any).parseGeminiRetrySeconds("Please retry in 3.5s"),
    ).toBeCloseTo(3.5);
    expect(
      (service as any).parseGeminiRetrySeconds("Retry in 123s"),
    ).toBe(90);
    expect(
      (service as any).parseGeminiRetrySeconds("invalid"),
    ).toBeNull();
  });
});
