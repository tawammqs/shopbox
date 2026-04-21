-- Função: dado um WhatsApp em qualquer formato, retorna o e-mail do dono da loja
-- com aquele número. Usada para permitir login pelo WhatsApp.
CREATE OR REPLACE FUNCTION public.email_for_whatsapp(_whatsapp text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
   WHERE regexp_replace(coalesce(s.whatsapp, ''), '\D', '', 'g') = v_digits
   LIMIT 1;

  RETURN v_email;
END;
$$;

-- Permitir que qualquer visitante chame essa função (ela só devolve e-mail
-- se houver loja cadastrada com o número; não expõe nada além disso).
GRANT EXECUTE ON FUNCTION public.email_for_whatsapp(text) TO anon, authenticated;