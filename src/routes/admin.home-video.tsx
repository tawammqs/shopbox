import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoSourcePicker } from "@/components/admin/VideoSourcePicker";
import { ShoppableVideo, type ShoppableTag } from "@/components/storefront/ShoppableVideo";
import type { VideoType } from "@/lib/video";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/home-video")({
  component: AdminHomeVideoPage,
});

function AdminHomeVideoPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const [sectionId, setSectionId] = useState<string | null>(null);
  const [title, setTitle] = useState("Descubra cada detalhe em vídeo");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [tags, setTags] = useState<ShoppableTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const sectionQ = useQuery({
    queryKey: ["admin-home-video-section", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_sections")
        .select("*, home_video_tags(*)")
        .eq("store_id", store!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (sectionQ.data) {
      setSectionId(sectionQ.data.id);
      setTitle(sectionQ.data.title);
      setVideoUrl(sectionQ.data.video_url);
      setVideoType(sectionQ.data.video_type as VideoType | null);
      setIsActive(sectionQ.data.is_active);
      setTags(
        (sectionQ.data.home_video_tags ?? []).map((t: any) => ({
          id: t.id,
          product_id: t.product_id,
          position_x: Number(t.position_x),
          position_y: Number(t.position_y),
          timestamp_start: t.timestamp_start,
          timestamp_end: t.timestamp_end,
        })),
      );
    }
  }, [sectionQ.data]);

  const productsQ = useQuery({
    queryKey: ["admin-products-for-video", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, product_images(url, position)")
        .eq("store_id", store!.id)
        .eq("active", true)
        .order("title");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("Loja não carregada");
      let id = sectionId;
      const payload = {
        store_id: store.id,
        title: title.trim() || "Descubra cada detalhe em vídeo",
        video_url: videoUrl,
        video_type: videoType,
        is_active: isActive,
      };
      if (id) {
        const { error } = await supabase.from("home_video_sections").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("home_video_sections")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
        setSectionId(id);
      }
      // Replace tags
      await supabase.from("home_video_tags").delete().eq("home_video_section_id", id!);
      if (tags.length) {
        const rows = tags.map((t) => ({
          home_video_section_id: id!,
          product_id: t.product_id,
          position_x: t.position_x,
          position_y: t.position_y,
          timestamp_start: t.timestamp_start,
          timestamp_end: t.timestamp_end,
        }));
        const { error } = await supabase.from("home_video_tags").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Seção salva!");
      qc.invalidateQueries({ queryKey: ["admin-home-video-section", store?.id] });
      qc.invalidateQueries({ queryKey: ["home-video-section", store?.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  function addTag() {
    const firstProductId = productsQ.data?.[0]?.id;
    if (!firstProductId) {
      toast.error("Cadastre um produto antes.");
      return;
    }
    const newTag: ShoppableTag = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      product_id: firstProductId,
      position_x: 50,
      position_y: 50,
      timestamp_start: null,
      timestamp_end: null,
    };
    setTags((prev) => [...prev, newTag]);
    setSelectedTagId(newTag.id);
  }

  function moveTag(id: string, x: number, y: number) {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t)));
  }

  function updateTag(id: string, patch: Partial<ShoppableTag>) {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTag(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id));
    if (selectedTagId === id) setSelectedTagId(null);
  }

  if (!store) return null;

  const products = productsQ.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Vídeo da home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione um vídeo principal na home da sua loja com tags clicáveis sobre produtos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Configuração">
            <div className="flex items-center justify-between">
              <Label>Seção ativa na home</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="title" className="text-xs">Título da seção</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </Card>

          <Card title="Vídeo principal">
            <VideoSourcePicker
              storeId={store.id}
              videoUrl={videoUrl}
              videoType={videoType}
              onChange={({ url, type }) => {
                setVideoUrl(url);
                setVideoType(type);
              }}
            />
          </Card>

          {videoUrl && videoType && (
            <Card title="Tags do produto (arraste para posicionar)">
              <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Clique numa tag para selecioná-la. Arraste para reposicionar.
                  {videoType === "youtube" && " Para vídeos do YouTube, as tags ficam sempre visíveis (timestamps não suportados)."}
                </p>
              </div>
              <div className="mt-3">
                <ShoppableVideo
                  videoUrl={videoUrl}
                  videoType={videoType}
                  tags={tags}
                  mode="edit"
                  onTagMove={moveTag}
                  selectedTagId={selectedTagId}
                />
              </div>
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={addTag}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar tag
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Lista de tags">
            {tags.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tag ainda.</p>}
            <div className="space-y-3">
              {tags.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg border p-3 ${selectedTagId === t.id ? "border-accent" : "border-border"}`}
                  onClick={() => setSelectedTagId(t.id)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      X:{t.position_x.toFixed(0)}% Y:{t.position_y.toFixed(0)}%
                    </span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeTag(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <Label className="text-xs">Produto</Label>
                  <Select value={t.product_id} onValueChange={(v) => updateTag(t.id, { product_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {videoType !== "youtube" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Início (s)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={t.timestamp_start ?? ""}
                          onChange={(e) =>
                            updateTag(t.id, {
                              timestamp_start: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fim (s)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={t.timestamp_end ?? ""}
                          onChange={(e) =>
                            updateTag(t.id, {
                              timestamp_end: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="sticky top-20">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full" size="lg">
              {save.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Salvar</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-3 font-display text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}
