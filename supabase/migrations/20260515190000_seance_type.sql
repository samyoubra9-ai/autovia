-- Type de séance : code, créneau, circulation, examen

DO $$ BEGIN
  CREATE TYPE "SeanceType" AS ENUM ('code', 'creneau', 'circulation', 'examen');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE seances_examen
  ADD COLUMN IF NOT EXISTS type "SeanceType" NOT NULL DEFAULT 'code';
