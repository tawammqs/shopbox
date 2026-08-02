import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DEFAULT_SOBRE, mergeSobre, type SobreConfig } from "@/lib/sobre-config";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/politicas")({
  head: () => ({ meta: [{ title: "Sobre a marca — ShopBox" }] }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const { data: store } = useMyStore();
  const [cfg, setCfg] = useState<SobreConfig>(DEFAULT_SOBRE);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["store-policies", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_policies")
        .select("sobre_config")
        .eq("store_id", store!.id)
        .maybeSingle();
      if (error) throw error;
      return mergeSobre((data as any)?.sobre_config);
    },
  });

  useEffect(() => {
    if (data) setCfg(data);
  }, [data]);

  const patch = (p: Partial<SobreConfig>) => setCfg((c) => ({ ...c, ...p }));

  const save = async () => {
    if (!store?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_policies")
      .upsert({ store_id: store.id, sobre_config: cfg as any }, { onConflict: "store_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Página “Sobre a marca” atualizada");
  };

  if (isLoading || !store) {
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Sobre a marca</h1>
        <p className="text-sm text-muted-foreground">
          Essas informações aparecem na página pública /loja/{store.slug}/sobre.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <Label>Título</Label>
          <Input className="mt-1" value={cfg.titulo} onChange={(e) => patch({ titulo: e.target.value })} />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input className="mt-1" value={cfg.subtitulo} onChange={(e) => patch({ subtitulo: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ano de fundação</Label>
            <Input
              className="mt-1"
              inputMode="numeric"
              value={cfg.fundacao_ano ?? ""}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "");
                patch({ fundacao_ano: n ? Number(n) : null });
              }}
              placeholder="2018"
            />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input
              className="mt-1"
              value={cfg.cidade}
              onChange={(e) => patch({ cidade: e.target.value })}
              placeholder="Presidente Prudente, SP"
            />
          </div>
        </div>
        <div>
          <Label>História da marca</Label>
          <Textarea
            className="mt-1"
            rows={6}
            value={cfg.historia}
            onChange={(e) => patch({ historia: e.target.value })}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Imagens</h2>
        <div>
          <Label>Foto de capa</Label>
          <ImageUpload
            bucket="banners"
            storeId={store.id}
            value={cfg.foto_banner || null}
            onChange={(url) => patch({ foto_banner: url ?? "" })}
            aspect="aspect-video"
            className="mt-1 max-w-sm"
          />
        </div>
        <div>
          <Label>Galeria (até 4 fotos)</Label>
          <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <ImageUpload
                key={i}
                bucket="banners"
                storeId={store.id}
                value={cfg.fotos_galeria[i] ?? null}
                onChange={(url) => {
                  const arr = [...cfg.fotos_galeria];
                  if (url) arr[i] = url;
                  else arr.splice(i, 1);
                  patch({ fotos_galeria: arr.filter(Boolean) });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Diferenciais (até 4)</h2>
        {cfg.diferenciais.map((d, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-3">
            <Input
              className="w-14 text-center"
              value={d.icone}
              onChange={(e) => {
                const arr = [...cfg.diferenciais];
                arr[i] = { ...d, icone: e.target.value };
                patch({ diferenciais: arr });
              }}
            />
            <div className="flex-1 space-y-2">
              <Input
                value={d.titulo}
                placeholder="Título"
                onChange={(e) => {
                  const arr = [...cfg.diferenciais];
                  arr[i] = { ...d, titulo: e.target.value };
                  patch({ diferenciais: arr });
                }}
              />
              <Input
                value={d.descricao}
                placeholder="Descrição"
                onChange={(e) => {
                  const arr = [...cfg.diferenciais];
                  arr[i] = { ...d, descricao: e.target.value };
                  patch({ diferenciais: arr });
                }}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => patch({ diferenciais: cfg.diferenciais.filter((_, k) => k !== i) })}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {cfg.diferenciais.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              patch({ diferenciais: [...cfg.diferenciais, { icone: "⭐", titulo: "", descricao: "" }] })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar diferencial
          </Button>
        )}
      </section>

      <section className="flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Mostrar equipe de vendas</p>
          <p className="text-xs text-muted-foreground">Exibe os vendedores ativos cadastrados em Equipe de vendas.</p>
        </div>
        <Switch checked={cfg.mostrar_equipe} onCheckedChange={(v) => patch({ mostrar_equipe: v })} />
      </section>

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar
      </Button>
    </div>
  );
}
