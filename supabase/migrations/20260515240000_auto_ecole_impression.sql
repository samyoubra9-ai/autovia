-- Infos auto-école pour impressions (liste examen + bordereau) — une seule fois dans Paramètres
ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS wilaya TEXT,
  ADD COLUMN IF NOT EXISTS nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS adresse_magasin TEXT,
  ADD COLUMN IF NOT EXISTS numero_registre TEXT,
  ADD COLUMN IF NOT EXISTS centre_examen_defaut TEXT,
  ADD COLUMN IF NOT EXISTS lieu_redaction TEXT,
  ADD COLUMN IF NOT EXISTS reference_envoi TEXT;
