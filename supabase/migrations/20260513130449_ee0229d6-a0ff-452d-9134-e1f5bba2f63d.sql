-- Default for trial_ends_at + backfill
ALTER TABLE public.stores
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

UPDATE public.stores
SET trial_ends_at = created_at + interval '7 days'
WHERE trial_ends_at IS NULL;

-- Helper to check store access (uses existing owner_user_id + 'trialing' enum)
CREATE OR REPLACE FUNCTION public.store_has_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE owner_user_id = p_user_id
      AND (
        subscription_status IN ('active', 'past_due')
        OR (subscription_status = 'trialing' AND (trial_ends_at IS NULL OR trial_ends_at > now()))
      )
  );
$$;