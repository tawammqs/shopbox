import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ShoppingBag, Trash2, Tag, Truck } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useCart, type AppliedCoupon } from "@/stores/cart";
import { useStorefront, useIsMioTheme } from "./StoreContext";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { fetchActiveCoupon } from "@/lib/storefront";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { CheckoutFormDialog } from "./CheckoutFormDialog";
import { trackInitiateCheckout } from "@/lib/tracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { store } = useStorefront();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const allItems = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const coupon = useCart((s) => s.coupon);
  const setCoupon = useCart((s) => s.setCoupon);

  const items = useMemo(() => allItems.filter((i) => i.storeId === store.id), [allItems, store.id]);
  const subtotal = useMemo(() => items.reduce((a, b) => a + b.unitPrice * b.quantity, 0), [items]);

  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [cep, setCep] = useState("");
  const [shippingMsg, setShippingMsg] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const isTheShoes = store.slug === "the-shoes";
  const tsSettingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    enabled: isTheShoes,
    staleTime: 30_000,
  });
  const upsellThreshold = isTheShoes ? tsSettingsQ.data?.cart_upsell_threshold ?? 0 : 0;
  const upsellMessage = isTheShoes ? tsSettingsQ.data?.cart_upsell_message ?? "" : "";

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setValidating(true);
    try {
      const c = await fetchActiveCoupon(store.id, code);
      if (!c) {
        toast.error("Cupom inválido ou expirado");
        setCoupon(null);
        return;
      }
      if (subtotal < Number(c.min_cart)) {
        toast.error(`Cupom requer pedido mínimo de ${formatBRL(Number(c.min_cart))}`);
        return;
      }
      const value = Number(c.value);
      const discount = c.type === "percent" ? subtotal * (value / 100) : value;
      const applied: AppliedCoupon = {
        code: c.code,
        type: c.type as "percent" | "fixed",
        value,
        discount: Math.min(discount, subtotal),
      };
      setCoupon(applied);
      toast.success(`Cupom aplicado: -${formatBRL(applied.discount)}`);
    } catch (e) {
      toast.error("Erro ao validar cupom");
    } finally {
      setValidating(false);
    }
  };

  const checkCep = () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setShippingMsg(null);
      toast.error("CEP inválido");
      return;
    }
    setShippingMsg("Frete a combinar pelo WhatsApp");
  };

  const total = Math.max(0, subtotal - (coupon?.discount ?? 0));

  const checkout = () => {
    if (items.length === 0) return;
    void trackInitiateCheckout(store, {
      ids: items.map((i) => i.productId),
      numItems: items.reduce((s, i) => s + i.quantity, 0),
      value: total,
    });
    setCheckoutOpen(true);
  };

  return (
    <>
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShoppingBag className="h-5 w-5" /> Seu carrinho
          </h2>
          <button onClick={close} aria-label="Fechar" className="rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold">Seu carrinho está vazio</h3>
            <p className="text-sm text-muted-foreground">Que tal dar uma olhada nos nossos produtos?</p>
            <Button onClick={close} className="mt-2">
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isTheShoes && upsellThreshold > 0 && (
                <TheShoesUpsell subtotal={subtotal} threshold={upsellThreshold} message={upsellMessage} />
              )}
              <ul className="space-y-4">
                {items.map((i) => (
                  <li key={`${i.productId}-${i.colorId}-${i.sizeId}`} className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="line-clamp-2 text-sm font-medium">{i.title}</h4>
                        <button
                          aria-label="Remover"
                          onClick={() => removeItem(i.productId, i.colorId, i.sizeId)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {(i.colorName || i.sizeLabel) && (
                        <p className="text-xs text-muted-foreground">
                          {i.colorName}
                          {i.colorName && i.sizeLabel ? " · " : ""}
                          {i.sizeLabel}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-md border border-input">
                          <button
                            onClick={() => updateQty(i.productId, i.colorId, i.sizeId, i.quantity - 1)}
                            className="px-2 py-1 text-sm hover:bg-muted"
                          >
                            −
                          </button>
                          <span className="min-w-[2ch] text-center text-sm">{i.quantity}</span>
                          <button
                            onClick={() => updateQty(i.productId, i.colorId, i.sizeId, i.quantity + 1)}
                            className="px-2 py-1 text-sm hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-semibold">{formatBRL(i.unitPrice * i.quantity)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Coupon */}
              <div className="mt-6 rounded-lg border border-border p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Tag className="h-3 w-3" /> Cupom
                </label>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="BEMVINDO10"
                    className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm uppercase outline-none focus:border-accent"
                  />
                  <Button size="sm" variant="outline" onClick={applyCoupon} disabled={validating}>
                    {validating ? "..." : "Aplicar"}
                  </Button>
                </div>
                {coupon && (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent">
                      {coupon.code} aplicado
                    </span>
                    <button
                      onClick={() => setCoupon(null)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      remover
                    </button>
                  </div>
                )}
              </div>

              {/* CEP */}
              <div className="mt-3 rounded-lg border border-border p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Truck className="h-3 w-3" /> Calcular frete
                </label>
                <div className="flex gap-2">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-accent"
                  />
                  <Button size="sm" variant="outline" onClick={checkCep}>
                    OK
                  </Button>
                </div>
                {shippingMsg && <p className="mt-2 text-xs text-muted-foreground">{shippingMsg}</p>}
              </div>
            </div>

            <footer className="space-y-3 border-t border-border bg-muted/30 px-5 py-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatBRL(subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-accent">
                    <span>Desconto ({coupon.code})</span>
                    <span>−{formatBRL(coupon.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>
              <Button onClick={checkout} className="h-12 w-full bg-[#25d366] text-white hover:bg-[#20bd5a]">
                <WhatsAppIcon className="h-5 w-5" />
                Finalizar pelo WhatsApp
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Você será direcionado ao WhatsApp da loja com seu pedido pronto
              </p>
            </footer>
          </>
        )}
      </aside>

      <CheckoutFormDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        subtotal={subtotal}
        coupon={coupon}
        total={total}
      />
    </>
  );
}

function TheShoesUpsell({ subtotal, threshold, message }: { subtotal: number; threshold: number; message: string }) {
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  const achieved = remaining === 0;
  return (
    <div className="mb-4 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-3">
      <p className="text-xs font-medium text-[#111]">
        {achieved ? "🎉 Você ganhou frete grátis!" : (
          <>Faltam <strong>{formatBRL(remaining)}</strong> para {message || "frete grátis"}</>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#25D366]/15">
        <div
          className="h-full rounded-full bg-[#25D366] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
