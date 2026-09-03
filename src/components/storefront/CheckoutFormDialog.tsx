import { useState } from "react";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart, type CartItem, type AppliedCoupon } from "@/stores/cart";
import { useStorefront, useIsMioTheme } from "./StoreContext";
import { buildCheckoutMessage, buildBuyNowMessage, type CustomerInfo } from "@/lib/whatsapp";
import { SalesTeamSelector, useSalesTeamSelector } from "./SalesTeamSelector";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { maskPhoneBR, maskCPF, maskCEP, onlyDigits } from "@/lib/masks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackPurchase } from "@/lib/tracking";
import { clearPendingAffiliateRef, getPendingAffiliateRef, registerAffiliateSale } from "@/lib/affiliates";


const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  whatsapp: z.string().trim().min(8, "WhatsApp inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  cpf: z.string().trim().max(20).optional().or(z.literal("")),
  cep: z.string().trim().max(12).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city_state: z.string().trim().max(120).optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "Selecione uma forma de pagamento").optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  coupon: AppliedCoupon;
  total: number;
  /** When set, sends a "buy now" single-product message instead of the full cart message and skips clearing the cart. */
  buyNow?: {
    productTitle: string;
    productSlug: string;
    productUrl: string;
    colorName?: string | null;
    sizeLabel?: string | null;
    quantity: number;
    unitPrice: number;
  };
};

