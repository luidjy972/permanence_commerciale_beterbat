-- ============================================================
-- REPAIR : Corriger les utilisateurs créés avec l'ancienne
-- fonction create_app_user (colonnes manquantes dans auth.users)
--
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- Étape 1 : Supprimer l'utilisateur corrompu de auth + app_users
-- (l'utilisateur sera recréé proprement à l'étape 2)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lg.barty@gmail.com';

  IF v_user_id IS NOT NULL THEN
    -- Nettoyage complet
    DELETE FROM auth.mfa_challenges
      WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = v_user_id);
    DELETE FROM auth.mfa_factors WHERE user_id = v_user_id;
    DELETE FROM auth.refresh_tokens WHERE session_id IN
      (SELECT id FROM auth.sessions WHERE user_id = v_user_id);
    DELETE FROM auth.sessions WHERE user_id = v_user_id;
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    DELETE FROM app_users WHERE auth_id = v_user_id;

    RAISE NOTICE 'Utilisateur % supprimé.', v_user_id;
  ELSE
    RAISE NOTICE 'Aucun utilisateur trouvé avec cet email.';
  END IF;
END;
$$;

-- Étape 2 : Recréer l'utilisateur proprement
-- IMPORTANT : Changez le mot de passe ci-dessous !
SELECT create_app_user(
  'lg.barty@gmail.com',
  'ChangezCeMotDePasse123!',
  'Admin',
  'admin'
);
