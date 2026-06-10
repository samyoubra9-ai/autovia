-- Contenu apprentissage (modules + leçons) — tables vides
-- À exécuter dans Supabase → SQL Editor avant d'utiliser /admin/apprentissage
--
-- Pas de données pré-remplies : créez modules et leçons depuis l'admin Next.js.
--
-- Images : placer les fichiers dans public/ (ex. public/panneaux/A1a.svg)
-- Formats recommandés : SVG, WebP, JPEG — éviter les PNG > 500 Ko

CREATE TABLE IF NOT EXISTS learning_modules (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  step              INTEGER NOT NULL,
  title_fr          TEXT NOT NULL,
  title_kab         TEXT,
  subtitle_fr       TEXT,
  subtitle_kab      TEXT,
  description_fr    TEXT,
  description_kab   TEXT,
  unlock_after_slug TEXT,
  published         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_chapters (
  id           TEXT PRIMARY KEY,
  module_id    TEXT NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL,
  title_fr     TEXT NOT NULL,
  title_kab    TEXT,
  summary_fr   TEXT,
  summary_kab  TEXT,
  body_fr      TEXT,
  body_kab     TEXT,
  images_json  JSONB NOT NULL DEFAULT '[]'::jsonb,
  published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, slug)
);

CREATE INDEX IF NOT EXISTS learning_chapters_module_sort_idx
  ON learning_chapters (module_id, sort_order);
