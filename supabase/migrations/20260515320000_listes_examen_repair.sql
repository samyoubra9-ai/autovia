-- Réparation idempotente : listes d'examen + resultat TEXT (compatible Prisma)
-- Exécutez ce fichier dans Supabase SQL Editor si « Enregistrer la liste » renvoie une erreur 500.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TYPE "ListeExamenStatut" AS ENUM ('brouillon', 'validee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NatureExamenListe" AS ENUM ('code', 'creneau', 'circulation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "GroupePermisListe" AS ENUM ('B', 'A');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS listes_examen (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  centre_examen TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  date_depot DATE NOT NULL,
  date_examen DATE NOT NULL,
  inspecteur_nom TEXT,
  moniteur1_nom TEXT,
  moniteur1_categorie TEXT,
  moniteur2_nom TEXT,
  moniteur2_categorie TEXT,
  statut "ListeExamenStatut" NOT NULL DEFAULT 'brouillon',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE listes_examen
  ADD COLUMN IF NOT EXISTS ecole_nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS ecole_adresse TEXT,
  ADD COLUMN IF NOT EXISTS ecole_registre TEXT,
  ADD COLUMN IF NOT EXISTS ecole_telephone TEXT,
  ADD COLUMN IF NOT EXISTS reference_envoi TEXT,
  ADD COLUMN IF NOT EXISTS lieu_redaction TEXT;

CREATE TABLE IF NOT EXISTS liste_examen_candidats (
  id TEXT PRIMARY KEY,
  liste_examen_id TEXT NOT NULL REFERENCES listes_examen(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  groupe_permis "GroupePermisListe" NOT NULL,
  ordre INT NOT NULL,
  nature_examen "NatureExamenListe" NOT NULL,
  date_dernier_examen DATE,
  resultat TEXT,
  UNIQUE (liste_examen_id, eleve_id),
  UNIQUE (liste_examen_id, groupe_permis, ordre)
);

-- resultat : toujours TEXT (évite conflit Prisma String? vs enum PostgreSQL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'liste_examen_candidats'
      AND column_name = 'resultat'
      AND udt_name <> 'text'
  ) THEN
    ALTER TABLE liste_examen_candidats
      ALTER COLUMN resultat TYPE TEXT USING resultat::text;
  END IF;
END $$;

ALTER TABLE liste_examen_candidats
  ADD COLUMN IF NOT EXISTS resultat TEXT;

DROP TYPE IF EXISTS resultat_examen_candidat;

CREATE INDEX IF NOT EXISTS idx_listes_examen_auto_ecole ON listes_examen(auto_ecole_id);
CREATE INDEX IF NOT EXISTS idx_listes_examen_date ON listes_examen(auto_ecole_id, date_examen);
CREATE INDEX IF NOT EXISTS idx_liste_examen_candidats_liste ON liste_examen_candidats(liste_examen_id);

DROP TRIGGER IF EXISTS tr_listes_examen_updated_at ON listes_examen;
CREATE TRIGGER tr_listes_examen_updated_at
  BEFORE UPDATE ON listes_examen
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Séances : statut « absent » (type créé dans 20260515170000_intelligence_features.sql)
DO $$ BEGIN
  ALTER TYPE "SeanceStatut" ADD VALUE IF NOT EXISTS 'absent';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Moniteurs (listes d'examen : sélection par catégorie A/B)
ALTER TABLE moniteurs
  ADD COLUMN IF NOT EXISTS nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS prenom_ar TEXT,
  ADD COLUMN IF NOT EXISTS categorie_permis "GroupePermisListe" NOT NULL DEFAULT 'B';
