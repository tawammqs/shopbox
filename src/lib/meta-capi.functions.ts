import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CapiEventInput = {
  store_id: string;
  event_name: string;
  event_id: string;
  value?: number;
  content_ids?: string[];
  content_name?: string;
  num_items?: number;
  fbp?: string;
  fbc?: string;
  user_agent?: string;
  event_source_url?: string;
};

export const sendMetaCapiEvent = createServerFn({ method: "POST" })
  .inputValidator((input: CapiEventInput) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    if (typeof input.store_id !== "string" || input.store_id.length < 8)
      throw new Error("Invalid store_id");
    if (typeof input.event_name !== "string" || input.event_name.length === 0)
      throw new Error("Invalid event_name");
    if (typeof input.event_id !== "string" || input.event_id.length === 0)
      throw new Error("Invalid event_id");
    return input;
  })
  .handler(async ({ data }) => {
    try {
      const { data: store } = await supabaseAdmin
        .from("stores")
        .select("facebook_pixel_id, meta_conversion_token")
        .eq("id", data.store_id)
        .maybeSingle();

      if (!store?.facebook_pixel_id || !store?.meta_conversion_token) {
        return { success: false, reason: "CAPI not configured" };
      }

      const res = await fetch(
        `https://graph.facebook.com/v18.0/${encodeURIComponent(store.facebook_pixel_id)}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: data.event_name,
                event_time: Math.floor(Date.now() / 1000),
                event_id: data.event_id,
                action_source: "website",
                event_source_url: data.event_source_url || undefined,
                user_data: {
                  client_user_agent: data.user_agent || "",
                  fbc: data.fbc || "",
                  fbp: data.fbp || "",
                },
                custom_data: {
                  currency: "BRL",
                  value: data.value,
                  content_ids: data.content_ids,
                  content_type: "product",
                  content_name: data.content_name,
                  num_items: data.num_items,
                },
              },
            ],
            access_token: store.meta_conversion_token,
          }),
        },
      );

      const result = await res.json().catch(() => ({}));
      return { success: res.ok, meta_response: result };
    } catch (err: any) {
      // Never throw — CAPI must fail silently
      return { success: false, error: err?.message ?? "unknown error" };
    }
  });
