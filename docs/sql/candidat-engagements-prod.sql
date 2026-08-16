-- Production : confirmation candidat (séance / examen)
-- Exécuter dans Supabase SQL Editor (réexécutable sans erreur).

DO $$ BEGIN
  CREATE TYPE candidat_engagement_type AS ENUM ('seance', 'examen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE candidat_engagement_statut AS ENUM ('en_attente', 'accepte', 'refuse');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS candidat_engagements (
  id              TEXT PRIMARY KEY,
  auto_ecole_id   TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  eleve_id        TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  type            candidat_engagement_type NOT NULL,
  reference_id    TEXT NOT NULL,
  statut          candidat_engagement_statut NOT NULL DEFAULT 'en_attente',
  motif           TEXT,
  repondu_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, reference_id)
);

CREATE INDEX IF NOT EXISTS candidat_engagements_eleve_id_idx ON candidat_engagements (eleve_id);
CREATE INDEX IF NOT EXISTS candidat_engagements_auto_ecole_id_idx ON candidat_engagements (auto_ecole_id);

-- Vérification (doit retourner 1 ligne) :
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name = 'candidat_engagements'
-- ) AS table_ok;
