-- Résultats d'examen par candidat sur une liste officielle
DO $$ BEGIN
  CREATE TYPE resultat_examen_candidat AS ENUM (
    'present',
    'absent_j',
    'absent_nj',
    'annule',
    'rejete',
    'ajourne',
    'admis'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE liste_examen_candidats
  DROP COLUMN IF EXISTS resultat;

ALTER TABLE liste_examen_candidats
  ADD COLUMN IF NOT EXISTS resultat resultat_examen_candidat;
