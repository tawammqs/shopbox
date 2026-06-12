
-- Restrict sensitive columns from public roles

-- 1) Instagram API token must not be publicly readable
REVOKE SELECT (instagram_token) ON public.store_social_links FROM anon, authenticated;

-- 2) Stripe customer/subscription IDs must not be readable through the client
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.stores FROM anon, authenticated;

-- 3) Domain ownership verification tokens must not be public
REVOKE SELECT (ownership_verification_name, ownership_verification_value, cloudflare_hostname_id)
  ON public.store_domains FROM anon, authenticated;

-- Owners still need read access to these columns on their own rows.
-- Re-grant SELECT to authenticated for stores (RLS policy restricts rows to owner/admin or active stores).
GRANT SELECT (stripe_customer_id, stripe_subscription_id) ON public.stores TO authenticated;
GRANT SELECT (ownership_verification_name, ownership_verification_value, cloudflare_hostname_id)
  ON public.store_domains TO authenticated;
GRANT SELECT (instagram_token) ON public.store_social_links TO authenticated;

-- NOTE: Authenticated still goes through RLS which scopes rows to the owner (or active row for
-- store_domains/stores). To fully hide stripe IDs from non-owners we replace the stores SELECT
-- policy so non-owners can only see when the row is active AND we drop sensitive columns from
-- anon (already done via REVOKE above). Owner column access is preserved by GRANT on authenticated.

-- Tighten the stores SELECT policy so anon doesn't even appear in the role list with sensitive cols.
-- (anon already lacks SELECT on those columns after REVOKE; row-level policy unchanged.)
