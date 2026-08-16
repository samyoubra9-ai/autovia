-- Catégories de permis personnalisées par auto-école (FR + AR)
CREATE TABLE IF NOT EXISTS categories_permis (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  libelle_fr TEXT NOT NULL,
  libelle_ar TEXT,
  groupe_liste "GroupePermisListe" NOT NULL DEFAULT 'B',
  ordre INT NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (auto_ecole_id, code)
);

CREATE INDEX IF NOT EXISTS idx_categories_permis_auto_ecole ON categories_permis(auto_ecole_id);

-- Colonne FK sur élèves
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS categorie_permis_id TEXT;

-- Seed + migration depuis l'ancien enum "CategoriePermis" (si présent)
DO $$
DECLARE
  ae RECORD;
  cat_b TEXT;
  cat_a TEXT;
  cat_a1 TEXT;
BEGIN
  FOR ae IN SELECT id FROM auto_ecoles LOOP
  INSERT INTO categories_permis (id, auto_ecole_id, code, libelle_fr, libelle_ar, groupe_liste, ordre, actif)
  VALUES
    ('cat_' || ae.id || '_b', ae.id, 'B', 'Catégorie B', 'صنف ب', 'B', 1, true),
    ('cat_' || ae.id || '_a', ae.id, 'A', 'Catégorie A', 'صنف أ', 'A', 2, true),
    ('cat_' || ae.id || '_a1', ae.id, 'A1', 'Catégorie A1', 'صنف أ1', 'A', 3, true)
  ON CONFLICT (auto_ecole_id, code) DO NOTHING;

  SELECT id INTO cat_b FROM categories_permis WHERE auto_ecole_id = ae.id AND code = 'B' LIMIT 1;
  SELECT id INTO cat_a FROM categories_permis WHERE auto_ecole_id = ae.id AND code = 'A' LIMIT 1;
  SELECT id INTO cat_a1 FROM categories_permis WHERE auto_ecole_id = ae.id AND code = 'A1' LIMIT 1;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'eleves' AND column_name = 'categorie_permis'
      AND udt_name = 'CategoriePermis'
  ) THEN
    UPDATE eleves SET categorie_permis_id = cat_b
    WHERE auto_ecole_id = ae.id AND categorie_permis::text = 'B' AND categorie_permis_id IS NULL;
    UPDATE eleves SET categorie_permis_id = cat_a
    WHERE auto_ecole_id = ae.id AND categorie_permis::text = 'A' AND categorie_permis_id IS NULL;
    UPDATE eleves SET categorie_permis_id = cat_a1
    WHERE auto_ecole_id = ae.id AND categorie_permis::text = 'A1' AND categorie_permis_id IS NULL;
  END IF;

  UPDATE eleves SET categorie_permis_id = cat_b
  WHERE auto_ecole_id = ae.id AND categorie_permis_id IS NULL;
  END LOOP;
END $$;

ALTER TABLE eleves DROP CONSTRAINT IF EXISTS eleves_categorie_permis_id_fkey;
ALTER TABLE eleves
  ADD CONSTRAINT eleves_categorie_permis_id_fkey
  FOREIGN KEY (categorie_permis_id) REFERENCES categories_permis(id) ON DELETE RESTRICT;

-- Rendre obligatoire puis retirer l'ancienne colonne enum
ALTER TABLE eleves ALTER COLUMN categorie_permis_id SET NOT NULL;

ALTER TABLE eleves DROP COLUMN IF EXISTS categorie_permis;

DROP TRIGGER IF EXISTS tr_categories_permis_updated_at ON categories_permis;
CREATE TRIGGER tr_categories_permis_updated_at
  BEFORE UPDATE ON categories_permis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
