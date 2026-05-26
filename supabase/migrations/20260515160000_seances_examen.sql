-- Séances d'examen (planning permis) — exécuter dans Supabase SQL Editor si la table n'existe pas encore

CREATE TABLE IF NOT EXISTS seances_examen (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  date_heure TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seances_examen_auto_ecole_id ON seances_examen(auto_ecole_id);
CREATE INDEX IF NOT EXISTS idx_seances_examen_auto_ecole_date ON seances_examen(auto_ecole_id, date_heure);
