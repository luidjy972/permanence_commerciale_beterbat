-- ============================================================
-- Migration : Ajout des champs commerciaux
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- Idempotent : peut être relancé sans erreur
-- ============================================================

-- Ajouter les nouveaux champs à la table commercials
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercials' AND column_name = 'phone') THEN
    ALTER TABLE commercials ADD COLUMN phone TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercials' AND column_name = 'email') THEN
    ALTER TABLE commercials ADD COLUMN email TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercials' AND column_name = 'is_active_in_planning') THEN
    ALTER TABLE commercials ADD COLUMN is_active_in_planning BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercials' AND column_name = 'is_prospect') THEN
    ALTER TABLE commercials ADD COLUMN is_prospect BOOLEAN NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commercials' AND column_name = 'notes') THEN
    ALTER TABLE commercials ADD COLUMN notes TEXT DEFAULT '';
  END IF;
END;
$$;
