import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Loader2, Info, ArrowUp, ArrowDown, Tag as TagIcon } from "lucide-react";
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

const MAX_VIDEOS = 5;

type SectionState = {
  id: string | null; // null when new (not yet persisted)
  localKey: string; // stable key for React lists
  title: string;
  videoUrl: string | null;
  videoType: VideoType | null;
  isActive: boolean;
  aspect: "vertical" | "horizontal";
  tags: ShoppableTag[];
};

export const Route = createFileRoute("/admin/home-video")({
  component: AdminHomeVideoPage,
});

function AdminHomeVideoPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const [sections, setSections] = useState<SectionState[]>([]);
  const [editingTagsKey, setEditingTagsKey] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const sectionsQ = useQuery({
    queryKey: ["admin-home-video-sections", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("home_video_sections")
        .select("*, home_video_tags(*)")
        .eq("store_id", store!.id)
        .order("position", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (sectionsQ.data) {
      setSections(
        sectionsQ.data.map((s: any, idx: number) => ({
          id: s.id,
          localKey: s.id ?? `init-${idx}`,
          title: s.title ?? `Vídeo ${idx + 1}`,
          videoUrl: s.video_url,
          videoType: s.video_type as VideoType | null,
          isActive: s.is_active,
          aspect: (s.aspect ?? "vertical") as "vertical" | "horizontal",
          tags: (s.home_video_tags ?? []).map((t: any) => ({
            id: t.id,
            product_id: t.product_id,
            position_x: Number(t.position_x),
            position_y: Number(t.position_y),
            timestamp_start: t.timestamp_start,
            timestamp_end: t.timestamp_end,
          })),
        })),
      );
    }
  }, [sectionsQ.data]);

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

  const products = productsQ.data ?? [];

  function patchSection(localKey: string, patch: Partial<SectionState>) {
    setSections((prev) => prev.map((s) => (s.localKey === localKey ? { ...s, ...patch } : s)));
  }

  function addSection() {
    if (sections.length >= MAX_VIDEOS) return;
    const newKey = `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSections((prev) => [
      ...prev,
      {
        id: null,
        localKey: newKey,
        title: `Vídeo ${prev.length + 1}`,
        videoUrl: null,
        videoType: null,
        isActive: true,
        aspect: "vertical",
        tags: [],
      },
    ]);
  }

  function removeSection(localKey: string) {
    setSections((prev) => prev.filter((s) => s.localKey !== localKey));
    if (editingTagsKey === localKey) setEditingTagsKey(null);
  }

  function moveSection(localKey: string, dir: -1 | 1) {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.localKey === localKey);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addTag(localKey: string) {
    const firstProductId = products[0]?.id;
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
    setSections((prev) =>
      prev.map((s) => (s.localKey === localKey ? { ...s, tags: [...s.tags, newTag] } : s)),
    );
    setSelectedTagId(newTag.id);
  }

  function moveTag(localKey: string, tagId: string, x: number, y: number) {
    setSections((prev) =>
      prev.map((s) =>
        s.localKey === localKey
          ? { ...s, tags: s.tags.map((t) => (t.id === tagId ? { ...t, position_x: x, position_y: y } : t)) }
          : s,
      ),
    );
  }

  function updateTag(localKey: string, tagId: string, patch: Partial<ShoppableTag>) {
    setSections((prev) =>
      prev.map((s) =>
        s.localKey === localKey
          ? { ...s, tags: s.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)) }
          : s,
      ),
    );
  }

  function removeTag(localKey: string, tagId: string) {
    setSections((prev) =>
      prev.map((s) => (s.localKey === localKey ? { ...s, tags: s.tags.filter((t) => t.id !== tagId) } : s)),
    );
    if (selectedTagId === tagId) setSelectedTagId(null);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("Loja não carregada");

      // Detect deletions: existing IDs no longer in current state
      const existingIds = (sectionsQ.data ?? []).map((s: any) => s.id);
      const keepIds = sections.filter((s) => s.id).map((s) => s.id as string);
      const toDelete = existingIds.filter((id) => !keepIds.includes(id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from("home_video_sections").delete().in("id", toDelete);
        if (error) throw error;
      }

      // Upsert each section in current order
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        const payload = {
          store_id: store.id,
          title: s.title.trim() || `Vídeo ${i + 1}`,
          video_url: s.videoUrl,
          video_type: s.videoType,
          is_active: s.isActive,
          position: i,
          aspect: s.aspect,
        };

        let sectionId = s.id;
        if (sectionId) {
          const { error } = await supabase.from("home_video_sections").update(payload).eq("id", sectionId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("home_video_sections")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          sectionId = data.id;
        }

        // Replace tags
        await supabase.from("home_video_tags").delete().eq("home_video_section_id", sectionId!);
        if (s.tags.length) {
          const rows = s.tags.map((t) => ({
            home_video_section_id: sectionId!,
            product_id: t.product_id,
            position_x: t.position_x,
            position_y: t.position_y,
            timestamp_start: t.timestamp_start,
            timestamp_end: t.timestamp_end,
          }));
          const { error } = await supabase.from("home_video_tags").insert(rows);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success("Vídeos salvos!");
      qc.invalidateQueries({ queryKey: ["admin-home-video-sections", store?.id] });
      qc.invalidateQueries({ queryKey: ["home-video-sections", store?.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  if (!store) return null;

  const limitReached = sections.length >= MAX_VIDEOS;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Vídeos da home (até {MAX_VIDEOS})</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre até {MAX_VIDEOS} vídeos verticais que aparecerão num carrossel na home, cada um com tags clicáveis sobre produtos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addSection}
            disabled={limitReached}
            title={limitReached ? `Limite máximo: ${MAX_VIDEOS} vídeos` : ""}
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar vídeo
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar todos</>
            )}
          </Button>
        </div>
      </div>

      {sections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum vídeo cadastrado. Clique em <strong>Adicionar vídeo</strong> para começar.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={section.localKey} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {idx + 1}
                </span>
                <Input
                  value={section.title}
                  onChange={(e) => patchSection(section.localKey, { title: e.target.value })}
                  className="max-w-xs"
                  placeholder={`Vídeo ${idx + 1}`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
                  <Label className="text-xs">Ativo</Label>
                  <Switch
                    checked={section.isActive}
                    onCheckedChange={(v) => patchSection(section.localKey, { isActive: v })}
                  />
                </div>
                <Select
                  value={section.aspect}
                  onValueChange={(v) => patchSection(section.localKey, { aspect: v as "vertical" | "horizontal" })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical 9:16</SelectItem>
                    <SelectItem value="horizontal">Horizontal 16:9</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => moveSection(section.localKey, -1)}
                  disabled={idx === 0}
                  title="Mover para cima"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => moveSection(section.localKey, 1)}
                  disabled={idx === sections.length - 1}
                  title="Mover para baixo"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSection(section.localKey)}
                  title="Excluir vídeo"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <Label className="text-xs">Vídeo</Label>
                <div className="mt-1.5">
                  <VideoSourcePicker
                    storeId={store.id}
                    videoUrl={section.videoUrl}
                    videoType={section.videoType}
                    onChange={({ url, type }) =>
                      patchSection(section.localKey, { videoUrl: url, videoType: type })
                    }
                  />
                </div>
              </div>

              <div>
                {section.videoUrl && section.videoType ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Tags do produto ({section.tags.length})</Label>
                      <Button
                        size="sm"
                        variant={editingTagsKey === section.localKey ? "default" : "outline"}
                        onClick={() =>
                          setEditingTagsKey(editingTagsKey === section.localKey ? null : section.localKey)
                        }
                      >
                        <TagIcon className="mr-1 h-3.5 w-3.5" />
                        {editingTagsKey === section.localKey ? "Fechar editor" : "Editar tags"}
                      </Button>
                    </div>
                    {editingTagsKey === section.localKey && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-start gap-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <p>Clique numa tag para selecioná-la. Arraste para reposicionar.</p>
                        </div>
                        <div className={section.aspect === "vertical" ? "mx-auto max-w-[260px]" : ""}>
                          <ShoppableVideo
                            videoUrl={section.videoUrl}
                            videoType={section.videoType}
                            tags={section.tags}
                            mode="edit"
                            onTagMove={(id, x, y) => moveTag(section.localKey, id, x, y)}
                            selectedTagId={selectedTagId}
                            className={section.aspect === "vertical" ? "!aspect-[9/16]" : ""}
                          />
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => addTag(section.localKey)}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar tag
                        </Button>

                        {section.tags.length > 0 && (
                          <div className="space-y-2">
                            {section.tags.map((t) => (
                              <div
                                key={t.id}
                                className={`rounded-lg border p-2.5 ${selectedTagId === t.id ? "border-accent" : "border-border"}`}
                                onClick={() => setSelectedTagId(t.id)}
                              >
                                <div className="mb-1.5 flex items-center justify-between">
                                  <span className="text-[11px] text-muted-foreground">
                                    X:{t.position_x.toFixed(0)}% Y:{t.position_y.toFixed(0)}%
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => removeTag(section.localKey, t.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                                <Select
                                  value={t.product_id}
                                  onValueChange={(v) => updateTag(section.localKey, t.id, { product_id: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Adicione um vídeo para configurar as tags.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sections.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg" className="shadow-xl">
            {save.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar todos</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
