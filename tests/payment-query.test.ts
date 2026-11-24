import { describe, expect, it } from "vitest";
import { parseQuery, queryFixtures } from "../lib/payment-query";

describe("payments query security", () => {
  it("rejects unapproved sorting and page sizes", () => {
    expect(() => parseQuery(new URLSearchParams("sort=id-desc&pageSize=999"))).toThrow();
  });
  it("keeps a stable page of combined filters", () => {
    const query = parseQuery(new URLSearchParams("status=Succeeded&method=Card&range=Custom&sort=amount-desc&pageSize=25"));
    const page = queryFixtures(query);
    expect(page.payments.length).toBeLessThanOrEqual(25);
    expect(page.payments.every(payment => payment.status === "Succeeded" && payment.method === "Card")).toBe(true);
  });
  it("filters the synthetic page by an approved currency", () => {
    const query = parseQuery(new URLSearchParams("currency=BRL&range=Custom&pageSize=100"));
    const page = queryFixtures(query);
    expect(page.total).toBeGreaterThan(0);
    expect(page.payments.every(payment => payment.currency === "BRL")).toBe(true);
  });
  it("does not turn injection-shaped search into a database command", () => {
    const query = parseQuery(new URLSearchParams("q=' OR 1=1 --&range=Custom"));
    expect(queryFixtures(query).total).toBe(0);
  });
});
