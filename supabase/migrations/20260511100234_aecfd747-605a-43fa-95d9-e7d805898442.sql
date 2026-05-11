-- Add an explicit restrictive policy preventing non-platform-admins from
-- inserting/updating/deleting rows in user_roles. The existing permissive
-- policy "Platform admins manage roles" already grants admins ALL access,
-- but a restrictive policy hardens the WITH CHECK paths for INSERT/UPDATE
-- so a non-admin authenticated user cannot escalate themselves to admin.

CREATE POLICY "Only platform admins can write roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
