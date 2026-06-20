
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS login_whatsapp text;

-- Backfill: usa o whatsapp atual como número de login para todas as lojas existentes
UPDATE public.stores
SET login_whatsapp = whatsapp
WHERE login_whatsapp IS NULL;

-- Restaura o login da Dona Aranha (número original antes da troca)
UPDATE public.stores
SET login_whatsapp = '18997776186'
WHERE slug = 'loja-aranha';

-- Atualiza a RPC para buscar pelo login_whatsapp, com fallback para whatsapp
CREATE OR REPLACE FUNCTION public.email_for_whatsapp(_whatsapp text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_digits text;
  v_email text;
BEGIN
  v_digits := regexp_replace(coalesce(_whatsapp, ''), '\D', '', 'g');
  IF length(v_digits) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT u.email::text
    INTO v_email
    FROM public.stores s
    JOIN auth.users u ON u.id = s.owner_user_id
   WHERE regexp_replace(coalesce(s.login_whatsapp, s.whatsapp, ''), '\D', '', 'g') = v_digits
   LIMIT 1;

  RETURN v_email;
END;
$function$;
