
CREATE POLICY "Owner updates coupon leads" ON public.coupon_leads
  FOR UPDATE USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));

CREATE POLICY "Owner updates vip leads" ON public.vip_group_leads
  FOR UPDATE USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));
CREATE POLICY "Owner deletes vip leads" ON public.vip_group_leads
  FOR DELETE USING (public.is_store_owner(store_id));

CREATE POLICY "Owner updates newsletter leads" ON public.newsletter_leads
  FOR UPDATE USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));
CREATE POLICY "Owner deletes newsletter leads" ON public.newsletter_leads
  FOR DELETE USING (public.is_store_owner(store_id));

GRANT UPDATE ON public.coupon_leads TO authenticated;
GRANT UPDATE, DELETE ON public.vip_group_leads TO authenticated;
GRANT UPDATE, DELETE ON public.newsletter_leads TO authenticated;

NOTIFY pgrst, 'reload schema';
