import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStorefront, useIsMioTheme } from "./StoreContext";
import { useStorefrontCustomizations } from "./StorefrontCustomizer";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { comparePrice, formatBRL } from "@/lib/format";
import { useProductPromo } from "@/lib/promotions";
import { PromoTimer } from "@/components/storefront/PromoTimer";
import { trackAddToCart } from "@/lib/tracking";
import type { ProductCardData } from "@/lib/storefront";
import { getInstallment } from "@/lib/installments";
import { useColorGroups } from "@/lib/color-groups";
import { VariantSwatch, CardRating } from "@/components/storefront/ProductCardVariants";
import { cn } from "@/lib/utils";
import { AffiliateShareButton } from "@/components/storefront/AffiliateShare";

export function ProductCard({ p }: { p: ProductCardData }) {
  const { store, paymentSettings } = useStorefront();
  const { data: cust } = useStorefrontCustomizations(store.id);
  const quickBuyEnabled = cust?.productList?.quickBuy !== false;
  const showColors = cust?.productList?.showColorVariations !== false;
  const isMio = useIsMioTheme();
  const wished = useWishlist((s) => s.has(p.id));
  const toggleWish = useWishlist((s) => s.toggle);
  const addItem = useCart((s) => s.addItem);

  const [hover, setHover] = useState(false);
  const { map: groupMap } = useColorGroups(store.id);
  const group = groupMap[p.id];
  const [variantIdx, setVariantIdx] = useState(() => Math.max(0, group?.product_ids?.indexOf(p.id) ?? 0));
  const idx = group ? Math.min(variantIdx, (group.product_ids?.length ?? 1) - 1) : 0;
  const isBaseVariant = !group || group.product_ids[idx] === p.id;
  const targetSlug = group ? (group.product_slugs?.[idx] ?? p.slug) : p.slug;
  const groupImage = group ? group.first_images?.[idx] || "" : "";

  const promo = useProductPromo(store.id, p);
  const price = promo.price;
  const { struck, pct } = comparePrice(p, price);
  const img1 = (isBaseVariant ? p.images[0]?.url : groupImage) || groupImage || p.images[0]?.url || "";
  const img2 = isBaseVariant ? (p.images[1]?.url ?? img1) : img1;


  const pixPrice =
    paymentSettings?.pix_enabled && paymentSettings.pix_discount_percent > 0
      ? price * (1 - paymentSettings.pix_discount_percent / 100)
      : null;
  const installmentInfo = (() => {
    const ps = paymentSettings;
    if (!ps?.credit_card_enabled || !ps.installments_enabled) return null;
    const n = ps.max_installments || 3;
    const value = price / n;
    if (value < (ps.min_installment_value || 0)) return null;
    return { n, value, noInterest: ps.installments_no_interest };
  })();


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
      params={{ slug: store.slug, productSlug: targetSlug }}
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
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-destructive-foreground"
              style={{ background: "var(--store-badge, hsl(var(--destructive)))" }}
            >
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
        <AffiliateShareButton productSlug={targetSlug} />

        {/* quick add (desktop) */}
        {quickBuyEnabled && (
          <button
            type="button"
            onClick={quickAdd}
            className={cn(
              "absolute inset-x-2 bottom-2 hidden items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold opacity-0 shadow transition group-hover:opacity-100 md:flex",
            )}
            style={{
              background: "var(--store-btn-bg, hsl(var(--foreground)))",
              color: "var(--store-btn-text, hsl(var(--background)))",
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {p.colors.length > 0 ? "Escolher opções" : "Adicionar"}
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {p.brand && <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-medium text-foreground">{group ? group.model_name : p.title}</h3>
          <AffiliateShareButton productSlug={targetSlug} variant="text" />
        </div>
        <CardRating storeId={store.id} productId={p.id} productIds={group?.product_ids} />

        {group && group.colors.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {group.colors.slice(0, 3).map((color, i) => (
              <VariantSwatch
                key={group.product_ids[i]}
                colorName={color}
                imageUrl={group.first_images?.[i]}
                active={i === idx}
                onSelect={() => setVariantIdx(i)}
                className="h-5 w-5"
              />
            ))}
            {group.colors.length > 3 && (
              <span className="self-center text-[10px] text-muted-foreground">+{group.colors.length - 3}</span>
            )}
          </div>
        )}



        <div className="flex items-baseline gap-2">
          <span className={cn("text-base font-bold", promo.hasTimedPromo ? "text-red-500" : "text-foreground")}>{formatBRL(price)}</span>
          {struck && <span className="text-xs text-muted-foreground line-through">{formatBRL(struck)}</span>}
        </div>
        {promo.hasTimedPromo && promo.promotion?.ends_at && (
          <PromoTimer endsAt={promo.promotion.ends_at} label={promo.promotion.timer_label} onExpire={promo.onExpire} />
        )}
        {isMio ? (
          (() => {
            const inst = getInstallment(p.price, price);
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
          })()
        ) : (
          <div className="mt-1 space-y-0.5 text-xs">
            {pixPrice && (
              <p className="font-medium text-emerald-600">
                {formatBRL(pixPrice)} no PIX
                <span className="ml-1 rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700">
                  -{paymentSettings!.pix_discount_percent}%
                </span>
              </p>
            )}
            {installmentInfo && (
              <p className="text-muted-foreground">
                {installmentInfo.n}x de {formatBRL(installmentInfo.value)}
                {installmentInfo.noInterest ? " sem juros" : ""}
              </p>
            )}
          </div>
        )}

        {showColors && p.colors.length > 0 && (
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
