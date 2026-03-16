-- ============================================================
-- Migration : Planning de permanence — Beterbat
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- Extension requise pour le hachage des mots de passe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== Table des commerciaux =====
CREATE TABLE IF NOT EXISTS commercials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  agency TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Table de l'état du planning (singleton, id = 1) =====
CREATE TABLE IF NOT EXISTS planning_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  week_start TEXT,
  planning_weeks INTEGER DEFAULT 12,
  start_index INTEGER DEFAULT 0,
  rotation_mode TEXT DEFAULT 'weekly' CHECK (rotation_mode IN ('weekly', 'monthly')),
  planning_data JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Table des utilisateurs de l'application =====
CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Activer Row Level Security =====
ALTER TABLE commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ===== Politiques RLS : accès pour les utilisateurs authentifiés =====
CREATE POLICY "Authenticated full access on commercials"
  ON commercials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on planning_state"
  ON planning_state FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on app_users"
  ON app_users FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ===== Fonctions de gestion des utilisateurs =====

-- Créer un utilisateur dans auth.users + app_users
CREATE OR REPLACE FUNCTION create_app_user(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'user'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  existing_id UUID;
BEGIN
  -- Vérifier que l'email n'existe pas déjà
  SELECT id INTO existing_id FROM auth.users WHERE email = p_email;
  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un utilisateur avec cet email existe deja.';
  END IF;

  -- Insérer dans auth.users
  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name),
    now(), now(), '', ''
  );

  -- Insérer l'identité email
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), new_user_id, p_email,
    jsonb_build_object('sub', new_user_id::text, 'email', p_email),
    'email', now(), now(), now()
  );

  -- Insérer dans app_users
  INSERT INTO app_users (auth_id, email, name, role)
  VALUES (new_user_id, p_email, p_name, p_role);

  RETURN jsonb_build_object('id', new_user_id, 'email', p_email, 'name', p_name, 'role', p_role);
END;
$$;

-- Mettre à jour le mot de passe d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_password(
  p_auth_id UUID,
  p_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_auth_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable.';
  END IF;
END;
$$;

-- Supprimer un utilisateur (auth.users + app_users)
CREATE OR REPLACE FUNCTION delete_app_user(p_auth_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Empêcher la suppression de son propre compte
  IF p_auth_id = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas supprimer votre propre compte.';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_auth_id;
  DELETE FROM auth.sessions WHERE user_id = p_auth_id;
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = p_auth_id;
  DELETE FROM auth.users WHERE id = p_auth_id;
  DELETE FROM app_users WHERE auth_id = p_auth_id;
END;
$$;

-- Mettre à jour les infos d'un utilisateur (nom, rôle)
CREATE OR REPLACE FUNCTION update_app_user(
  p_auth_id UUID,
  p_name TEXT,
  p_role TEXT DEFAULT 'user'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE app_users
  SET name = p_name, role = p_role
  WHERE auth_id = p_auth_id;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('name', p_name),
      updated_at = now()
  WHERE id = p_auth_id;
END;
$$;

-- ===== Données par défaut =====

-- Commerciaux initiaux
INSERT INTO commercials (name, agency, position) VALUES
  ('Marie-Line COPPET', 'Fort-de-France', 0),
  ('Stéphane LUREL', 'Le Lamentin', 1),
  ('Fabienne MARDAYE', 'Ducos', 2),
  ('Jean-Marc ROSALIE', 'Le Robert', 3),
  ('Nathalie SYMPHOR', 'Sainte-Anne', 4),
  ('Patrick DORLEAN', 'Trinité', 5)
ON CONFLICT DO NOTHING;
