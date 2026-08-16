-- Moniteurs : numéro de carte + date de fin de contrat (alerte J-15 dans le backdash)
-- À exécuter dans Supabase SQL Editor (ou psql) avant déploiement API.

ALTER TABLE moniteurs
  ADD COLUMN IF NOT EXISTS numero_carte_moniteur TEXT,
  ADD COLUMN IF NOT EXISTS date_fin_contrat DATE;

COMMENT ON COLUMN moniteurs.numero_carte_moniteur IS 'Numéro de la carte professionnelle moniteur';
COMMENT ON COLUMN moniteurs.date_fin_contrat IS 'Date de fin du contrat — notification à 15 jours';
