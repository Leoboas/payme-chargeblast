import { NextRequest, NextResponse } from "next/server";
import { parseQuery, queryPayments } from "@/lib/payment-query";

export async function GET(request: NextRequest) {
  try { return NextResponse.json(await queryPayments(parseQuery(request.nextUrl.searchParams))); }
  catch (error) { const message = error instanceof Error ? error.message : "Unable to load payments"; return NextResponse.json({ error: message }, { status: 400 }); }
}
