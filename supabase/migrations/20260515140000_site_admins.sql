-- =============================================================================
-- Admin plateforme (propriétaire du site) — à exécuter dans Supabase SQL Editor
-- =============================================================================

CREATE TABLE site_admins (
  id TEXT PRIMARY KEY,
  supabase_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_admins_supabase_user_id ON site_admins(supabase_user_id);

CREATE TRIGGER tr_site_admins_updated_at
  BEFORE UPDATE ON site_admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE site_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_admins_select_self ON site_admins
  FOR SELECT USING (supabase_user_id = auth.uid());
