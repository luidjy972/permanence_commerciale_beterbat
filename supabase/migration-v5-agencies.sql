-- ============================================================
-- Migration : Table des agences
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- Idempotent : peut être relancé sans erreur
-- ============================================================

-- ===== Table des agences =====
CREATE TABLE IF NOT EXISTS agencies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===== Activer Row Level Security =====
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- ===== Politique RLS =====
DROP POLICY IF EXISTS "Authenticated full access on agencies" ON agencies;
CREATE POLICY "Authenticated full access on agencies"
  ON agencies FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ===== Données par défaut (issues des commerciaux existants) =====
INSERT INTO agencies (name) VALUES
  ('Fort-de-France'),
  ('Le Lamentin'),
  ('Ducos'),
  ('Le Robert'),
  ('Sainte-Anne'),
  ('Trinité')
ON CONFLICT (name) DO NOTHING;
