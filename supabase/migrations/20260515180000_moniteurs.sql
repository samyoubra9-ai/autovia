-- Table moniteurs (si elle n'existe pas encore)
-- Exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS moniteurs (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moniteurs_auto_ecole_id ON moniteurs(auto_ecole_id);
