-- Add stripePriceId and currentPeriodEnd to tenants table
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "stripe_price_id" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "current_period_end" TIMESTAMP(3);

-- Create StripeEvent table for webhook idempotency
CREATE TABLE IF NOT EXISTS "stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);
