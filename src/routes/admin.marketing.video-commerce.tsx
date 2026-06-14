import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Plus, Lock, X, Upload } from "lucide-react";
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

type Product = { id: string; title: string };

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
  const [modalOpen, setModalOpen] = useState(false);

  const videos = useQuery({
    queryKey: ["store_videos", storeId, placement],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("store_videos")
        .select("*")
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
        .eq("is_visible", true)
        .order("title");
      return (data ?? []) as Product[];
    },
  });

  const list = videos.data ?? [];
  const productList = products.data ?? [];

  async function updateVideo(id: string, patch: any) {
    const { error } = await (supabase as any).from("store_videos").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["store_videos"] });
  }

  async function deleteVideo(id: string) {
    if (!confirm("Remover vídeo?")) return;
    const { error } = await (supabase as any).from("store_videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Vídeo removido");
    qc.invalidateQueries({ queryKey: ["store_videos"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#6b7280]">{list.length} de {limit} vídeos</p>
        <button
          onClick={() => {
            if (list.length >= limit) return toast.error(`Limite de ${limit} vídeos atingido para este plano.`);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fb959]"
        >
          <Plus className="h-4 w-4" /> Adicionar vídeo
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
          Nenhum vídeo adicionado ainda. Clique em "Adicionar vídeo" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <video src={v.video_url} className="h-20 w-20 shrink-0 rounded-lg bg-black object-cover" muted />
              <div className="min-w-0 flex-1 space-y-1">
                <input
                  defaultValue={v.title ?? ""}
                  placeholder="Sem título"
                  onBlur={(e) => {
                    if (e.target.value !== (v.title ?? "")) updateVideo(v.id, { title: e.target.value });
                  }}
                  className="h-8 w-full rounded-md border border-gray-200 px-2 text-sm font-medium"
                />
                <select
                  value={v.product_id ?? ""}
                  onChange={(e) => updateVideo(v.id, { product_id: e.target.value || null })}
                  className="h-8 w-full max-w-xs rounded-md border border-gray-200 px-2 text-xs"
                >
                  <option value="">— Sem produto associado —</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                <span>👁 {v.views_count ?? 0}</span>
                <button onClick={() => deleteVideo(v.id)} className="text-gray-400 hover:text-red-500" title="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <UploadModal
          storeId={storeId}
          placement={placement}
          position={list.length}
          products={productList}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            qc.invalidateQueries({ queryKey: ["store_videos"] });
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  storeId,
  placement,
  position,
  products,
  onClose,
  onSaved,
}: {
  storeId: string;
  placement: string;
  position: number;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  async function handleFile(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setUploading(true);
    try {
      const ext = f.name.split(".").pop();
      const path = `${storeId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-videos").upload(path, f);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("product-videos").getPublicUrl(path);
      setUploadedUrl(urlData.publicUrl);
      toast.success("Vídeo enviado");
    } catch (e: any) {
      toast.error(e.message ?? "Erro no upload");
      setFile(null);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!uploadedUrl) return toast.error("Envie um vídeo primeiro");
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("store_videos").insert({
        store_id: storeId,
        video_url: uploadedUrl,
        product_id: productId || null,
        placement,
        title: title.trim() || null,
        position,
      });
      if (error) throw error;
      toast.success("Vídeo salvo");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
        <h2 className="mb-4 text-lg font-bold text-[#111827]">Adicionar vídeo</h2>

        <div className="space-y-4">
          {!previewUrl ? (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Selecionar arquivo de vídeo</span>
              <span className="text-xs text-gray-400">MP4, MOV, WEBM</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <div className="relative">
              <video src={previewUrl} controls className="w-full rounded-lg bg-black" />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#374151]">Produto associado</label>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2 text-sm"
            />
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-gray-200 px-2 text-sm"
              size={Math.min(6, Math.max(3, filteredProducts.length + 1))}
            >
              <option value="">— Nenhum produto —</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151]">Título do vídeo (opcional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Unboxing Nike Dunk"
              className="mt-1 h-10 w-full rounded-md border border-gray-200 px-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={!uploadedUrl || uploading || saving}
              className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar vídeo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
