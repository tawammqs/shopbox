import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/loja/redes-sociais")({
  head: () => ({ meta: [{ title: "Links de redes sociais — ShopBox" }] }),
  component: Page,
});

const FIELDS = [
  { k: "instagram_username", l: "Nome de usuário no Instagram", ph: "@sualoja" },
  { k: "instagram_token", l: "Token do Instagram", ph: "", hint: "Permite mostrar o feed na sua loja." },
  { k: "facebook_url", l: "Link da página do Facebook", ph: "https://facebook.com/suapagina" },
  { k: "youtube_url", l: "Link do canal do YouTube", ph: "https://youtube.com/@seucanal" },
  { k: "tiktok_username", l: "Nome de usuário no TikTok", ph: "@sualoja" },
  { k: "twitter_username", l: "Nome de usuário no Twitter/X", ph: "@sualoja" },
  { k: "pinterest_url", l: "Link da página do Pinterest", ph: "https://pinterest.com/sualoja" },
  { k: "pinterest_tag", l: "Etiqueta do Pinterest", ph: 'Ex: <meta name="p:domain_verify" content="..."/>', hint: "Permite rastrear os visitantes na sua loja." },
  { k: "blog_url", l: "Link do blog", ph: "https://seublog.com" },
] as const;

function Page() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const q = useQuery({
    queryKey: ["social_links", store?.id],
    enabled: !!store?.id,
    queryFn: async () => (await supabase.from("store_social_links").select("*").eq("store_id", store!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (q.data) {
      const v: Record<string, string> = {};
      FIELDS.forEach((f) => { v[f.k] = (q.data as any)[f.k] ?? ""; });
      setVals(v);
    }
  }, [q.data]);

  async function save() {
    if (!store) return;
    setSaving(true);
    try {
      const payload: any = { store_id: store.id, updated_at: new Date().toISOString() };
      FIELDS.forEach((f) => { payload[f.k] = vals[f.k] || null; });
      const { error } = await supabase.from("store_social_links").upsert(payload, { onConflict: "store_id" });
      if (error) throw error;
      toast.success("Salvo");
      qc.invalidateQueries({ queryKey: ["social_links"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Links de redes sociais</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Adicione as redes sociais da sua loja para que apareçam como informação de contato no rodapé da sua loja.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        {FIELDS.map((f) => (
          <div key={f.k}>
            <label className="block text-sm font-medium text-[#111827]">{f.l}</label>
            <input
              value={vals[f.k] ?? ""}
              onChange={(e) => setVals((v) => ({ ...v, [f.k]: e.target.value }))}
              placeholder={f.ph}
              className="mt-1 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#25d366]"
            />
            {"hint" in f && f.hint && (
              <p className="mt-1 text-xs text-[#6b7280]">{f.hint} <a href="#" className="font-medium text-[#25d366] hover:underline">Saiba como ↗</a></p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => q.refetch()} className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium hover:bg-gray-50">Cancelar</button>
        <button onClick={save} disabled={saving} className="h-10 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60">{saving ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}
