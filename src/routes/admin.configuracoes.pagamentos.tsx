import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/pagamentos")({
  component: PagamentosPage,
});

type Settings = {
  pix_enabled: boolean;
  pix_key: string;
  pix_discount_percent: number;
  credit_card_enabled: boolean;
  cash_enabled: boolean;
  pickup_payment_enabled: boolean;
  installments_enabled: boolean;
  max_installments: number;
  installments_no_interest: boolean;
  min_installment_value: number;
};

const DEFAULTS: Settings = {
  pix_enabled: true,
  pix_key: "",
  pix_discount_percent: 0,
  credit_card_enabled: true,
  cash_enabled: false,
  pickup_payment_enabled: false,
  installments_enabled: true,
  max_installments: 3,
  installments_no_interest: true,
  min_installment_value: 10,
};

const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 10, 12];

function PagamentosPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [pixDiscountEnabled, setPixDiscountEnabled] = useState(false);

  const { data } = useQuery({
    queryKey: ["payment-settings", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("store_payment_settings")
        .select("*")
        .eq("store_id", store!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setS({
        pix_enabled: data.pix_enabled,
        pix_key: data.pix_key ?? "",
        pix_discount_percent: Number(data.pix_discount_percent ?? 0),
        credit_card_enabled: data.credit_card_enabled,
        cash_enabled: data.cash_enabled,
        pickup_payment_enabled: data.pickup_payment_enabled,
        installments_enabled: data.installments_enabled,
        max_installments: data.max_installments,
        installments_no_interest: data.installments_no_interest,
        min_installment_value: Number(data.min_installment_value ?? 10),
      });
      setPixDiscountEnabled(Number(data.pix_discount_percent ?? 0) > 0);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const payload = {
        store_id: store.id,
        ...s,
        pix_discount_percent: pixDiscountEnabled ? s.pix_discount_percent || 5 : 0,
      };
      const { error } = await supabase
        .from("store_payment_settings")
        .upsert(payload, { onConflict: "store_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const previewPrice = 199.9;
  const pixPrice = useMemo(() => {
    const pct = pixDiscountEnabled ? s.pix_discount_percent || 5 : 0;
    return previewPrice * (1 - pct / 100);
  }, [pixDiscountEnabled, s.pix_discount_percent]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Pagamentos</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Configure as formas de pagamento e parcelamento que aparecerão para seus clientes no checkout.
          </p>
        </div>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="bg-[#25d366] text-white hover:bg-[#1fb955]"
        >
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      {/* Card 1 */}
      <Card title="Formas de pagamento aceitas">
        <PayRow
          icon="💚"
          label="PIX"
          checked={s.pix_enabled}
          onChange={(v) => setS({ ...s, pix_enabled: v })}
        >
          {s.pix_enabled && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <Label className="text-xs">Chave PIX</Label>
                <Input
                  value={s.pix_key}
                  onChange={(e) => setS({ ...s, pix_key: e.target.value })}
                  placeholder="CPF, CNPJ, e-mail ou telefone"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pix-disc"
                  checked={pixDiscountEnabled}
                  onCheckedChange={(v) => setPixDiscountEnabled(!!v)}
                />
                <Label htmlFor="pix-disc" className="cursor-pointer text-sm font-normal">
                  Oferecer desconto no PIX
                </Label>
              </div>
              {pixDiscountEnabled && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <Label>% de desconto</Label>
                    <span className="font-semibold text-[#15803d]">{s.pix_discount_percent || 5}%</span>
                  </div>
                  <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[s.pix_discount_percent || 5]}
                    onValueChange={([v]) => setS({ ...s, pix_discount_percent: v })}
                  />
                </div>
              )}
            </div>
          )}
        </PayRow>
        <PayRow icon="💳" label="Cartão de crédito" checked={s.credit_card_enabled} onChange={(v) => setS({ ...s, credit_card_enabled: v })} />
        <PayRow icon="💵" label="Dinheiro na entrega" checked={s.cash_enabled} onChange={(v) => setS({ ...s, cash_enabled: v })} />
        <PayRow icon="📦" label="Pagamento na retirada" checked={s.pickup_payment_enabled} onChange={(v) => setS({ ...s, pickup_payment_enabled: v })} />
      </Card>

      {/* Card 2 — installments */}
      {s.credit_card_enabled && (
        <Card title="Parcelamento">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Oferecer parcelamento</span>
            <Switch checked={s.installments_enabled} onCheckedChange={(v) => setS({ ...s, installments_enabled: v })} />
          </div>
          {s.installments_enabled && (
            <div className="mt-3 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <Label className="text-xs">Número máximo de parcelas</Label>
                <Select
                  value={String(s.max_installments)}
                  onValueChange={(v) => setS({ ...s, max_installments: Number(v) })}
                >
                  <SelectTrigger className="mt-1 max-w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Parcelamento sem juros</span>
                <Switch checked={s.installments_no_interest} onCheckedChange={(v) => setS({ ...s, installments_no_interest: v })} />
              </div>
              {s.installments_no_interest && (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-[#6b7280]">
                  As parcelas serão calculadas automaticamente dividindo o valor total.
                </p>
              )}
              <div>
                <Label className="text-xs">Valor mínimo da parcela</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={s.min_installment_value}
                  onChange={(e) => setS({ ...s, min_installment_value: Number(e.target.value) })}
                  placeholder="R$ 10,00"
                  className="mt-1 max-w-[160px]"
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Card 3 — preview */}
      <Card title="Prévia do checkout">
        <p className="mb-3 text-xs text-[#6b7280]">Exemplo com produto de R$ 199,90</p>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <p className="mb-2 font-semibold text-[#111827]">Como você quer pagar?</p>
          {s.pix_enabled && (
            <PreviewOption label={
              <>PIX — <strong>R$ {pixPrice.toFixed(2).replace(".", ",")}</strong>
              {pixDiscountEnabled && (s.pix_discount_percent || 5) > 0 && (
                <span className="ml-1 text-[#15803d]">({s.pix_discount_percent || 5}% de desconto)</span>
              )}</>
            } />
          )}
          {s.credit_card_enabled && (
            <PreviewOption label={
              s.installments_enabled
                ? <>Cartão de crédito — até <strong>{s.max_installments}x de R$ {(previewPrice / s.max_installments).toFixed(2).replace(".", ",")}</strong> {s.installments_no_interest ? "sem juros" : ""}</>
                : <>Cartão de crédito</>
            } />
          )}
          {s.cash_enabled && <PreviewOption label="Dinheiro na entrega" />}
          {s.pickup_payment_enabled && <PreviewOption label="Pagamento na retirada" />}
          {!s.pix_enabled && !s.credit_card_enabled && !s.cash_enabled && !s.pickup_payment_enabled && (
            <p className="text-xs text-[#9ca3af]">Ative pelo menos uma forma de pagamento.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-base font-semibold text-[#111827]">{title}</h2>
      {children}
    </section>
  );
}

function PayRow({
  icon, label, checked, onChange, children,
}: { icon: string; label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {children}
    </div>
  );
}

function PreviewOption({ label }: { label: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-[#374151]">
      <input type="radio" disabled className="accent-[#25d366]" />
      <span>{label}</span>
    </label>
  );
}
