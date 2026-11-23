import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const names = ["Ana Martins", "Lucas Rocha", "Maya Thompson", "Diego Alves", "Olivia Chen", "Rafael Costa", "Emma Wilson", "Noah Santos", "Sofia Lima", "Theo Walker", "Camila Ribeiro", "Arthur Lee"];
const statuses = ["Succeeded", "Succeeded", "Succeeded", "Pending", "Failed", "Refunded"];
const methods = ["Card", "Card", "Card", "PIX", "Bank transfer", "Apple Pay"];
const currencies = ["USD", "BRL", "EUR", "GBP"];
const brands = ["Visa", "Mastercard", "Amex"];
const random = (seed) => { const value = Math.sin(seed * 999) * 10000; return value - Math.floor(value); };
const now = new Date("2026-11-23T12:00:00.000Z");
const records = Array.from({ length: 800 }, (_, index) => {
  const n = index + 1; const method = methods[Math.floor(random(n + 5) * methods.length)]; const name = names[Math.floor(random(n + 17) * names.length)];
  return { id: `pi_3Q${String(700000 + n).padStart(8, "0")}payme`, name, email: `${name.toLowerCase().replace(" ", ".")}+${n}@example.com`, amount: Math.round((5 + random(n + 33) * 2495) * 100), currency: currencies[Math.floor(random(n + 47) * currencies.length)], status: statuses[Math.floor(random(n + 61) * statuses.length)], method, brand: method === "Card" || method === "Apple Pay" ? brands[Math.floor(random(n + 70) * brands.length)] : null, last4: method === "Card" || method === "Apple Pay" ? String(1000 + Math.floor(random(n + 73) * 8999)) : null, createdAt: new Date(now.getTime() - Math.floor(random(n + 91) * 92) * 86400000 - Math.floor(random(n + 99) * 86400000)) };
});

await prisma.payment.createMany({ data: records, skipDuplicates: true });
console.log(`Seed completed: ${records.length} deterministic payments ensured.`);
await prisma.$disconnect();
