import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";

export const Route = createFileRoute("/admin/marketing/video-commerce")({
  head: () => ({ meta: [{ title: "Video Commerce — ShopBox" }] }),
  component: Page,
});

const TIER_LIMITS: Record<string, number> = {
  iniciante: 5,
  essencial: 50,
  profissional: 80,
  escala: 150,
};

function Page() {
  const { data: store } = useMyStore();
  const { data: status, isLoading } = useAddonStatus(store?.id, "video_commerce");
  const qc = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("addon_success") === "true") {
      toast.success("Add-on ativado!");
      qc.invalidateQueries({ queryKey: ["store_addon"] });
      qc.invalidateQueries({ queryKey: ["store_addons_all"] });
    }
  }, [qc]);

  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!status?.isActive) return <AddonPaywall addonKey="video_commerce" />;

  return <VideoCommerceConfig storeId={store!.id} planTier={status.planTier || "iniciante"} />;
}

function VideoCommerceConfig({ storeId, planTier }: { storeId: string; planTier: string }) {
  const [tab, setTab] = useState<"home" | "product">("home");
  const limit = TIER_LIMITS[planTier] ?? 5;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-[#111827]">Video Commerce</h1>
        <p className="text-sm text-[#6b7280]">
          Plano <span className="font-semibold capitalize">{planTier}</span> · até {limit} vídeos
        </p>
      </header>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("home")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "home" ? "border-[#25d366] text-[#25d366]" : "border-transparent text-gray-500"
          }`}
        >
          Carrossel da home
        </button>
        <button
          onClick={() => setTab("product")}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === "product" ? "border-[#25d366] text-[#25d366]" : "border-transparent text-gray-500"
          }`}
        >
          Stories do produto
        </button>
      </div>

      <VideoList storeId={storeId} placement={tab === "home" ? "home_carousel" : "product_stories"} limit={limit} />

      {planTier === "iniciante" && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          <Lock className="mx-auto mb-2 h-5 w-5" />
          Métricas, campanhas, feed e Live Commerce disponíveis a partir do plano Essencial.
        </div>
      )}
    </div>
  );
}

function VideoList({ storeId, placement, limit }: { storeId: string; placement: string; limit: number }) {
  const qc = useQueryClient();
  const videos = useQuery({
    queryKey: ["store_videos", storeId, placement],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("store_videos")
        .select("*, products(name)")
        .eq("store_id", storeId)
        .eq("placement", placement)
        .order("position");
      return data ?? [];
    },
  });
  const products = useQuery({
    queryKey: ["products_simple", storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title")
        .eq("store_id", storeId)
        .order("title");
      return data ?? [];
    },
  });

  const list = videos.data ?? [];

  async function handleUpload(file: File) {
    if (list.length >= limit) {
      toast.error(`Limite de ${limit} vídeos atingido para este plano.`);
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${storeId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("product-videos").upload(path, file);
    if (upErr) return toast.error(upErr.message);
    const { data: urlData } = supabase.storage.from("product-videos").getPublicUrl(path);
    const { error } = await (supabase as any).from("store_videos").insert({
      store_id: storeId,
      video_url: urlData.publicUrl,
      placement,
      position: list.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Vídeo enviado");
    qc.invalidateQueries({ queryKey: ["store_videos"] });
  }

  async function updateVideo(id: string, patch: any) {
    await (supabase as any).from("store_videos").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["store_videos"] });
  }

  async function deleteVideo(id: string) {
    if (!confirm("Remover vídeo?")) return;
    await (supabase as any).from("store_videos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["store_videos"] });
  }

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium hover:bg-gray-50">
        <Plus className="h-4 w-4" /> Enviar vídeo
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-xs text-[#6b7280]">{list.length} de {limit} vídeos</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v: any) => (
          <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-3">
            <video src={v.video_url} controls className="w-full rounded-lg bg-black" />
            <input
              defaultValue={v.title ?? ""}
              placeholder="Título (opcional)"
              onBlur={(e) => updateVideo(v.id, { title: e.target.value })}
              className="mt-2 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
            />
            <select
              defaultValue={v.product_id ?? ""}
              onChange={(e) => updateVideo(v.id, { product_id: e.target.value || null })}
              className="mt-2 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
            >
              <option value="">Sem produto</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>👁 {v.views_count}</span>
              <button onClick={() => deleteVideo(v.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
