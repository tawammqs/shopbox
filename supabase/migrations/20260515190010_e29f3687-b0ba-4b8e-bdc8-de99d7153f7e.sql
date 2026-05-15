
-- Tabela de auditoria para acessos do superadmin a contas de lojistas
CREATE TABLE public.impersonation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_store_id uuid,
  reason text,
  action text NOT NULL DEFAULT 'magic_link',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_impersonation_log_admin ON public.impersonation_log(admin_user_id, created_at DESC);
CREATE INDEX idx_impersonation_log_target ON public.impersonation_log(target_user_id, created_at DESC);

ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

-- Apenas platform_admin pode ler
CREATE POLICY "Platform admins read impersonation log"
ON public.impersonation_log
FOR SELECT
USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Inserts são feitos exclusivamente via service role (server function), então
-- nenhuma política de INSERT para usuários autenticados/anon — bloqueado por padrão.
