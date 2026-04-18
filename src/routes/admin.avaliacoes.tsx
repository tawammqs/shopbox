import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["admin-reviews", store?.id],
    enabled: !!store,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*, product:products!inner(title, store_id)")
        .eq("product.store_id", store!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "pending" | "rejected" }) => {
      const { error } = await supabase.from("product_reviews").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("product_reviews").delete().eq("id", id); },
    onSuccess: () => { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });

  const all = list.data ?? [];
  const pending = all.filter((r: any) => r.status === "pending");
  const approved = all.filter((r: any) => r.status === "approved");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">Modere os comentários dos clientes</p>
      </div>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Aprovadas ({approved.length})</TabsTrigger>
        </TabsList>
        {(["pending", "approved"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="space-y-3">
              {(tab === "pending" ? pending : approved).map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{r.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{r.product?.title} · {"⭐".repeat(r.rating)}</p>
                    </div>
                    <div className="flex gap-1">
                      {tab === "pending" && (
                        <>
                          <Button size="sm" onClick={() => update.mutate({ id: r.id, status: "approved" })}><Check className="mr-1 h-3 w-3" /> Aprovar</Button>
                          <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, status: "rejected" })}><X className="mr-1 h-3 w-3" /> Rejeitar</Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(r.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  {r.text && <p className="text-sm text-muted-foreground">{r.text}</p>}
                </div>
              ))}
              {(tab === "pending" ? pending : approved).length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma avaliação.</p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
