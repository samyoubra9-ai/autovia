CREATE TYPE "BillingPeriod" AS ENUM ('ANNUAL', 'MONTHLY', 'TRIAL', 'COMPLIMENTARY', 'CUSTOM');

CREATE TABLE subscription_billing_records (
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

CREATE INDEX subscription_billing_records_auto_ecole_created_idx
  ON subscription_billing_records (auto_ecole_id, created_at DESC);

COMMENT ON TABLE subscription_billing_records IS 'Historique facturation abonnement (enregistré à l''activation admin)';
