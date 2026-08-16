-- À exécuter dans Supabase SQL Editor (inscription candidat en ligne)
-- Fichier miroir : supabase/migrations/20260617100000_eleve_statut_inscription.sql

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
