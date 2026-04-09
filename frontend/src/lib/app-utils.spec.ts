import { describe, expect, it, vi } from "vitest";
import { translatePriceFilterLabel } from "./app-utils";

describe("translatePriceFilterLabel", () => {
  const translator = vi.fn((key: string) => key);

  it("maps each known option to the right translation key", () => {
    expect(translatePriceFilterLabel("Under $50", translator)).toBe("catalog.under50");
    expect(translatePriceFilterLabel("$50 - $100", translator)).toBe("catalog.50to100");
    expect(translatePriceFilterLabel("$100 - $250", translator)).toBe("catalog.100to250");
    expect(translatePriceFilterLabel("$250 - $500", translator)).toBe("catalog.250to500");
    expect(translatePriceFilterLabel("Over $500", translator)).toBe("catalog.over500");
  });

  it("falls back to the original option if it is unrecognized", () => {
    expect(translatePriceFilterLabel("Custom", translator)).toBe("Custom");
  });
});
