import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, MessageCircle, CheckCircle2, EyeOff, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { markQuestionsReviewsViewed } from "@/hooks/useUnreadCounts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/perguntas")({
  head: () => ({ meta: [{ title: "Perguntas e Avaliações — ShopBox" }] }),
  component: PerguntasPage,
});

function PerguntasPage() {
  const { data: store } = useMyStore();
  const [tab, setTab] = useState<"perguntas" | "avaliacoes">("perguntas");

  useEffect(() => {
    if (!store?.id) return;
    markQuestionsReviewsViewed(store.id).catch(() => {});
  }, [store?.id]);

  if (!store) return <p>Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Perguntas e Avaliações</h1>
        <p className="text-sm text-muted-foreground">Responda perguntas dos clientes e modere avaliações.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("perguntas")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            tab === "perguntas" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground")}
        >
          Perguntas
        </button>
        <button
          onClick={() => setTab("avaliacoes")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            tab === "avaliacoes" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground")}
        >
          Avaliações
        </button>
      </div>

      {tab === "perguntas" ? <QuestionsList storeId={store.id} /> : <ReviewsList storeId={store.id} />}
    </div>
  );
}

function QuestionsList({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-questions", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_questions")
        .select("id, product_id, customer_name, customer_whatsapp, question, answer, status, created_at, products!inner(title, slug, store_id)")
        .eq("products.store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-questions", storeId] });

  if (q.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  const items = q.data ?? [];
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma pergunta recebida ainda.</p>;

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <QuestionCard key={item.id} item={item} onChange={refresh} />
      ))}
    </div>
  );
}

function QuestionCard({ item, onChange }: { item: any; onChange: () => void }) {
  const [answer, setAnswer] = useState(item.answer ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (answer.trim().length < 2) return toast.error("Digite uma resposta");
    setBusy(true);
    try {
      const { error } = await supabase
        .from("product_questions")
        .update({ answer: answer.trim(), answered_at: new Date().toISOString(), status: "answered" })
        .eq("id", item.id);
      if (error) throw error;
      toast.success("Resposta publicada");
      onChange();
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setBusy(false);
    }
  }

  async function hide() {
    setBusy(true);
    try {
      const { error } = await supabase.from("product_questions").update({ status: "hidden" }).eq("id", item.id);
      if (error) throw error;
      toast.success("Pergunta ocultada");
      onChange();
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm("Excluir esta pergunta?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("product_questions").delete().eq("id", item.id);
      if (error) throw error;
      toast.success("Excluída");
      onChange();
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            Produto: <span className="font-medium text-foreground">{item.products?.title}</span>
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{item.question}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.customer_name}{item.customer_whatsapp ? ` • ${item.customer_whatsapp}` : ""} • {new Date(item.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
          item.status === "answered" ? "bg-emerald-100 text-emerald-700" :
          item.status === "hidden" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700")}>
          {item.status === "answered" ? "Respondida" : item.status === "hidden" ? "Oculta" : "Pendente"}
        </span>
      </div>

      <div className="mt-3">
        <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Escreva sua resposta..." rows={3} />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={save} disabled={busy}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> {item.status === "answered" ? "Atualizar resposta" : "Publicar resposta"}
          </Button>
          {item.status !== "hidden" && (
            <Button size="sm" variant="outline" onClick={hide} disabled={busy}>
              <EyeOff className="mr-1 h-4 w-4" /> Ocultar
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
            <Trash2 className="mr-1 h-4 w-4" /> Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewsList({ storeId }: { storeId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-reviews", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, customer_name, customer_whatsapp, rating, text, status, photo_url, created_at, products!inner(title, store_id)")
        .eq("products.store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-reviews", storeId] });

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const { error } = await supabase.from("product_reviews").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    refresh();
  }
  async function remove(id: string) {
    if (!confirm("Excluir avaliação?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluída");
    refresh();
  }

  if (q.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
  const items = q.data ?? [];
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma avaliação recebida ainda.</p>;

  return (
    <div className="space-y-3">
      {items.map((r: any) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                Produto: <span className="font-medium text-foreground">{r.products?.title}</span>
              </p>
              <div className="mt-1 flex">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className={cn("h-4 w-4", n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                ))}
              </div>
              {r.text && <p className="mt-2 text-sm">{r.text}</p>}
              {r.photo_url && (
                <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                  <img src={r.photo_url} alt="Foto enviada pelo cliente" className="h-20 w-20 rounded-lg border border-border object-cover" />
                </a>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {r.customer_name}{r.customer_whatsapp ? ` • ${r.customer_whatsapp}` : ""} • {new Date(r.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold",
              r.status === "approved" ? "bg-emerald-100 text-emerald-700" :
              r.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
              {r.status === "approved" ? "Aprovada" : r.status === "rejected" ? "Rejeitada" : "Pendente"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status !== "approved" && (
              <Button size="sm" onClick={() => setStatus(r.id, "approved")}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
              </Button>
            )}
            {r.status !== "rejected" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                <EyeOff className="mr-1 h-4 w-4" /> Rejeitar
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
