-- Réparation idempotente : colonnes attendues par Prisma (à exécuter si erreur P2022 / colonne manquante)
-- Safe à relancer plusieurs fois.

-- 1) Intelligence / séances (type déjà présent = ignoré)
DO $$ BEGIN
  CREATE TYPE "SeanceStatut" AS ENUM ('planifie', 'passe', 'annule');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS etape_code_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_creneau_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_circulation_validee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS etape_examen_validee BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE seances_examen
  ADD COLUMN IF NOT EXISTS statut "SeanceStatut" NOT NULL DEFAULT 'planifie',
  ADD COLUMN IF NOT EXISTS moniteur_id TEXT REFERENCES moniteurs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicule_id TEXT REFERENCES vehicules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seances_examen_vehicule_date ON seances_examen(vehicule_id, date_heure);

-- 2) Paramètres listes d'examen (auto_ecoles)
ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS liste_age_min_circulation INT NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS liste_nature_code_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS liste_nature_creneau_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS liste_nature_circulation_active BOOLEAN NOT NULL DEFAULT true;

-- 3) Catégories permis : places liste (si table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'categories_permis'
  ) THEN
    ALTER TABLE categories_permis
      ADD COLUMN IF NOT EXISTS places_liste INT,
      ADD COLUMN IF NOT EXISTS sur_liste_examen BOOLEAN NOT NULL DEFAULT true;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'categories_permis' AND column_name = 'groupe_liste'
    ) THEN
      UPDATE categories_permis
      SET places_liste = CASE
        WHEN groupe_liste::text = 'B' THEN 15
        ELSE 10
      END
      WHERE places_liste IS NULL;
    ELSE
      UPDATE categories_permis
      SET places_liste = CASE
        WHEN code = 'B' THEN 15
        ELSE 10
      END
      WHERE places_liste IS NULL;
    END IF;

    UPDATE categories_permis SET places_liste = 10 WHERE places_liste IS NULL;

    ALTER TABLE categories_permis
      ALTER COLUMN places_liste SET DEFAULT 10;

    BEGIN
      ALTER TABLE categories_permis ALTER COLUMN places_liste SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- 4) Liste examen candidats : categorie_permis_id (si tables existent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'liste_examen_candidats'
  ) THEN
    ALTER TABLE liste_examen_candidats
      ADD COLUMN IF NOT EXISTS categorie_permis_id TEXT;

    UPDATE liste_examen_candidats lec
    SET categorie_permis_id = e.categorie_permis_id
    FROM eleves e
    WHERE lec.eleve_id = e.id AND lec.categorie_permis_id IS NULL;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'liste_examen_candidats' AND column_name = 'groupe_permis'
    ) THEN
      UPDATE liste_examen_candidats lec
      SET categorie_permis_id = cp.id
      FROM listes_examen le, categories_permis cp
      WHERE lec.liste_examen_id = le.id
        AND lec.categorie_permis_id IS NULL
        AND cp.auto_ecole_id = le.auto_ecole_id
        AND cp.code = CASE WHEN lec.groupe_permis::text = 'A' THEN 'A' ELSE 'B' END;
    END IF;

    ALTER TABLE liste_examen_candidats DROP CONSTRAINT IF EXISTS liste_examen_candidats_categorie_permis_id_fkey;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories_permis') THEN
      ALTER TABLE liste_examen_candidats
        ADD CONSTRAINT liste_examen_candidats_categorie_permis_id_fkey
        FOREIGN KEY (categorie_permis_id) REFERENCES categories_permis(id) ON DELETE RESTRICT;
    END IF;

    CREATE UNIQUE INDEX IF NOT EXISTS liste_examen_candidats_liste_cat_ordre_key
      ON liste_examen_candidats(liste_examen_id, categorie_permis_id, ordre)
      WHERE categorie_permis_id IS NOT NULL;

    ALTER TABLE liste_examen_candidats DROP COLUMN IF EXISTS groupe_permis;
  END IF;
END $$;

-- 5) Moniteurs : categorie_permis_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'moniteurs'
  ) THEN
    ALTER TABLE moniteurs ADD COLUMN IF NOT EXISTS categorie_permis_id TEXT;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'moniteurs' AND column_name = 'categorie_permis'
    ) THEN
      UPDATE moniteurs m
      SET categorie_permis_id = cp.id
      FROM categories_permis cp
      WHERE m.auto_ecole_id = cp.auto_ecole_id
        AND m.categorie_permis_id IS NULL
        AND cp.code = CASE WHEN m.categorie_permis::text = 'A' THEN 'A' ELSE 'B' END;
    END IF;

    ALTER TABLE moniteurs DROP CONSTRAINT IF EXISTS moniteurs_categorie_permis_id_fkey;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories_permis') THEN
      ALTER TABLE moniteurs
        ADD CONSTRAINT moniteurs_categorie_permis_id_fkey
        FOREIGN KEY (categorie_permis_id) REFERENCES categories_permis(id) ON DELETE SET NULL;
    END IF;

    ALTER TABLE moniteurs DROP COLUMN IF EXISTS categorie_permis;
  END IF;
END $$;

ALTER TABLE categories_permis DROP COLUMN IF EXISTS groupe_liste;

-- 5) Tarif forfait permis par catégorie
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'categories_permis'
  ) THEN
    ALTER TABLE categories_permis
      ADD COLUMN IF NOT EXISTS prix_permis INT NOT NULL DEFAULT 25000;

    UPDATE categories_permis SET prix_permis = 25000 WHERE prix_permis IS NULL;
  END IF;
END $$;

-- 6) Nom de jeune fille (élèves)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS nom_jeune_fille TEXT;

-- 7) Permis déjà obtenu (élèves)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS permis_deja_obtenu BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS numero_permis_obtenu TEXT,
  ADD COLUMN IF NOT EXISTS date_permis_obtenu DATE,
  ADD COLUMN IF NOT EXISTS categories_permis_obtenues TEXT[] NOT NULL DEFAULT '{}';
