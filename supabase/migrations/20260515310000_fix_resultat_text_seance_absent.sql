-- Compatibilité resultat (TEXT) + statut absent sur séances
ALTER TABLE liste_examen_candidats
  ALTER COLUMN resultat TYPE TEXT USING resultat::text;

-- Prisma / migrations initiales utilisent le nom "SeanceStatut" (pas seance_statut)
DO $$ BEGIN
  ALTER TYPE "SeanceStatut" ADD VALUE IF NOT EXISTS 'absent';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