export function CheckoutFormDialog({ open, onClose, items, subtotal, coupon, total, buyNow }: Props) {
  const { store, paymentSettings } = useStorefront();
  const clearCart = useCart((s) => s.clear);

  const isTheShoes = useIsMioTheme();

  // Build dynamic payment options from store settings
  const paymentOptions = (() => {
    const ps = paymentSettings;
    const opts: { value: string; label: string }[] = [];
    if (!ps) {
      // sensible fallback so checkout never breaks
      opts.push({ value: "pix", label: "PIX" });
      opts.push({ value: "cartao", label: "Cartão de crédito" });
      return opts;
    }
    if (ps.pix_enabled) {
      opts.push({
        value: "pix",
        label: ps.pix_discount_percent > 0 ? `PIX (${ps.pix_discount_percent}% de desconto)` : "PIX",
      });
    }
    if (ps.credit_card_enabled) {
      const label = ps.installments_enabled
        ? `Cartão de crédito (até ${ps.max_installments}x${ps.installments_no_interest ? " sem juros" : ""})`
        : "Cartão de crédito";
      opts.push({ value: "cartao", label });
    }
    if (ps.cash_enabled) opts.push({ value: "dinheiro", label: "Dinheiro na entrega" });
    if (ps.pickup_payment_enabled) opts.push({ value: "retirada", label: "Pagamento na retirada" });
    return opts;
  })();

  const requirePayment = paymentOptions.length > 0;

  const [form, setForm] = useState({
    name: "", whatsapp: "", email: "", cpf: "", cep: "", address: "", city_state: "", paymentMethod: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const selector = useSalesTeamSelector();

  if (!open) return null;

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const updateMasked = (k: keyof typeof form, mask: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: mask(e.target.value) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (k && !errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      return;
    }
    if (requirePayment && !form.paymentMethod) {
      setErrors({ ...errors, paymentMethod: "Selecione uma forma de pagamento" });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const itemsSnapshot = items.map((i) => ({
        product_id: i.productId,
        slug: i.slug,
        title: i.title,
        image: i.image,
        color: i.colorName,
        size: i.sizeLabel,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        line_total: i.unitPrice * i.quantity,
      }));

      const { data: orderRes, error } = await supabase.rpc("create_order_with_customer", {
        _store_id: store.id,
        _name: form.name.trim(),
        _whatsapp: onlyDigits(form.whatsapp),
        _email: form.email.trim(),
        _cpf: form.cpf.trim(),
        _cep: form.cep.trim(),
        _address: form.address.trim(),
        _city_state: form.city_state.trim(),
        _items: itemsSnapshot as any,
        _subtotal: subtotal,
        _discount: coupon?.discount ?? 0,
        _coupon_code: coupon?.code ?? "",
        _promotion_description: "",
        _total: total,
      });

      if (error) throw error;

      // Affiliate attribution (link /produto/[slug]/[affiliate] or ?ref=) — best-effort
      let affiliateName: string | null = null;
      const affiliateSlug = store.affiliates_enabled ? getPendingAffiliateRef(store.slug) : null;
      if (affiliateSlug) {
        try {
          const orderId = (Array.isArray(orderRes) ? orderRes[0]?.order_id : (orderRes as any)?.order_id) ?? null;
          affiliateName = await registerAffiliateSale({
            storeId: store.id,
            affiliateSlug,
            orderId,
            orderTotal: total,
            customerName: form.name.trim(),
            items: itemsSnapshot,
          });
        } catch {
          // ignore
        }
      }

      // Increment coupon usage counter (best-effort, non-blocking)
      if (coupon?.code) {
        try {
          const { data: c } = await supabase
            .from("coupons")
            .select("id, uses_count")
            .eq("store_id", store.id)
            .ilike("code", coupon.code)
            .maybeSingle();
          if (c?.id) {
            await supabase
              .from("coupons")
              .update({ uses_count: (c.uses_count ?? 0) + 1 })
              .eq("id", c.id);
          }
        } catch {
          // ignore
        }
      }

      const customer: CustomerInfo = {
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email,
        cpf: form.cpf,
        cep: form.cep,
        address: form.address,
        city_state: form.city_state,
        paymentMethod: requirePayment ? form.paymentMethod : undefined,
      };

      // Meta Pixel / GA4 / CAPI — WhatsApp checkout has no payment callback,
      // so the confirmed order is the closest equivalent to a Purchase.
      void trackPurchase(store, {
        ids: buyNow ? [buyNow.productSlug] : items.map((i) => i.productId),
        numItems: buyNow ? buyNow.quantity : items.reduce((s, i) => s + i.quantity, 0),
        value: total,
      });

      let msg: string;
      if (buyNow) {
        // Buy-now: send single-product message and DO NOT clear cart
        msg = buildBuyNowMessage({
          title: buyNow.productTitle,
          colorName: buyNow.colorName,
          sizeLabel: buyNow.sizeLabel,
          quantity: buyNow.quantity,
          unitPrice: buyNow.unitPrice,
          productUrl: buyNow.productUrl,
          greeting: store.whatsapp_greeting,
          customer,
          affiliateName,
        });
      } else {
        // Cart checkout
        msg = buildCheckoutMessage(items, subtotal, coupon, total, store.whatsapp_greeting, customer, affiliateName);
        clearCart();
      }
      // The message is unchanged; only the destination number is picked by the customer.
      selector.open(msg);
      if (affiliateSlug) clearPendingAffiliateRef();
      toast.success("Pedido registrado! Escolha com quem falar no WhatsApp.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao registrar pedido");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-lg bg-background shadow-2xl",
          "rounded-t-2xl sm:rounded-2xl",
          "max-h-[92vh] overflow-y-auto",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Seus dados</h2>
            <p className="text-xs text-muted-foreground">
              Para finalizar pelo WhatsApp e a loja conseguir te atender melhor.
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4">
          <Field label="Nome completo *" error={errors.name}>
            <Input value={form.name} onChange={update("name")} autoFocus required />
          </Field>
          <Field label="WhatsApp *" error={errors.whatsapp}>
            <Input
              value={form.whatsapp}
              onChange={updateMasked("whatsapp", maskPhoneBR)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              required
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={update("email")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF" error={errors.cpf}>
              <Input
                value={form.cpf}
                onChange={updateMasked("cpf", maskCPF)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </Field>
            <Field label="CEP" error={errors.cep}>
              <Input
                value={form.cep}
                onChange={updateMasked("cep", maskCEP)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </Field>
          </div>
          <Field label="Endereço" error={errors.address}>
            <Input value={form.address} onChange={update("address")} placeholder="Rua, número, bairro" />
          </Field>
          <Field label="Cidade / Estado" error={errors.city_state}>
            <Input value={form.city_state} onChange={update("city_state")} placeholder="São Paulo / SP" />
          </Field>

          {requirePayment && (
            isTheShoes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '6px'
                }}>
                  Forma de pagamento *
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={update("paymentMethod")}
                  required
                  style={{
                    width: '100%',
                    height: '52px',
                    border: errors.paymentMethod ? '1px solid #ef4444' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0 16px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '15px',
                    color: form.paymentMethod ? '#111' : '#aaa',
                    background: '#fff',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center'
                  }}
                >
                  <option value="" disabled>Selecione a forma de pagamento</option>
                  {paymentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.paymentMethod && (
                  <p className="text-xs text-destructive">{errors.paymentMethod}</p>
                )}
              </div>
            ) : (
              <Field label="Forma de pagamento *" error={errors.paymentMethod}>
                <select
                  value={form.paymentMethod}
                  onChange={update("paymentMethod")}
                  required
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-accent"
                >
                  <option value="" disabled>Selecione a forma de pagamento</option>
                  {paymentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </Field>
            )
          )}


          <Button
            type="submit"
            disabled={busy}
            className="mt-2 h-12 w-full bg-[#25d366] text-white hover:bg-[#20bd5a]"
          >
            {busy ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</>
            ) : (
              <><WhatsAppIcon className="h-5 w-5" /> Confirmar e falar no WhatsApp</>
            )}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Seus dados ficam salvos só na loja, para o lojista te atender.
          </p>
        </form>
      </div>

      {selector.pending && (
        <SalesTeamSelector
          storeId={store.id}
          cartMessage={selector.pending.message}
          fallbackNumber={store.whatsapp}
          onClose={() => {
            selector.close();
            onClose();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
