-- À exécuter sur Supabase PRODUCTION (SQL Editor) si le moniteur principal
-- n’affiche qu’une seule catégorie en prod alors que le local fonctionne.
-- Idempotent : peut être relancé sans risque.

ALTER TABLE moniteurs
  ADD COLUMN IF NOT EXISTS est_principal BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS moniteur_categories_permis (
  moniteur_id TEXT NOT NULL REFERENCES moniteurs(id) ON DELETE CASCADE,
  categorie_permis_id TEXT NOT NULL REFERENCES categories_permis(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (moniteur_id, categorie_permis_id)
);

CREATE INDEX IF NOT EXISTS idx_moniteur_categories_permis_cat
  ON moniteur_categories_permis(categorie_permis_id);

CREATE UNIQUE INDEX IF NOT EXISTS moniteurs_one_principal_per_auto_ecole
  ON moniteurs (auto_ecole_id)
  WHERE est_principal = true;

INSERT INTO moniteur_categories_permis (moniteur_id, categorie_permis_id)
SELECT id, categorie_permis_id
FROM moniteurs
WHERE categorie_permis_id IS NOT NULL
ON CONFLICT (moniteur_id, categorie_permis_id) DO NOTHING;

-- Vérification (doit retourner au moins 1 ligne si des moniteurs existent) :
-- SELECT COUNT(*) FROM moniteur_categories_permis;
