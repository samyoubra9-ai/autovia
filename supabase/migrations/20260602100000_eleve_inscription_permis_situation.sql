-- Permis déjà obtenu : mairie / autorité de délivrance (un seul champ libre)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS permis_delivre_par TEXT;

-- Nettoyage si une version antérieure de la migration a été appliquée
ALTER TABLE eleves DROP COLUMN IF EXISTS date_inscription;
ALTER TABLE eleves DROP COLUMN IF EXISTS permis_adresse_delivrance;
ALTER TABLE eleves DROP COLUMN IF EXISTS situation_professionnelle_autre;

-- Situation professionnelle : même colonne, texte libre pour « autre »
ALTER TABLE eleves
  ALTER COLUMN situation_professionnelle TYPE TEXT
  USING situation_professionnelle::TEXT;
