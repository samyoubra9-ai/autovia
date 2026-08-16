-- Moniteur : identité arabe (optionnel) + catégorie A / B pour listes d'examen
ALTER TABLE moniteurs
  ADD COLUMN IF NOT EXISTS nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS prenom_ar TEXT,
  ADD COLUMN IF NOT EXISTS categorie_permis "GroupePermisListe" NOT NULL DEFAULT 'B';
