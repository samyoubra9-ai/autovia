-- Plan commercial + quota dossiers (override admin)
-- Prisma attend le type "SubscriptionPlan" (PascalCase), pas subscription_plan.
CREATE TYPE "SubscriptionPlan" AS ENUM ('ESSENTIEL', 'PRO', 'ELITE');

ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS subscription_plan "SubscriptionPlan",
  ADD COLUMN IF NOT EXISTS max_eleves_override integer;

COMMENT ON COLUMN auto_ecoles.subscription_plan IS 'Pack commercial : ESSENTIEL, PRO, ELITE (sur mesure)';
COMMENT ON COLUMN auto_ecoles.max_eleves_override IS 'Quota dossiers forcé par admin (null = calcul auto)';
