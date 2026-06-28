-- Date de dépôt du dossier candidat à la DWSR (optionnel, fiche d'avancement)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS date_depot_dwsr DATE;

COMMENT ON COLUMN eleves.date_depot_dwsr IS 'Date de dépôt du dossier à la DWSR';
