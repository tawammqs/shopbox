import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStorefront, useIsMioTheme } from "./StoreContext";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { discountPct, effectivePrice, formatBRL } from "@/lib/format";
import { trackAddToCart } from "@/lib/tracking";
import type { ProductCardData } from "@/lib/storefront";
import { getInstallment } from "@/lib/installments";
import { cn } from "@/lib/utils";

export function ProductCard({ p }: { p: ProductCardData }) {
  const { store } = useStorefront();
  const isMio = useIsMioTheme();
  const wished = useWishlist((s) => s.has(p.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const addItem = useCart((s) => s.addItem);

  const [hover, setHover] = useState(false);
  const price = effectivePrice(p.price, p.promo_price);
  const pct = discountPct(p.price, p.promo_price);
  const img1 = p.images[0]?.url ?? "";
  const img2 = p.images[1]?.url ?? img1;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    // If product has color or size, just go to PDP
    if (p.colors.length > 0) {
      window.location.href = `/loja/${store.slug}/produto/${p.slug}`;
      return;
    }
    addItem({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      image: img1,
      colorId: null,
      colorName: null,
      sizeId: null,
      sizeLabel: null,
      unitPrice: price,
      quantity: 1,
      storeId: store.id,
    });
    void trackAddToCart(store, { id: p.id, title: p.title, value: price, quantity: 1 });
    toast.success("Adicionado ao carrinho");
  };

  const containStores = ["dona-aranha", "donaranha"];
  const useContain = containStores.includes(store.slug);
  const imgFit = useContain ? "object-contain" : "object-cover";
  const imgPadding = useContain ? "p-2" : "p-0";
  const containerBg = useContain ? "bg-white" : "bg-transparent";
  const containerAspect = useContain ? "aspect-square" : "aspect-[4/5]";

  return (
    <Link
      to="/loja/$slug/produto/$productSlug"
      params={{ slug: store.slug, productSlug: p.slug }}
      className="group relative block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={cn("relative overflow-hidden rounded-xl", containerAspect, containerBg)}>
        {img1 && (
          <img
            src={img1}
            alt={p.title}
            loading="lazy"
            className={cn("h-full w-full transition duration-500", imgFit, imgPadding, hover && img2 !== img1 && "opacity-0")}
          />
        )}
        {img2 && img2 !== img1 && (
          <img
            src={img2}
            alt=""
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full opacity-0 transition duration-500",
              imgFit,
              imgPadding,
              hover && "opacity-100",
            )}
          />
        )}

        {/* badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {pct > 0 && (
            <span className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground">
              -{pct}%
            </span>
          )}
          {p.tags.includes("lancamentos") && (
            <span className="rounded-md bg-accent/95 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
              Novo
            </span>
          )}
        </div>

        {/* wish */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWish(p.id);
            toast.success(wished ? "Removido da lista" : "Adicionado à lista");
          }}
          aria-label="Favoritar"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow transition hover:bg-background"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-destructive text-destructive")} />
        </button>

        {/* quick add (desktop) */}
        <button
          type="button"
          onClick={quickAdd}
          className={cn(
            "absolute inset-x-2 bottom-2 hidden items-center justify-center gap-2 rounded-full bg-foreground py-2 text-xs font-semibold text-background opacity-0 shadow transition group-hover:opacity-100 md:flex",
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {p.colors.length > 0 ? "Escolher opções" : "Adicionar"}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {p.brand && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{p.title}</h3>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatBRL(price)}</span>
          {pct > 0 && <span className="text-xs text-muted-foreground line-through">{formatBRL(p.price)}</span>}
        </div>
        {store.slug === "the-shoes" && (() => {
          const inst = getInstallment(p.price, p.promo_price);
          if (!inst.show) return null;
          return (
            <span style={{
              display: 'block',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 400,
              color: '#aaa',
              marginTop: '2px',
              lineHeight: 1.3,
            }}>
              3x de {inst.formatted} sem juros
            </span>
          );
        })()}

        {p.colors.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            {p.colors.slice(0, 4).map((c) => (
              <span
                key={c.id}
                title={c.name}
                className="h-3.5 w-3.5 rounded-full border border-border"
                style={{ background: c.hex }}
              />
            ))}
            {p.colors.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{p.colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
