-- Élève : moniteur et véhicule assignés (fiche d'avancement + formulaire)
-- À exécuter dans Supabase SQL Editor avant déploiement API.

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS moniteur_id TEXT,
  ADD COLUMN IF NOT EXISTS vehicule_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eleves_moniteur_id_fkey'
  ) THEN
    ALTER TABLE eleves
      ADD CONSTRAINT eleves_moniteur_id_fkey
      FOREIGN KEY (moniteur_id) REFERENCES moniteurs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'eleves_vehicule_id_fkey'
  ) THEN
    ALTER TABLE eleves
      ADD CONSTRAINT eleves_vehicule_id_fkey
      FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS eleves_moniteur_id_idx ON eleves (moniteur_id);
CREATE INDEX IF NOT EXISTS eleves_vehicule_id_idx ON eleves (vehicule_id);
