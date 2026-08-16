-- Tarif forfait permis par catégorie (paramètres auto-école)
ALTER TABLE categories_permis
  ADD COLUMN IF NOT EXISTS prix_permis INT NOT NULL DEFAULT 25000;

UPDATE categories_permis SET prix_permis = 25000 WHERE prix_permis IS NULL;
