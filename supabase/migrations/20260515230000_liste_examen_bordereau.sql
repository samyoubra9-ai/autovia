-- Champs bordereau d'envoi (جدول إرسال) sur la liste d'examen
ALTER TABLE listes_examen
  ADD COLUMN IF NOT EXISTS ecole_nom_ar TEXT,
  ADD COLUMN IF NOT EXISTS ecole_adresse TEXT,
  ADD COLUMN IF NOT EXISTS ecole_registre TEXT,
  ADD COLUMN IF NOT EXISTS ecole_telephone TEXT,
  ADD COLUMN IF NOT EXISTS reference_envoi TEXT,
  ADD COLUMN IF NOT EXISTS lieu_redaction TEXT;
