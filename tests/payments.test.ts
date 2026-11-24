import { describe, expect, it } from "vitest";
import { formatAmount, loadJsonPayments, payments } from "../lib/payments";
import { getPaymentRepository, JsonPaymentRepository, parseQuery } from "../lib/payment-query";

describe("payment fixture", () => {
  it("provides 800 deterministic fictitious payments", () => {
    expect(payments).toHaveLength(800);
    expect(payments[0].id).toMatch(/^pi_3Q/);
  });

  it("formats amounts with their selected currency", () => {
    expect(formatAmount(12345, "USD")).toBe("$123.45");
    expect(formatAmount(12345, "BRL")).toBe("R$123.45");
  });
  it("uses edited JSON records as the displayed contract", async () => {
    const edited = payments.slice(0, 2).map(payment => ({ ...payment, created: payment.created.toISOString() }));
    edited[0] = { ...edited[0], amount: 98765, status: "Succeeded", method: "PIX", brand: undefined, last4: undefined, customer: { name: "Fixture Edit", email: "fixture.edit@example.com" } };
    const parsed = loadJsonPayments(edited);
    expect(parsed[0]).toMatchObject({ amount: 98765, status: "Succeeded", method: "PIX", customer: { name: "Fixture Edit" } });
  });
  it("queries JSON without DATABASE_URL and keeps PostgreSQL opt-in", async () => {
    const page = await getPaymentRepository("json").query(parseQuery(new URLSearchParams("range=Custom&pageSize=25")));
    expect(page.source).toBe("json");
    expect(page.total).toBe(800);
    await expect(getPaymentRepository("postgres").query(parseQuery(new URLSearchParams()))).rejects.toThrow("DATABASE_URL is required");
  });
  it("reflects JSON additions, deletions, status changes, search and pagination", async () => {
    const changed = payments.slice(1, 101).map(payment => ({ ...payment }));
    const moved = { ...payments[0], id: "pi_jsonchangedpayme", status: "Succeeded" as const, customer: { name: "JSON Added", email: "json.added@example.com" } };
    changed.push(moved);
    const repository = new JsonPaymentRepository(changed);
    const succeeded = await repository.query(parseQuery(new URLSearchParams("status=Succeeded&q=json.added@example.com&range=Custom&pageSize=25")));
    expect(succeeded.total).toBe(1);
    expect(succeeded.payments[0].id).toBe("pi_jsonchangedpayme");
    const deleted = await repository.query(parseQuery(new URLSearchParams(`q=${payments[0].id}&range=Custom&pageSize=25`)));
    expect(deleted.total).toBe(0);
    const page = await repository.query(parseQuery(new URLSearchParams("range=Custom&pageSize=100&page=1")));
    expect(page.payments).toHaveLength(1);
  });
});
