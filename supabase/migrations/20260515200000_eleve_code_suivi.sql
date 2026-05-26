-- Code de suivi candidat (portail public / QR)

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS code_suivi TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS eleves_code_suivi_key ON eleves(code_suivi)
  WHERE code_suivi IS NOT NULL;

-- Les élèves déjà enregistrés recevront un code via le backdash (Carte / QR)
-- ou à la prochaine création d'élève.
