import { NextRequest, NextResponse } from "next/server";
import { parseQuery, queryPayments } from "@/lib/payment-query";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try { return NextResponse.json(await queryPayments(parseQuery(request.nextUrl.searchParams)), { headers: { "Cache-Control": "no-store, max-age=0" } }); }
  catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid payment query" }, { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } });
    const requestId = crypto.randomUUID();
    console.error(JSON.stringify({ level: "error", event: "payment_query_failed", source: "server", requestId, timestamp: new Date().toISOString() }));
    return NextResponse.json({ error: "Unable to load payments", requestId }, { status: 500, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
