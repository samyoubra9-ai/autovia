-- Accès auto-école : notes admin + fin d'abonnement payant
ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS paid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Nouveaux comptes créés par l'admin : bloqués jusqu'au paiement
ALTER TABLE auto_ecoles
  ALTER COLUMN subscription_status SET DEFAULT 'EXPIRED';
