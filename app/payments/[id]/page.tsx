import Link from "next/link";
import { notFound } from "next/navigation";
import { findPayment } from "@/lib/payment-query";
import { formatAmount } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function PaymentDetails({ params }: { params: Promise<{ id: string }> }) {
  const payment = await findPayment((await params).id);
  if (!payment) notFound();
  const created = payment.created.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return <main className="detail-page"><Link className="detail-back" href="/">← All payments</Link><div className="detail-heading"><div><p>Payment details</p><h1>{formatAmount(payment.amount, payment.currency)}</h1><span className={`status status-${payment.status.toLowerCase()}`}><i/>{payment.status}</span></div></div><div className="detail-grid"><section className="detail-card"><h2>Payment information</h2><dl><div><dt>Payment ID</dt><dd>{payment.id}</dd></div><div><dt>Customer</dt><dd>{payment.customer.name}<br/>{payment.customer.email}</dd></div><div><dt>Payment method</dt><dd>{payment.method}{payment.brand && payment.last4 ? ` · ${payment.brand} •••• ${payment.last4}` : ""}</dd></div><div><dt>Created</dt><dd>{created} UTC</dd></div></dl></section><section className="detail-card"><h2>Timeline</h2><ol className="detail-timeline"><li><strong>Payment created</strong><span>{created} UTC</span></li><li><strong>Current status: {payment.status}</strong><span>Status change time is not available in the demo data.</span></li></ol><h2>Metadata</h2><p>No metadata is recorded for this synthetic payment.</p></section></div></main>;
}
