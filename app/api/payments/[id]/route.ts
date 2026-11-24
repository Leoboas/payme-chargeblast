import { NextResponse } from "next/server";
import { findPayment } from "@/lib/payment-query";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payment = await findPayment((await params).id);
    return payment ? NextResponse.json(payment, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ error: "Payment not found" }, { status: 404 });
  } catch {
    const requestId = crypto.randomUUID();
    console.error(JSON.stringify({ level: "error", event: "payment_detail_failed", requestId, timestamp: new Date().toISOString() }));
    return NextResponse.json({ error: "Unable to load payment", requestId }, { status: 500 });
  }
}
