-- Web Push backdash (personnel auto-école) — même VAPID que candidat
-- Exécuter dans Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS backdash_push_subscriptions (
  id            TEXT NOT NULL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  auto_ecole_id TEXT NOT NULL,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT backdash_push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT backdash_push_subscriptions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT backdash_push_subscriptions_auto_ecole_id_fkey
    FOREIGN KEY (auto_ecole_id) REFERENCES auto_ecoles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS backdash_push_subscriptions_user_id_idx
  ON backdash_push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS backdash_push_subscriptions_auto_ecole_id_idx
  ON backdash_push_subscriptions (auto_ecole_id);
