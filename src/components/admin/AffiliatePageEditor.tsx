import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { normalizeAffiliatePageContent, type AffiliatePageContent } from "@/lib/affiliates";

type Props = { storeId: string; storeSlug: string; initial: unknown };

function StringList({
  label,
  hint,
  items,
  onChange,
  addLabel,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
          <Plus className="mr-1 h-4 w-4" /> {addLabel}
        </Button>
      </div>
    </div>
  );
}

export function AffiliatePageEditor({ storeId, storeSlug, initial }: Props) {
  const qc = useQueryClient();
  const [content, setContent] = useState<AffiliatePageContent>(() => normalizeAffiliatePageContent(initial));

  useEffect(() => {
    setContent(normalizeAffiliatePageContent(initial));
  }, [storeId]);

  const set = <K extends keyof AffiliatePageContent>(k: K, v: AffiliatePageContent[K]) =>
    setContent((c) => ({ ...c, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const cleaned: AffiliatePageContent = {
        ...content,
        benefits: content.benefits.map((b) => b.trim()).filter(Boolean),
        rules: content.rules.map((r) => r.trim()).filter(Boolean),
        steps: content.steps
          .filter((s) => s.title.trim() || s.text.trim())
          .map((s, i) => ({ ...s, number: s.number.trim() || String(i + 1) })),
      };
      const { error } = await supabase
        .from("stores")
        .update({ affiliate_page_content: cleaned as any })
        .eq("id", storeId);
      if (error) throw error;
      setContent(cleaned);
    },
    onSuccess: () => {
      toast.success("Página do programa salva!");
      qc.invalidateQueries({ queryKey: ["my-store-full"] });
      qc.invalidateQueries({ queryKey: ["affiliate-page-content", storeId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-foreground">Página do programa</h3>
          <p className="text-xs text-muted-foreground">Conteúdo exibido em /loja/{storeSlug}/afiliados</p>
        </div>
        <a
          href={`/loja/${storeSlug}/afiliados`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#25d366] hover:underline"
        >
          Ver página <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-medium">Título</Label>
          <Input value={content.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-medium">Subtítulo</Label>
          <Input value={content.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-medium">Descrição</Label>
          <Textarea rows={3} value={content.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div>
          <Label className="text-sm font-medium">Como funciona (passos)</Label>
          <div className="mt-2 space-y-3">
            {content.steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex gap-2">
                  <Input
                    className="w-16 text-center"
                    aria-label="Número"
                    value={step.number}
                    onChange={(e) =>
                      set("steps", content.steps.map((s, j) => (j === i ? { ...s, number: e.target.value } : s)))
                    }
                  />
                  <Input
                    placeholder="Título do passo"
                    value={step.title}
                    onChange={(e) =>
                      set("steps", content.steps.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover passo"
                    onClick={() => set("steps", content.steps.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Texto do passo"
                  value={step.text}
                  onChange={(e) =>
                    set("steps", content.steps.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)))
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set("steps", [...content.steps, { number: String(content.steps.length + 1), title: "", text: "" }])}
            >
              <Plus className="mr-1 h-4 w-4" /> Adicionar passo
            </Button>
          </div>
        </div>

        <StringList
          label="Vantagens"
          items={content.benefits}
          onChange={(v) => set("benefits", v)}
          addLabel="Adicionar vantagem"
        />

        <div>
          <Label className="text-sm font-medium">Texto de pagamento</Label>
          <Textarea rows={2} value={content.payment_text} onChange={(e) => set("payment_text", e.target.value)} />
        </div>

        <StringList label="Regras do programa" items={content.rules} onChange={(v) => set("rules", v)} addLabel="Adicionar regra" />

        <div>
          <Label className="text-sm font-medium">Texto do botão</Label>
          <Input value={content.cta_button} onChange={(e) => set("cta_button", e.target.value)} />
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb857]">
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
