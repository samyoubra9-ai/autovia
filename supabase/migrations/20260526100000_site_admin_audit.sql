-- Journal des actions administrateur plateforme
CREATE TABLE IF NOT EXISTS site_admin_audit_logs (
  id TEXT PRIMARY KEY,
  site_admin_id TEXT REFERENCES site_admins(id) ON DELETE SET NULL,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_admin_audit_logs_ae_created_idx
  ON site_admin_audit_logs (auto_ecole_id, created_at DESC);
