-- Message optionnel aux candidats (séances + listes d'examen par catégorie)

ALTER TABLE seances_examen
  ADD COLUMN IF NOT EXISTS message_candidat TEXT;

COMMENT ON COLUMN seances_examen.message_candidat IS
  'Message optionnel affiché à l''élève dans l''espace candidat (séance planifiée).';

CREATE TABLE IF NOT EXISTS liste_examen_messages_categorie (
  id TEXT PRIMARY KEY,
  liste_examen_id TEXT NOT NULL REFERENCES listes_examen(id) ON DELETE CASCADE,
  categorie_permis_id TEXT NOT NULL REFERENCES categories_permis(id) ON DELETE RESTRICT,
  message TEXT,
  heure_convocation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (liste_examen_id, categorie_permis_id)
);

CREATE INDEX IF NOT EXISTS idx_liste_examen_msg_liste
  ON liste_examen_messages_categorie(liste_examen_id);
