-- Fonctionnalités intelligentes : parcours élève, séances enrichies (idempotent)

DO $$ BEGIN
  CREATE TYPE "SeanceStatut" AS ENUM ('planifie', 'passe', 'annule');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS etape_code_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_creneau_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_circulation_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_examen_validee BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE seances_examen
  ADD COLUMN IF NOT EXISTS statut "SeanceStatut" NOT NULL DEFAULT 'planifie',
  ADD COLUMN IF NOT EXISTS moniteur_id TEXT REFERENCES moniteurs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicule_id TEXT REFERENCES vehicules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seances_examen_vehicule_date ON seances_examen(vehicule_id, date_heure);
