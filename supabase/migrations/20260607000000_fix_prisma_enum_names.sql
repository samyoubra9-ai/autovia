-- Réparation : renommer les enums snake_case → PascalCase attendus par Prisma
-- (si les migrations 20260605/20260606 ont déjà été appliquées avec l'ancien nom)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
      ALTER TYPE subscription_plan RENAME TO "SubscriptionPlan";
    ELSE
      CREATE TYPE "SubscriptionPlan" AS ENUM ('ESSENTIEL', 'PRO', 'ELITE');
    END IF;
  END IF;
END $$;

ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS subscription_plan "SubscriptionPlan",
  ADD COLUMN IF NOT EXISTS max_eleves_override integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BillingPeriod') THEN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_period') THEN
      ALTER TYPE billing_period RENAME TO "BillingPeriod";
    ELSE
      CREATE TYPE "BillingPeriod" AS ENUM ('ANNUAL', 'MONTHLY', 'TRIAL', 'COMPLIMENTARY', 'CUSTOM');
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS subscription_billing_records (
  id                text PRIMARY KEY,
  auto_ecole_id     text NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  site_admin_id     text REFERENCES site_admins(id) ON DELETE SET NULL,
  subscription_plan "SubscriptionPlan",
  amount_dzd        integer,
  billing_period    "BillingPeriod" NOT NULL,
  paid_until        date,
  reference         text,
  notes             text,
  access_action     text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_billing_records_auto_ecole_created_idx
  ON subscription_billing_records (auto_ecole_id, created_at DESC);
