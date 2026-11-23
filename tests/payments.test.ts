import { describe, expect, it } from "vitest";
import { formatAmount, payments } from "../lib/payments";

describe("payment fixture", () => {
  it("provides 800 deterministic fictitious payments", () => {
    expect(payments).toHaveLength(800);
    expect(payments[0].id).toMatch(/^pi_3Q/);
  });

  it("formats amounts with their selected currency", () => {
    expect(formatAmount(12345, "USD")).toBe("$123.45");
    expect(formatAmount(12345, "BRL")).toBe("R$123.45");
  });
});
