-- Plan Essentiel Connect (back-office + inscription en ligne)
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'ESSENTIEL_CONNECT';

COMMENT ON COLUMN auto_ecoles.subscription_plan IS 'Pack commercial : ESSENTIEL, ESSENTIEL_CONNECT, PRO, ELITE (sur mesure)';
