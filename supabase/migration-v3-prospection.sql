-- ============================================================
-- Migration v3 : Prospection — Objectifs, Projets, Activités
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- Idempotent : peut être relancé sans erreur
-- ============================================================

-- ===== Table des objectifs de prospection (singleton, id = 1) =====
CREATE TABLE IF NOT EXISTS prospection_objectives (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_closed_contracts INTEGER DEFAULT 0,
  target_revenue NUMERIC(12,2) DEFAULT 0,
  target_total_contract_price NUMERIC(12,2) DEFAULT 0,
  contract_amount_1 NUMERIC(12,2),
  contract_amount_2 NUMERIC(12,2),
  contract_amount_3 NUMERIC(12,2),
  contract_amount_4 NUMERIC(12,2),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Singleton row
INSERT INTO prospection_objectives (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_prospection_objectives_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prospection_objectives_updated_at ON prospection_objectives;
CREATE TRIGGER trg_prospection_objectives_updated_at
  BEFORE UPDATE ON prospection_objectives
  FOR EACH ROW
  EXECUTE FUNCTION set_prospection_objectives_updated_at();

-- ===== Table des projets de prospection =====
-- status: nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule
CREATE TABLE IF NOT EXISTS prospect_projects (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  description TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nouveau'
    CHECK (status IN ('nouveau', 'contact', 'devis', 'negociation', 'gagne', 'reporte', 'en_attente', 'annule')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  commercial_id BIGINT REFERENCES commercials(id) ON DELETE SET NULL,
  due_date DATE,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospect_projects_status ON prospect_projects (status);
CREATE INDEX IF NOT EXISTS idx_prospect_projects_commercial ON prospect_projects (commercial_id);

-- Trigger updated_at for projects
CREATE OR REPLACE FUNCTION set_prospect_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prospect_projects_updated_at ON prospect_projects;
CREATE TRIGGER trg_prospect_projects_updated_at
  BEFORE UPDATE ON prospect_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_prospect_projects_updated_at();

-- ===== RLS =====
ALTER TABLE prospection_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access on prospection_objectives" ON prospection_objectives;
CREATE POLICY "Authenticated full access on prospection_objectives"
  ON prospection_objectives FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on prospect_projects" ON prospect_projects;
CREATE POLICY "Authenticated full access on prospect_projects"
  ON prospect_projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
