-- =============================================================================
-- DriveSaaS — Schéma complet (aligné sur prisma/schema.prisma)
-- Supabase : SQL Editor → New query → coller tout → Run
-- Base vide uniquement. Ne pas exécuter si Prisma migrate a déjà créé les tables.
-- =============================================================================

-- 1) Types ENUM
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'CASHIER');
CREATE TYPE "Sexe" AS ENUM ('masculin', 'feminin');
CREATE TYPE "GroupeSanguin" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE "CategoriePermis" AS ENUM ('A', 'A1', 'B');
CREATE TYPE "StatutFormation" AS ENUM ('code', 'creneau', 'circulation');
CREATE TYPE "SituationFamiliale" AS ENUM ('celibataire', 'marie', 'divorce', 'veuf');
CREATE TYPE "SituationProfessionnelle" AS ENUM ('etudiant', 'employe', 'sans_emploi', 'fonctionnaire', 'commercant', 'autre');
CREATE TYPE "VehicleType" AS ENUM ('voiture', 'moto', 'bus', 'camion');

-- 2) Table auto_ecoles (tenant SaaS + essai 15 jours)
CREATE TABLE auto_ecoles (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ville TEXT,
  telephone TEXT,
  email_contact TEXT,
  subscription_status "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  trial_ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auto_ecoles_slug ON auto_ecoles(slug);
CREATE INDEX idx_auto_ecoles_trial_ends ON auto_ecoles(trial_ends_at);

-- 3) Table users (profil admin, lié à auth.users)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  supabase_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  role "UserRole" NOT NULL DEFAULT 'OWNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_auto_ecole_id ON users(auto_ecole_id);
CREATE INDEX idx_users_supabase_user_id ON users(supabase_user_id);

-- 4) Table eleves
CREATE TABLE eleves (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  identifiant TEXT NOT NULL,
  telephone TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nin TEXT NOT NULL,
  date_naissance TIMESTAMPTZ NOT NULL,
  lieu_naissance TEXT NOT NULL,
  sexe "Sexe" NOT NULL,
  groupe_sanguin "GroupeSanguin" NOT NULL,
  categorie_permis "CategoriePermis" NOT NULL,
  statut_formation "StatutFormation" NOT NULL,
  mairie_enregistrement TEXT,
  nationalite TEXT NOT NULL,
  prenom_pere TEXT,
  nom_mere TEXT,
  prenom_mere TEXT,
  situation_familiale "SituationFamiliale" NOT NULL,
  situation_professionnelle "SituationProfessionnelle" NOT NULL,
  prix_permis INTEGER NOT NULL DEFAULT 25000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eleves_auto_ecole_id_identifiant_key UNIQUE (auto_ecole_id, identifiant)
);

CREATE INDEX idx_eleves_auto_ecole_id ON eleves(auto_ecole_id);

-- 5) Table moniteurs
CREATE TABLE moniteurs (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moniteurs_auto_ecole_id ON moniteurs(auto_ecole_id);

-- 6) Table vehicules
CREATE TABLE vehicules (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  type "VehicleType" NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  matricule TEXT,
  assurance_expiration TIMESTAMPTZ,
  controle_technique_expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicules_auto_ecole_id ON vehicules(auto_ecole_id);

-- 7) Table paiements
CREATE TABLE paiements (
  id TEXT PRIMARY KEY,
  auto_ecole_id TEXT NOT NULL REFERENCES auto_ecoles(id) ON DELETE CASCADE,
  eleve_id TEXT NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  moniteur_id TEXT REFERENCES moniteurs(id) ON DELETE SET NULL,
  montant INTEGER NOT NULL,
  moniteur_nom TEXT NOT NULL,
  enregistre_par_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_paiements_auto_ecole_id ON paiements(auto_ecole_id);
CREATE INDEX idx_paiements_eleve_id ON paiements(eleve_id);

-- 8) Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_auto_ecoles_updated_at
  BEFORE UPDATE ON auto_ecoles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_eleves_updated_at
  BEFORE UPDATE ON eleves
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_moniteurs_updated_at
  BEFORE UPDATE ON moniteurs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_vehicules_updated_at
  BEFORE UPDATE ON vehicules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9) Row Level Security (multi-tenant)
ALTER TABLE auto_ecoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE moniteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_auto_ecole_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auto_ecole_id::text
  FROM users
  WHERE supabase_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE POLICY auto_ecoles_select_own ON auto_ecoles
  FOR SELECT USING (id = public.current_auto_ecole_id());

CREATE POLICY users_select_own_tenant ON users
  FOR SELECT USING (auto_ecole_id = public.current_auto_ecole_id());

CREATE POLICY users_update_self ON users
  FOR UPDATE USING (supabase_user_id = auth.uid());

CREATE POLICY eleves_tenant_isolation ON eleves
  FOR ALL USING (auto_ecole_id = public.current_auto_ecole_id())
  WITH CHECK (auto_ecole_id = public.current_auto_ecole_id());

CREATE POLICY moniteurs_tenant_isolation ON moniteurs
  FOR ALL USING (auto_ecole_id = public.current_auto_ecole_id())
  WITH CHECK (auto_ecole_id = public.current_auto_ecole_id());

CREATE POLICY vehicules_tenant_isolation ON vehicules
  FOR ALL USING (auto_ecole_id = public.current_auto_ecole_id())
  WITH CHECK (auto_ecole_id = public.current_auto_ecole_id());

CREATE POLICY paiements_tenant_isolation ON paiements
  FOR ALL USING (auto_ecole_id = public.current_auto_ecole_id())
  WITH CHECK (auto_ecole_id = public.current_auto_ecole_id());

