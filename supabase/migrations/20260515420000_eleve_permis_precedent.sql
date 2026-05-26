-- Permis déjà obtenu (ajout d'une nouvelle catégorie)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS permis_deja_obtenu BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_permis_obtenu TEXT,
  ADD COLUMN IF NOT EXISTS date_permis_obtenu DATE,
  ADD COLUMN IF NOT EXISTS categories_permis_obtenues TEXT[] NOT NULL DEFAULT '{}';
