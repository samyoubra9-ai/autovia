-- Exécuter dans Supabase SQL Editor
-- Ajoute l'adresse de domicile sur les candidats (élèves)

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS domicile TEXT;

COMMENT ON COLUMN eleves.domicile IS 'Adresse de domicile du candidat';
