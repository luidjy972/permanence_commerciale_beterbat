-- ============================================================
-- Migration v4 : Clés API pour accès externe (agents IA, etc.)
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- Idempotent : peut être relancé sans erreur
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  created_by TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash);

-- ===== RLS =====
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access on api_keys" ON api_keys;
CREATE POLICY "Authenticated full access on api_keys"
  ON api_keys FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
