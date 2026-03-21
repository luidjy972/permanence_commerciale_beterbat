-- Migration v6: Application Specifications
-- Table to store app specifications created via the AI assistant guided workflow.
-- These specs serve as blueprints for an external AI agent to implement new applications.

CREATE TABLE IF NOT EXISTS app_specifications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'implemented')),
  spec_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_specifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage app_specifications"
  ON app_specifications FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow service role full access (for API key access)
CREATE POLICY "Service role full access on app_specifications"
  ON app_specifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
