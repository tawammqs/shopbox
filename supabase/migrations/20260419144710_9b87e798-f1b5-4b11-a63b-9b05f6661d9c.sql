-- Clean up orphan store created without completed payment
DELETE FROM public.stores WHERE slug = 'minha-loja-d53c88' AND stripe_subscription_id IS NULL;

-- Deactivate redundant 'basico' plan that pollutes the plans list
UPDATE public.plans SET active = false WHERE slug = 'basico';