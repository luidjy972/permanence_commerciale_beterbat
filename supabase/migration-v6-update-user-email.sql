-- Migration v6: Add email update support to update_app_user

CREATE OR REPLACE FUNCTION update_app_user(
  p_auth_id UUID,
  p_name TEXT,
  p_role TEXT DEFAULT 'user',
  p_email TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
BEGIN
  -- Update name and role in app_users
  UPDATE app_users
  SET name = p_name, role = p_role
  WHERE auth_id = p_auth_id;

  -- Update name in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object('name', p_name),
      updated_at = now()
  WHERE id = p_auth_id;

  -- If email is provided, update it everywhere
  IF p_email IS NOT NULL THEN
    -- Check that the new email is not already taken by another user
    SELECT id INTO existing_id FROM auth.users WHERE email = p_email AND id != p_auth_id;
    IF existing_id IS NOT NULL THEN
      RAISE EXCEPTION 'Un utilisateur avec cet email existe deja.';
    END IF;

    UPDATE app_users SET email = p_email WHERE auth_id = p_auth_id;

    UPDATE auth.users SET email = p_email, updated_at = now() WHERE id = p_auth_id;

    UPDATE auth.identities
    SET identity_data = identity_data || jsonb_build_object('email', p_email),
        updated_at = now()
    WHERE user_id = p_auth_id AND provider = 'email';
  END IF;
END;
$$;
