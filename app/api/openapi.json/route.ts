import { NextResponse } from "next/server";

const queryParameter = (name: string, schema: Record<string, unknown>) => ({ name, in: "query", schema });

export function GET() {
  const document = {
    openapi: "3.0.3",
    info: { title: "Payme Payments API", version: "1.0.0", description: "Read-only synthetic payments API for the Payme demo." },
    paths: {
      "/api/payments": {
        get: {
          summary: "List payments",
          parameters: [
            queryParameter("q", { type: "string", maxLength: 120 }),
            queryParameter("status", { type: "array", items: { type: "string", enum: ["Succeeded", "Pending", "Failed", "Refunded"] } }),
            queryParameter("method", { type: "array", items: { type: "string", enum: ["Card", "PIX", "Bank transfer", "Apple Pay"] } }),
            queryParameter("currency", { type: "array", items: { type: "string", enum: ["USD", "BRL", "EUR", "GBP"] } }),
            queryParameter("range", { type: "string", enum: ["Today", "7 days", "30 days", "Custom"], default: "30 days" }),
            queryParameter("min", { type: "number", minimum: 0 }), queryParameter("max", { type: "number", minimum: 0 }),
            queryParameter("sort", { type: "string", enum: ["created-desc", "created-asc", "amount-desc", "amount-asc", "status-asc", "status-desc"] }),
            queryParameter("page", { type: "integer", minimum: 0, default: 0 }), queryParameter("pageSize", { type: "integer", enum: [25, 50, 100], default: 25 })
          ],
          responses: {
            "200": { description: "Paginated payments", content: { "application/json": { schema: { type: "object", properties: { total: { type: "integer" }, source: { type: "string", enum: ["database", "fixture"] }, payments: { type: "array", items: { type: "object" } } } } } } },
            "400": { description: "Invalid query parameters" }
          }
        }
      }
    }
  };
  return NextResponse.json(document);
}
