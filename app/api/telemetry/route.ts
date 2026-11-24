import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({ event: z.enum(["payment_request_failed", "clipboard_failed", "unhandled_error", "unhandled_rejection"]) }).strict();

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new NextResponse(null, { status: 415 });
  const body = await request.text();
  if (body.length > 256) return new NextResponse(null, { status: 413 });
  let data: unknown;
  try { data = JSON.parse(body); } catch { return new NextResponse(null, { status: 400 }); }
  const parsed = eventSchema.safeParse(data);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  console.error(JSON.stringify({ level: "error", event: parsed.data.event, source: "browser", timestamp: new Date().toISOString() }));
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
