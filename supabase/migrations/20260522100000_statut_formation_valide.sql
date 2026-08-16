-- Étape 1 : ajouter la valeur enum (transaction séparée de l'UPDATE suivant)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'StatutFormation'
      AND e.enumlabel = 'valide'
  ) THEN
    ALTER TYPE "StatutFormation" ADD VALUE 'valide';
  END IF;
END $$;
