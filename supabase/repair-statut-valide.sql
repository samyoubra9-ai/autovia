-- Réparation manuelle (Supabase SQL Editor)
-- Exécutez CHAQUE bloc séparément : Run → attendre succès → bloc suivant.

-- ── 0) Vérifier les valeurs actuelles de l'enum ──
SELECT e.enumlabel AS valeur
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname = 'StatutFormation'
ORDER BY e.enumsortorder;

-- ── 1) Ajouter « valide » (OBLIGATOIRE avant l'UPDATE) ──
-- Si erreur « already exists », passez directement au bloc 2.
ALTER TYPE "StatutFormation" ADD VALUE 'valide';

-- ── 2) Mettre à jour les élèves (nouvelle requête / nouveau Run) ──
UPDATE eleves
SET statut_formation = 'valide'
WHERE etape_circulation_validee = true
  AND statut_formation = 'circulation';
