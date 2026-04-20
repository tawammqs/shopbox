CREATE OR REPLACE FUNCTION public.admin_list_users(_user_ids uuid[])
RETURNS TABLE (id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'platform_admin') THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at
  FROM auth.users u
  WHERE u.id = ANY(_user_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(uuid[]) TO authenticated;