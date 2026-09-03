import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/admin/afiliados")({
  head: () => ({ meta: [{ title: "Afiliados — ShopBox" }] }),
  component: AffiliatesAdminPage,
});

type AffiliateRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  affiliate_slug: string;
  status: string;
  created_at: string;
};

function AffiliateSettings({ store }: { store: NonNullable<ReturnType<typeof useMyStore>["data"]> }) {
  const qc = useQueryClient();
  const [settings, setSettings] = useState({
    affiliates_enabled: !!store.affiliates_enabled,
    affiliate_commission_direct: Number(store.affiliate_commission_direct ?? 5),
    affiliate_commission_referrer: Number(store.affiliate_commission_referrer ?? 2.5),
  });

  useEffect(() => {
    setSettings({
      affiliates_enabled: !!store.affiliates_enabled,
      affiliate_commission_direct: Number(store.affiliate_commission_direct ?? 5),
      affiliate_commission_referrer: Number(store.affiliate_commission_referrer ?? 2.5),
    });
  }, [store.id, store.affiliates_enabled, store.affiliate_commission_direct, store.affiliate_commission_referrer]);

  const save = useMutation({
    mutationFn: async () => {
      const direct = Number(settings.affiliate_commission_direct);
      const referrer = Number(settings.affiliate_commission_referrer);
      if (!Number.isFinite(direct) || direct < 0 || direct > 50) throw new Error("Comissão direta deve estar entre 0% e 50%");
      if (!Number.isFinite(referrer) || referrer < 0 || referrer > 20) throw new Error("Comissão de recrutador deve estar entre 0% e 20%");
      const { error } = await supabase
        .from("stores")
        .update({
          affiliates_enabled: settings.affiliates_enabled,
          affiliate_commission_direct: direct,
          affiliate_commission_referrer: referrer,
        })
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas!");
      qc.invalidateQueries({ queryKey: ["my-store-full"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar."),
  });

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
        <Settings2 className="h-4 w-4" /> Configurações do Programa
      </h3>

      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Programa de afiliados</p>
            <p className="text-xs text-muted-foreground">Ativar ou desativar o programa para sua loja</p>
          </div>
          <button
            type="button"
            aria-label="Ativar programa de afiliados"
            onClick={() => setSettings((s) => ({ ...s, affiliates_enabled: !s.affiliates_enabled }))}
            className={`flex h-6 w-12 shrink-0 items-center rounded-full transition-colors ${
              settings.affiliates_enabled ? "bg-[#25d366]" : "bg-muted"
            }`}
          >
            <div
              className={`mx-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.affiliates_enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <Label className="text-sm font-medium">Comissão direta (%)</Label>
          <p className="mb-1 text-xs text-muted-foreground">% que o afiliado ganha por cada venda que indicar</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              max={50}
              step={0.5}
              className="w-24 text-center"
              value={settings.affiliate_commission_direct}
              onChange={(e) => setSettings((s) => ({ ...s, affiliate_commission_direct: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
            />
            <span className="text-sm text-muted-foreground">%</span>
            <span className="text-xs text-muted-foreground">
              Ex: venda de R$ 200 → afiliado recebe {formatBRL((200 * (settings.affiliate_commission_direct || 0)) / 100)}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Comissão de recrutador (%)</Label>
          <p className="mb-1 text-xs text-muted-foreground">% que quem recrutou o afiliado ganha sobre as vendas dele</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              className="w-24 text-center"
              value={settings.affiliate_commission_referrer}
              onChange={(e) => setSettings((s) => ({ ...s, affiliate_commission_referrer: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
            />
            <span className="text-sm text-muted-foreground">%</span>
            <span className="text-xs text-muted-foreground">
              Ex: venda de R$ 200 → recrutador recebe {formatBRL((200 * (settings.affiliate_commission_referrer || 0)) / 100)}
            </span>
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb857]">
          {save.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}

function AffiliatesAdminPage() {
  const { data: store, isLoading: storeLoading } = useMyStore();

  const { data: affiliates = [], isLoading } = useQuery({
    queryKey: ["admin-affiliates", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_affiliates")
        .select("id, name, email, whatsapp, affiliate_slug, status, created_at")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AffiliateRow[];
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["admin-affiliate-sales", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_sales")
        .select("affiliate_id, order_total, commission_amount")
        .eq("store_id", store!.id);
      if (error) throw error;
      return (data ?? []) as { affiliate_id: string; order_total: number; commission_amount: number }[];
    },
  });

  if (storeLoading || !store) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totals = new Map<string, { sales: number; commission: number }>();
  for (const s of sales) {
    const cur = totals.get(s.affiliate_id) ?? { sales: 0, commission: 0 };
    cur.sales += Number(s.order_total ?? 0);
    cur.commission += Number(s.commission_amount ?? 0);
    totals.set(s.affiliate_id, cur);
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["program", "Programa"],
            ["page", "Página do programa"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "page" ? (
        <AffiliatePageEditor storeId={store.id} storeSlug={store.slug} initial={store.affiliate_page_content} />
      ) : (
        <>
      <AffiliateSettings store={store} />

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
          <Users className="h-4 w-4" /> Afiliados cadastrados ({affiliates.length})
        </h3>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : affiliates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum afiliado cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {affiliates.map((a) => {
              const t = totals.get(a.id) ?? { sales: 0, commission: 0 };
              return (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.email} · /{a.affiliate_slug}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Vendas: {formatBRL(t.sales)}</p>
                    <p>Comissão: {formatBRL(t.commission)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
