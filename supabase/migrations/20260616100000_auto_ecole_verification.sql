-- Vérification documents auto-école (agrément + pièce d'identité)

CREATE TYPE "VerificationStatus" AS ENUM (
  'PENDING_DOCUMENTS',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "VerificationDocumentKind" AS ENUM ('AGREMENT', 'IDENTITE');

ALTER TABLE auto_ecoles
  ADD COLUMN IF NOT EXISTS verification_status "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_documents_purged_at TIMESTAMPTZ;

-- Comptes existants : déjà actifs, pas de re-vérification
UPDATE auto_ecoles SET verification_status = 'APPROVED' WHERE verification_status IS NULL;

CREATE TABLE IF NOT EXISTS auto_ecole_verification_documents (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  kind "VerificationDocumentKind" NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (auto_ecole_id, kind)
);

CREATE INDEX IF NOT EXISTS auto_ecole_verification_documents_auto_ecole_id_idx
  ON auto_ecole_verification_documents (auto_ecole_id);

-- Bucket privé — lecture via URL signée (API service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'auto-ecole-verification',
  'auto-ecole-verification',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
