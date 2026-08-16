-- Chaque catégorie de permis = section indépendante sur la liste d'examen (places configurables)

-- Règles globales listes d'examen sur auto_ecoles
ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS liste_age_min_circulation INT NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS liste_nature_code_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS liste_nature_creneau_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS liste_nature_circulation_active BOOLEAN NOT NULL DEFAULT true;

-- Catégories : places + présence sur liste (remplace groupe_liste)
ALTER TABLE categories_permis
  ADD COLUMN IF NOT EXISTS places_liste INT,
  ADD COLUMN IF NOT EXISTS sur_liste_examen BOOLEAN NOT NULL DEFAULT true;

UPDATE categories_permis
SET places_liste = CASE
  WHEN groupe_liste::text = 'B' THEN 15
  ELSE 10
END
WHERE places_liste IS NULL;

ALTER TABLE categories_permis
  ALTER COLUMN places_liste SET NOT NULL,
  ALTER COLUMN places_liste SET DEFAULT 10;

-- Candidats liste : FK catégorie au lieu de groupe B/A
ALTER TABLE liste_examen_candidats
  ADD COLUMN IF NOT EXISTS categorie_permis_id TEXT;

UPDATE liste_examen_candidats lec
SET categorie_permis_id = e.categorie_permis_id
FROM eleves e
WHERE lec.eleve_id = e.id AND lec.categorie_permis_id IS NULL;

-- Secours : mapper ancien groupe_permis vers catégorie code B ou A
UPDATE liste_examen_candidats lec
SET categorie_permis_id = cp.id
FROM listes_examen le, eleves e, categories_permis cp
WHERE lec.liste_examen_id = le.id
  AND lec.eleve_id = e.id
  AND cp.auto_ecole_id = le.auto_ecole_id
  AND lec.categorie_permis_id IS NULL
  AND cp.code = CASE WHEN lec.groupe_permis::text = 'A' THEN 'A' ELSE 'B' END;

ALTER TABLE liste_examen_candidats DROP CONSTRAINT IF EXISTS liste_examen_candidats_liste_examen_id_groupe_permis_ordre_key;
ALTER TABLE liste_examen_candidats DROP CONSTRAINT IF EXISTS liste_examen_candidats_liste_examen_id_groupe_permis_ordre_key1;

ALTER TABLE liste_examen_candidats DROP CONSTRAINT IF EXISTS liste_examen_candidats_categorie_permis_id_fkey;
ALTER TABLE liste_examen_candidats
  ADD CONSTRAINT liste_examen_candidats_categorie_permis_id_fkey
  FOREIGN KEY (categorie_permis_id) REFERENCES categories_permis(id) ON DELETE RESTRICT;

ALTER TABLE liste_examen_candidats ALTER COLUMN categorie_permis_id SET NOT NULL;
ALTER TABLE liste_examen_candidats DROP COLUMN IF EXISTS groupe_permis;

CREATE UNIQUE INDEX IF NOT EXISTS liste_examen_candidats_liste_cat_ordre_key
  ON liste_examen_candidats(liste_examen_id, categorie_permis_id, ordre);

-- Moniteurs : FK catégorie
ALTER TABLE moniteurs ADD COLUMN IF NOT EXISTS categorie_permis_id TEXT;

UPDATE moniteurs m
SET categorie_permis_id = cp.id
FROM categories_permis cp
WHERE m.auto_ecole_id = cp.auto_ecole_id
  AND m.categorie_permis_id IS NULL
  AND cp.code = CASE WHEN m.categorie_permis::text = 'A' THEN 'A' ELSE 'B' END;

ALTER TABLE moniteurs DROP CONSTRAINT IF EXISTS moniteurs_categorie_permis_id_fkey;
ALTER TABLE moniteurs
  ADD CONSTRAINT moniteurs_categorie_permis_id_fkey
  FOREIGN KEY (categorie_permis_id) REFERENCES categories_permis(id) ON DELETE SET NULL;

ALTER TABLE moniteurs DROP COLUMN IF EXISTS categorie_permis;

-- Retirer groupe_liste des catégories
ALTER TABLE categories_permis DROP COLUMN IF EXISTS groupe_liste;
