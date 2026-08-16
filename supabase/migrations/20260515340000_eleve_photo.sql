-- Photo candidat (chemin Supabase Storage)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- Bucket public pour affichage dans le backdash (écriture via API service role uniquement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'eleves-photos',
  'eleves-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
