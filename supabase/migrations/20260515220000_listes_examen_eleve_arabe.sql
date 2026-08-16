-- Élève : dossier officiel + identité arabe (impression)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS numero_dossier TEXT,
  ADD COLUMN IF NOT EXISTS nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS prenom_ar TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_eleves_auto_ecole_numero_dossier
  ON eleves (auto_ecole_id, numero_dossier)
  WHERE numero_dossier IS NOT NULL;

-- Listes d'examen officielles
CREATE TYPE "ListeExamenStatut" AS ENUM ('brouillon', 'validee');
CREATE TYPE "NatureExamenListe" AS ENUM ('code', 'creneau', 'circulation');
CREATE TYPE "GroupePermisListe" AS ENUM ('B', 'A');

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

CREATE INDEX IF NOT EXISTS idx_listes_examen_auto_ecole ON listes_examen(auto_ecole_id);
CREATE INDEX IF NOT EXISTS idx_listes_examen_date ON listes_examen(auto_ecole_id, date_examen);
CREATE INDEX IF NOT EXISTS idx_liste_examen_candidats_liste ON liste_examen_candidats(liste_examen_id);

CREATE TRIGGER tr_listes_examen_updated_at
  BEFORE UPDATE ON listes_examen
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
