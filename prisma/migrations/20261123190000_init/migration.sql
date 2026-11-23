CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" VARCHAR(16) NOT NULL,
  "method" VARCHAR(24) NOT NULL,
  "brand" VARCHAR(16),
  "last4" VARCHAR(4),
  "created_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_created_id_idx" ON "payments"("created_at", "id");
CREATE INDEX "payment_status_created_id_idx" ON "payments"("status", "created_at", "id");
CREATE INDEX "payment_method_created_id_idx" ON "payments"("method", "created_at", "id");
CREATE INDEX "payment_amount_id_idx" ON "payments"("amount", "id");
CREATE INDEX "payment_email_idx" ON "payments"("email");
