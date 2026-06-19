-- Inscription candidat en ligne (pré-inscription → validation auto-école)

DO $$ BEGIN
  CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS statut_inscription "StatutInscription" NOT NULL DEFAULT 'VALIDE',
  ADD COLUMN IF NOT EXISTS inscription_refused_reason TEXT,
  ADD COLUMN IF NOT EXISTS inscription_validated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS eleves_auto_ecole_statut_inscription_idx
  ON eleves (auto_ecole_id, statut_inscription);

COMMENT ON COLUMN eleves.statut_inscription IS
  'EN_ATTENTE = demande vitrine non validée ; VALIDE = élève actif ; REFUSE = demande refusée.';
