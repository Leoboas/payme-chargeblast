export type PaymentStatus = "Succeeded" | "Pending" | "Failed" | "Refunded";
export type PaymentMethod = "Card" | "PIX" | "Bank transfer" | "Apple Pay";

export interface Payment {
  id: string;
  customer: { name: string; email: string };
  amount: number;
  currency: "USD" | "BRL" | "EUR" | "GBP";
  status: PaymentStatus;
  method: PaymentMethod;
  brand?: "Visa" | "Mastercard" | "Amex";
  last4?: string;
  created: Date;
}
