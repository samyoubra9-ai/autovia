-- Confirmation candidat (séance / examen) — accepter, refuser + motif

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

CREATE TABLE candidat_engagements (
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

CREATE INDEX candidat_engagements_eleve_id_idx ON candidat_engagements (eleve_id);
CREATE INDEX candidat_engagements_auto_ecole_id_idx ON candidat_engagements (auto_ecole_id);
