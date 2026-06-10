import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X, Lock } from "lucide-react";
import { useCart } from "@/stores/cart";
import { useStorefront } from "../StoreContext";
import { formatBRL, effectivePrice, discountPct } from "@/lib/format";
import { fetchBestSellersForStore, type ProductCardData } from "@/lib/storefront";
import { fetchTheShoesSettings } from "@/lib/the-shoes-theme";
import { CheckoutFormDialog } from "../CheckoutFormDialog";
import { trackAddToCart, trackInitiateCheckout } from "@/lib/tracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCENT = "#c0392b";

export function TheShoesCartDrawer() {
  const { store } = useStorefront();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const allItems = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const removeItem = useCart((s) => s.removeItem);
  const addItem = useCart((s) => s.addItem);
  const coupon = useCart((s) => s.coupon);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const items = useMemo(() => allItems.filter((i) => i.storeId === store.id), [allItems, store.id]);
  const subtotal = useMemo(() => items.reduce((a, b) => a + b.unitPrice * b.quantity, 0), [items]);
  const total = Math.max(0, subtotal - (coupon?.discount ?? 0));
  const cartCount = items.reduce((a, b) => a + b.quantity, 0);

  const settingsQ = useQuery({
    queryKey: ["the-shoes-settings", store.id],
    queryFn: () => fetchTheShoesSettings(store.id),
    staleTime: 30_000,
  });
  const upsellThreshold = settingsQ.data?.cart_upsell_threshold ?? 0;
  const upsellMessage = settingsQ.data?.cart_upsell_message ?? "frete grátis";

  const bestSellersQ = useQuery({
    queryKey: ["ts-bestsellers", store.id],
    queryFn: () => fetchBestSellersForStore(store.id, 8),
    staleTime: 60_000,
    enabled: isOpen,
  });
  const bestSellers = (bestSellersQ.data ?? []).filter(
    (p) => !items.some((i) => i.productId === p.id),
  );

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const pct = upsellThreshold > 0 ? Math.min(100, (subtotal / upsellThreshold) * 100) : 0;
  const remaining = Math.max(0, upsellThreshold - subtotal);
  const reachedUpsell = upsellThreshold > 0 && subtotal >= upsellThreshold;

  const addCrossSell = (p: ProductCardData) => {
    if (p.colors.length > 0) {
      window.location.href = `/loja/${store.slug}/produto/${p.slug}`;
      return;
    }
    const price = effectivePrice(p.price, p.promo_price);
    const img = p.images[0]?.url ?? "";
    addItem({
      productId: p.id, slug: p.slug, title: p.title, image: img,
      colorId: null, colorName: null, sizeId: null, sizeLabel: null,
      unitPrice: price, quantity: 1, storeId: store.id,
    });
    void trackAddToCart(store, { id: p.id, title: p.title, value: price, quantity: 1 });
    toast.success("Adicionado ao carrinho");
  };

  const checkout = () => {
    if (items.length === 0) return;
    void trackInitiateCheckout(store, {
      ids: items.map((i) => i.productId),
      numItems: cartCount,
      value: total,
    });
    setCheckoutOpen(true);
  };

  return (
    <>
      <div onClick={close}
        className={cn("fixed inset-0 z-50 bg-black/50 transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0")} />
      <aside className={cn("ts-cart fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform",
        isOpen ? "translate-x-0" : "translate-x-full")}>

        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-[#111]">Carrinho</h2>
            {cartCount > 0 && (
              <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{ background: ACCENT }}>{cartCount}</span>
            )}
          </div>
          <button onClick={close} aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-[#333] hover:bg-[#f5f5f5]">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-[48px]">🛍️</div>
            <h3 className="text-[18px] font-bold text-[#111]">Seu carrinho está vazio</h3>
            <p className="text-[13px] text-[#666]">Adicione produtos para continuar</p>
            <button onClick={close}
              className="mt-2 rounded-md px-5 py-2 text-sm font-semibold text-white"
              style={{ background: ACCENT }}>Continuar comprando</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {/* Items */}
              <ul>
                {items.map((i) => (
                  <li key={`${i.productId}-${i.colorId}-${i.sizeId}`}
                    className="flex gap-4 border-b border-[#f5f5f5] py-4">
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#f5f5f5]">
                      {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h4 className="line-clamp-2 text-[14px] font-semibold text-[#111]">{i.title}</h4>
                      {(i.colorName || i.sizeLabel) && (
                        <p className="mt-1 text-[12px] text-[#aaa]">
                          {i.colorName}{i.colorName && i.sizeLabel ? " · " : ""}{i.sizeLabel}
                        </p>
                      )}
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <div className="inline-flex items-center rounded-md border border-[#e0e0e0]">
                          <button onClick={() => updateQty(i.productId, i.colorId, i.sizeId, i.quantity - 1)}
                            className="px-2 py-1 text-sm text-[#333] hover:bg-[#f5f5f5]">−</button>
                          <span className="min-w-[2ch] text-center text-sm text-[#111]">{i.quantity}</span>
                          <button onClick={() => updateQty(i.productId, i.colorId, i.sizeId, i.quantity + 1)}
                            className="px-2 py-1 text-sm text-[#333] hover:bg-[#f5f5f5]">+</button>
                        </div>
                        <div className="text-right">
                          <div className="text-[15px] font-bold text-[#111]">{formatBRL(i.unitPrice * i.quantity)}</div>
                          <button onClick={() => removeItem(i.productId, i.colorId, i.sizeId)}
                            className="mt-1 text-[12px] text-[#aaa] underline hover:text-[#c0392b]">
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Cross-sell */}
              {bestSellers.length > 0 && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-[#111]">
                      Compre junto os nossos Best-Sellers ✨
                    </h3>
                  </div>
                  <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
                    style={{ scrollbarWidth: "thin" }}>
                    {bestSellers.slice(0, 6).map((p) => {
                      const price = effectivePrice(p.price, p.promo_price);
                      const dpct = discountPct(p.price, p.promo_price);
                      const img = p.images[0]?.url ?? "";
                      return (
                        <div key={p.id}
                          className="flex w-[260px] shrink-0 items-center gap-3 rounded-[10px] p-3"
                          style={{ background: "#f3f3f3" }}>

                          <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-md bg-white">
                            {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[12px] font-semibold leading-tight text-[#111]">{p.title}</p>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-[12px] font-bold text-[#c0392b]">{formatBRL(price)}</span>
                              {dpct > 0 && (
                                <span className="text-[10px] text-[#aaa] line-through">{formatBRL(p.price)}</span>
                              )}
                            </div>
                            <button onClick={() => addCrossSell(p as ProductCardData)}
                              className="mt-2 rounded-md bg-[#f0f0f0] px-3 py-1 text-[11px] font-semibold text-[#333] hover:bg-[#e0e0e0]">
                              Eu quero
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shipping info note */}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f8f8f8] px-4 py-3">
                <span className="text-base">🚚</span>
                <p className="text-[12px] text-[#666]">
                  O frete será combinado pelo WhatsApp após a finalização do pedido.
                </p>
              </div>
            </div>

            <footer className="border-t border-[#f0f0f0] bg-white px-5 py-4">
              {/* Progress bar */}
              {upsellThreshold > 0 && (
                <div className="mb-4 rounded-[10px] bg-[#f8f8f8] p-4">
                  <div className="relative mb-2 h-[6px] rounded-full bg-[#e0e0e0]">
                    <div className="absolute -top-5 -translate-x-1/2 text-[20px] transition-all duration-500"
                      style={{ left: `${Math.min(pct, 95)}%` }}>🚚</div>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: "#25D366" }} />
                  </div>
                  <p className="text-center text-[12px] text-[#555]">
                    {reachedUpsell ? (
                      <>🎉 <strong>{upsellMessage}</strong> desbloqueado!</>
                    ) : (
                      <>Gaste <strong>{formatBRL(remaining)}</strong> a mais para <strong>{upsellMessage}</strong></>
                    )}
                  </p>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between py-2">
                <span className="text-[15px] font-semibold text-[#111]">Total</span>
                <span className="text-[15px] font-bold text-[#111]">{formatBRL(total)}</span>
              </div>

              <button onClick={checkout}
                className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-lg text-[15px] font-bold text-white hover:opacity-95"
                style={{ background: ACCENT }}>
                <Lock className="h-4 w-4" />
                Finalizar compra
              </button>
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

      <style>{`
        .ts-cart, .ts-cart * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }
      `}</style>
    </>
  );
}
