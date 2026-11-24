import { z } from "zod";
import paymentFixture from "@/data/payments.json";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/payment";

const paymentFixtureSchema = z.array(z.object({
  id: z.string().regex(/^pi_[A-Za-z0-9]+$/),
  customer: z.object({ name: z.string().min(1), email: z.string().email() }),
  amount: z.number().int().nonnegative(),
  currency: z.enum(["USD", "BRL", "EUR", "GBP"]),
  status: z.enum(["Succeeded", "Pending", "Failed", "Refunded"]),
  method: z.enum(["Card", "PIX", "Bank transfer", "Apple Pay"]),
  brand: z.enum(["Visa", "Mastercard", "Amex"]).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  created: z.string().datetime(),
}).superRefine((payment, context) => {
  const needsCardDetails = payment.method === "Card" || payment.method === "Apple Pay";
  if (needsCardDetails && (!payment.brand || !payment.last4)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Card payments require brand and last4" });
  if (!needsCardDetails && (payment.brand || payment.last4)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Non-card payments cannot include card data" });
}));

export type PaymentFixtureRecord = z.infer<typeof paymentFixtureSchema>[number];

export function loadJsonPayments(input: unknown): Payment[] {
  return paymentFixtureSchema.parse(input).map(payment => ({ ...payment, status: payment.status as PaymentStatus, method: payment.method as PaymentMethod, created: new Date(payment.created) }));
}

// Canonical demo source: local, checked in, and credential-free.
export const payments = loadJsonPayments(paymentFixture);

export function formatAmount(amount: number, currency: Payment["currency"]) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);
}
