import { NextResponse } from "next/server";

const queryParameter = (name: string, schema: Record<string, unknown>, description: string, array = false) => ({ name, in: "query", required: false, description, schema, ...(array ? { style: "form", explode: true } : {}) });
const paymentSchema = { type: "object", required: ["id", "customer", "amount", "currency", "status", "method", "created"], properties: {
  id: { type: "string", example: "pi_3Q00700001payme" }, customer: { type: "object", required: ["name", "email"], properties: { name: { type: "string" }, email: { type: "string", format: "email" } } },
  amount: { type: "integer", description: "Amount in the smallest currency unit." }, currency: { type: "string", enum: ["USD", "BRL", "EUR", "GBP"] },
  status: { type: "string", enum: ["Succeeded", "Pending", "Failed", "Refunded"] }, method: { type: "string", enum: ["Card", "PIX", "Bank transfer", "Apple Pay"] },
  brand: { type: "string", nullable: true }, last4: { type: "string", nullable: true }, created: { type: "string", format: "date-time" },
} };
const errorResponse = (description: string) => ({ description, content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } });

export function GET() {
  return NextResponse.json({
    openapi: "3.0.3", info: { title: "Payme Payments API", version: "1.1.0", description: "Read-only synthetic payment data and privacy-preserving browser error reports. No real Stripe integration." },
    components: { schemas: { Payment: paymentSchema, Error: { type: "object", required: ["error"], properties: { error: { type: "string" }, requestId: { type: "string", description: "Reference for server-side errors." } } } } },
    paths: {
      "/api/payments": { get: { summary: "List payments", description: "Filters are combined. Amount limits use major currency units; custom dates are inclusive UTC dates. Repeat array parameters to select multiple values.", parameters: [
        queryParameter("q", { type: "string", maxLength: 120 }, "Search payment ID, customer email or card last four digits."),
        queryParameter("status", { type: "array", items: { type: "string", enum: ["Succeeded", "Pending", "Failed", "Refunded"] } }, "Repeat to select statuses.", true),
        queryParameter("method", { type: "array", items: { type: "string", enum: ["Card", "PIX", "Bank transfer", "Apple Pay"] } }, "Repeat to select payment methods.", true),
        queryParameter("currency", { type: "array", items: { type: "string", enum: ["USD", "BRL", "EUR", "GBP"] } }, "Repeat to select currencies.", true),
        queryParameter("range", { type: "string", enum: ["Today", "7 days", "30 days", "Custom"], default: "30 days" }, "Rolling date preset, or a custom inclusive UTC date range."),
        queryParameter("from", { type: "string", format: "date" }, "Inclusive UTC start date; required for Custom."), queryParameter("to", { type: "string", format: "date" }, "Inclusive UTC end date; required for Custom."),
        queryParameter("min", { type: "number", minimum: 0 }, "Minimum amount in major currency units."), queryParameter("max", { type: "number", minimum: 0 }, "Maximum amount in major currency units."),
        queryParameter("sort", { type: "string", enum: ["created-desc", "created-asc", "amount-desc", "amount-asc", "status-asc", "status-desc"], default: "created-desc" }, "Sort with payment ID as a stable tie-breaker."),
        queryParameter("page", { type: "integer", minimum: 0, default: 0 }, "Zero-based page index."), queryParameter("pageSize", { type: "integer", enum: [25, 50, 100], default: 25 }, "Maximum rows returned."),
      ], responses: { "200": { description: "One page and matching record count.", content: { "application/json": { schema: { type: "object", required: ["payments", "total", "source"], properties: { payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } }, total: { type: "integer" }, source: { type: "string", enum: ["json", "postgres"] } } } } } }, "400": errorResponse("Invalid query parameters."), "500": errorResponse("Unable to query payments.") } } },
      "/api/payments/{id}": { get: { summary: "Get a payment", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Synthetic payment ID." }], responses: { "200": { description: "Payment record.", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } }, "404": errorResponse("Payment not found."), "500": errorResponse("Unable to load payment.") } } },
      "/api/telemetry": { post: { summary: "Report a browser error category", description: "Same-origin only. No customer data, URLs or raw error messages are accepted.", requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: false, required: ["event"], properties: { event: { type: "string", enum: ["payment_request_failed", "clipboard_failed", "unhandled_error", "unhandled_rejection"] } } } } } }, responses: { "204": { description: "Event accepted." }, "400": { description: "Invalid event." }, "403": { description: "Origin rejected." }, "413": { description: "Payload too large." }, "415": { description: "JSON required." } } } },
    },
  });
}
