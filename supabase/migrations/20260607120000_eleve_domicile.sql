-- Adresse de domicile du candidat (élève)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS domicile TEXT;

COMMENT ON COLUMN eleves.domicile IS 'Adresse de domicile du candidat';
