import { ensureField } from "./response-helpers";

describe("ensureField", () => {
  it("propagates existing errors", () => {
    const result = ensureField({ error: "boom" } as any, "catalog" as any, "missing");
    expect(result).toEqual({ error: "boom" });
  });

  it("returns data when the key exists", () => {
    const payload = { catalog: { name: "driver" } };
    const result = ensureField(payload as any, "catalog" as any, "missing");
    expect(result).toEqual({ data: payload.catalog });
  });

  it("reports an error when the key is absent", () => {
    const payload = { catalog: null };
    const result = ensureField(payload as any, "catalog" as any, "missing");
    expect(result).toEqual({ error: "missing" });
  });
});
