-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('starter', 'pro', 'scale');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- CreateEnum
CREATE TYPE "SupportLevel" AS ENUM ('standard', 'priority', 'vip');

-- CreateEnum
CREATE TYPE "OnboardingTier" AS ENUM ('basic', 'assisted', 'concierge');

-- Normalize legacy plan values before converting the column to an enum
UPDATE "tenants"
SET "plan_type" = CASE
    WHEN "plan_type" = 'enterprise' THEN 'scale'
    WHEN "plan_type" IN ('starter', 'pro', 'scale') THEN "plan_type"
    ELSE 'starter'
END;

-- AlterTable
ALTER TABLE "tenants"
ALTER COLUMN "plan_type" DROP DEFAULT,
ALTER COLUMN "plan_type" TYPE "TenantPlan" USING "plan_type"::"TenantPlan",
ALTER COLUMN "plan_type" SET DEFAULT 'starter';

-- AlterTable
ALTER TABLE "tenants"
ADD COLUMN "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "max_users" INTEGER,
ADD COLUMN "max_customers" INTEGER,
ADD COLUMN "max_invoices" INTEGER,
ADD COLUMN "support_level" "SupportLevel",
ADD COLUMN "onboarding_tier" "OnboardingTier";

-- Backfill billing limits and service tiers from the current plan
UPDATE "tenants"
SET
  "max_users" = CASE "plan_type"
    WHEN 'pro' THEN 3
    WHEN 'scale' THEN 10
    ELSE 1
  END,
  "max_customers" = CASE "plan_type"
    WHEN 'pro' THEN 2000
    WHEN 'scale' THEN 20000
    ELSE 300
  END,
  "max_invoices" = CASE "plan_type"
    WHEN 'pro' THEN 10000
    WHEN 'scale' THEN 100000
    ELSE 1000
  END,
  "support_level" = CASE "plan_type"
    WHEN 'pro' THEN 'priority'::"SupportLevel"
    WHEN 'scale' THEN 'vip'::"SupportLevel"
    ELSE 'standard'::"SupportLevel"
  END,
  "onboarding_tier" = CASE "plan_type"
    WHEN 'pro' THEN 'assisted'::"OnboardingTier"
    WHEN 'scale' THEN 'concierge'::"OnboardingTier"
    ELSE 'basic'::"OnboardingTier"
  END;

-- AlterTable
ALTER TABLE "tenants"
ALTER COLUMN "max_users" SET NOT NULL,
ALTER COLUMN "max_users" SET DEFAULT 1,
ALTER COLUMN "max_customers" SET NOT NULL,
ALTER COLUMN "max_customers" SET DEFAULT 300,
ALTER COLUMN "max_invoices" SET NOT NULL,
ALTER COLUMN "max_invoices" SET DEFAULT 1000,
ALTER COLUMN "support_level" SET NOT NULL,
ALTER COLUMN "support_level" SET DEFAULT 'standard',
ALTER COLUMN "onboarding_tier" SET NOT NULL,
ALTER COLUMN "onboarding_tier" SET DEFAULT 'basic';

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_customer_id_key" ON "tenants"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_stripe_subscription_id_key" ON "tenants"("stripe_subscription_id");
