import type { Payment, PaymentMethod, PaymentStatus } from "@/types/payment";

const names = ["Ana Martins", "Lucas Rocha", "Maya Thompson", "Diego Alves", "Olivia Chen", "Rafael Costa", "Emma Wilson", "Noah Santos", "Sofia Lima", "Theo Walker", "Camila Ribeiro", "Arthur Lee"];
const statuses: PaymentStatus[] = ["Succeeded", "Succeeded", "Succeeded", "Pending", "Failed", "Refunded"];
const methods: PaymentMethod[] = ["Card", "Card", "Card", "PIX", "Bank transfer", "Apple Pay"];
const currencies: Payment["currency"][] = ["USD", "BRL", "EUR", "GBP"];
const brands: NonNullable<Payment["brand"]>[] = ["Visa", "Mastercard", "Amex"];
const fixtureNow = new Date("2026-11-23T12:00:00.000Z");

function random(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export const payments: Payment[] = Array.from({ length: 800 }, (_, index) => {
  const n = index + 1;
  const method = methods[Math.floor(random(n + 5) * methods.length)];
  const person = names[Math.floor(random(n + 17) * names.length)];
  const dayOffset = Math.floor(random(n + 91) * 92);
  const created = new Date(fixtureNow.getTime() - dayOffset * 86400000 - Math.floor(random(n + 99) * 86400000));
  return {
    id: `pi_3Q${String(700000 + n).padStart(8, "0")}payme`,
    customer: { name: person, email: `${person.toLowerCase().replace(" ", ".")}+${n}@example.com` },
    amount: Math.round((5 + random(n + 33) * 2495) * 100),
    currency: currencies[Math.floor(random(n + 47) * currencies.length)],
    status: statuses[Math.floor(random(n + 61) * statuses.length)],
    method,
    brand: method === "Card" || method === "Apple Pay" ? brands[Math.floor(random(n + 70) * brands.length)] : undefined,
    last4: method === "Card" || method === "Apple Pay" ? String(1000 + Math.floor(random(n + 73) * 8999)) : undefined,
    created
  };
});

export function formatAmount(amount: number, currency: Payment["currency"]) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);
}
