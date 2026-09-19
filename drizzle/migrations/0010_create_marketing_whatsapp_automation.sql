CREATE TABLE public.marketing_whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  phone_number text,
  session_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at timestamptz,
  last_activity timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX marketing_whatsapp_connections_store_idx ON public.marketing_whatsapp_connections(store_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_whatsapp_connections TO authenticated;
GRANT ALL ON public.marketing_whatsapp_connections TO service_role;
ALTER TABLE public.marketing_whatsapp_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage whatsapp connections" ON public.marketing_whatsapp_connections
  FOR ALL TO authenticated USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));

CREATE TABLE public.marketing_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  group_jid text NOT NULL,
  group_name text NOT NULL,
  group_members_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX marketing_groups_store_jid_idx ON public.marketing_groups(store_id, group_jid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_groups TO authenticated;
GRANT ALL ON public.marketing_groups TO service_role;
ALTER TABLE public.marketing_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage marketing groups" ON public.marketing_groups
  FOR ALL TO authenticated USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));

CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  group_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_campaigns_status_check CHECK (status IN ('draft','scheduled','sent','failed'))
);
CREATE INDEX marketing_campaigns_store_created_idx ON public.marketing_campaigns(store_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage marketing campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));