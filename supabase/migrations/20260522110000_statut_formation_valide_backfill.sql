-- Étape 2 : aligner les élèves déjà en circulation validée

UPDATE eleves
SET statut_formation = 'valide'
WHERE etape_circulation_validee = true
  AND statut_formation = 'circulation';
