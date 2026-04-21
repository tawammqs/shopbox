-- Migration: cria 2 usuários lojistas pré-configurados com plano Premium
DO $$
DECLARE
  v_premium_id uuid;
  v_user1_id uuid := gen_random_uuid();
  v_user2_id uuid := gen_random_uuid();
  v_slug1 text;
  v_slug2 text;
BEGIN
  SELECT id INTO v_premium_id FROM public.plans WHERE slug = 'premium' LIMIT 1;

  -- ============ USER 1: 37 8832-0976 / Yago37ns ============
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '3788320976@shopbox.local') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '3788320976@shopbox.local', crypt('Yago37ns', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Yago"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), v_user1_id,
      jsonb_build_object('sub', v_user1_id::text, 'email', '3788320976@shopbox.local'),
      'email', v_user1_id::text, now(), now(), now()
    );

    -- Slug único para a loja
    v_slug1 := 'loja-yago';
    WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = v_slug1) LOOP
      v_slug1 := 'loja-yago-' || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;

    INSERT INTO public.stores (
      owner_user_id, name, slug, segment, plan_id,
      subscription_status, active, whatsapp,
      trial_ends_at
    ) VALUES (
      v_user1_id, 'Loja Yago', v_slug1, 'Outros', v_premium_id,
      'trialing', true, '37883209760000000',
      now() + interval '30 days'
    );
    -- Atualiza para o número real (com formatação que o sistema reconhece)
    UPDATE public.stores SET whatsapp = '(37) 8832-0976' WHERE owner_user_id = v_user1_id;
  END IF;

  -- ============ USER 2: 18 99777-6186 / Aranha2026 ============
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '18997776186@shopbox.local') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      '18997776186@shopbox.local', crypt('Aranha2026', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Aranha"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at
    ) VALUES (
      gen_random_uuid(), v_user2_id,
      jsonb_build_object('sub', v_user2_id::text, 'email', '18997776186@shopbox.local'),
      'email', v_user2_id::text, now(), now(), now()
    );

    v_slug2 := 'loja-aranha';
    WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = v_slug2) LOOP
      v_slug2 := 'loja-aranha-' || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;

    INSERT INTO public.stores (
      owner_user_id, name, slug, segment, plan_id,
      subscription_status, active, whatsapp,
      trial_ends_at
    ) VALUES (
      v_user2_id, 'Loja Aranha', v_slug2, 'Outros', v_premium_id,
      'trialing', true, '(18) 99777-6186',
      now() + interval '30 days'
    );
  END IF;
END $$;