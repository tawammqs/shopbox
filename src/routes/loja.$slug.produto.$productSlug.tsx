import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import { fetchProductFull, fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { supabase } from "@/integrations/supabase/client";
import { discountPct, effectivePrice, formatBRL } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { trackViewContent, trackAddToCart } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { buildShareProductMessage } from "@/lib/whatsapp";
import { ProductRow } from "@/components/storefront/ProductRow";
import { CheckoutFormDialog } from "@/components/storefront/CheckoutFormDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { VideoPreview } from "@/components/admin/VideoSourcePicker";
import type { VideoType } from "@/lib/video";

export const Route = createFileRoute("/loja/$slug/produto/$productSlug")({
  component: ProductPage,
});

function ProductPage() {
  const { store } = useStorefront();
  const { productSlug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["product", store.id, productSlug],
    queryFn: () => fetchProductFull(store.id, productSlug),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.id) {
      supabase.rpc("increment_product_view", { _product_id: data.id }).then(() => {});
    }
  }, [data?.id]);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl animate-pulse px-4 py-10"><div className="h-96 rounded-xl bg-muted" /></div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Produto não encontrado</h1>
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="mt-4 inline-block text-accent">Voltar</Link>
      </div>
    );
  }

  return <ProductInner product={data} />;
}

function ProductInner({ product }: { product: any }) {
  const { store } = useStorefront();
  const addItem = useCart((s) => s.addItem);
  const wished = useWishlist((s) => s.has(product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  const images: { id: string; url: string; position: number }[] = (product.product_images ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const colors: { id: string; name: string; hex: string }[] = (product.product_colors ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const sizes: { id: string; label: string }[] = (product.product_sizes ?? []).slice().sort((a: any, b: any) => a.position - b.position);
  const stock: { color_id: string | null; size_id: string | null; quantity: number }[] = product.product_stock ?? [];
  const reviews = (product.product_reviews ?? []).filter((r: any) => r.status === "approved");
  const videos = (product.product_video_testimonials ?? []).slice().sort((a: any, b: any) => a.position - b.position);

  const [imgIdx, setImgIdx] = useState(0);
  const [colorId, setColorId] = useState<string | null>(colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  const stockFor = (cId: string | null, sId: string | null) =>
    stock.filter((x) => (cId ? x.color_id === cId : true) && (sId ? x.size_id === sId : true)).reduce((a, b) => a + b.quantity, 0);

  const colorAvailable = (_cId: string) => true;
  const sizeAvailableForColor = (_sId: string) => true;

  const variantStock = stockFor(colorId, sizeId);
  const isOut = false;
  const lowStock = false;

  const price = effectivePrice(Number(product.price), product.promo_price ? Number(product.promo_price) : null);
  const pct = discountPct(Number(product.price), product.promo_price ? Number(product.promo_price) : null);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length;
  }, [reviews]);

  const colorName = colors.find((c) => c.id === colorId)?.name ?? null;
  const sizeLabel = sizes.find((s) => s.id === sizeId)?.label ?? null;

  const validate = () => {
    if (colors.length > 0 && !colorId) return "Selecione uma cor";
    if (sizes.length > 0 && !sizeId) return "Selecione um tamanho";
    return null;
  };

  const addToCart = () => {
    const err = validate();
    if (err) return toast.error(err);
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: images[0]?.url ?? "",
      colorId,
      colorName,
      sizeId,
      sizeLabel,
      unitPrice: price,
      quantity: qty,
      storeId: store.id,
    });
    void trackAddToCart(store, { id: product.id, title: product.title, value: price, quantity: qty });
    toast.success("Adicionado ao carrinho");
  };

  useEffect(() => {
    void trackViewContent(store, { id: product.id, title: product.title, value: price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const buyNow = () => {
    const err = validate();
    if (err) return toast.error(err);
    import("@/lib/tracking").then((m) =>
      m.trackInitiateCheckout(store, { ids: [product.id], numItems: qty, value: price * qty }),
    );
    setBuyNowOpen(true);
  };

  const share = () => {
    const url = `${window.location.origin}/loja/${store.slug}/produto/${product.slug}`;
    const msg = buildShareProductMessage({ title: product.title, price, productUrl: url });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const relatedQ = useQuery({
    queryKey: ["related", store.id, product.tags?.[0]],
    queryFn: () => fetchProductsByTag(store.id, product.tags?.[0] ?? "principal", 8),
    enabled: !!product.tags?.[0],
  });

  return (
    <>
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-accent">Início</Link>
        <span className="mx-2">/</span>
        <span className="break-words text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <div className="min-w-0">
          {(() => {
            const containStores = ["dona-aranha", "donaranha"];
            const useContain = containStores.includes(store.slug);
            const aspect = useContain ? "aspect-square" : "aspect-[4/5]";
            const fit = useContain ? "object-contain" : "object-cover";
            const padding = useContain ? "p-4" : "p-0";
            const bg = useContain ? "bg-white" : "bg-transparent";
            return (
              <>
                <div className={cn("flex items-center justify-center overflow-hidden rounded-xl border border-border", aspect, bg)}>
                  {images[imgIdx] && (
                    <img
                      src={images[imgIdx].url}
                      alt={product.title}
                      className={cn("h-full w-full", fit, padding)}
                    />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="mt-3 flex w-full max-w-full gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        onClick={() => setImgIdx(i)}
                        className={cn(
                          "h-20 w-20 shrink-0 overflow-hidden rounded-md border-2",
                          bg,
                          i === imgIdx ? "border-accent" : "border-border",
                        )}
                      >
                        <img src={img.url} alt="" className={cn("h-full w-full", fit, useContain ? "p-1" : "p-0")} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Info */}
        <div className="min-w-0 space-y-5">
          <div className="min-w-0">
            {product.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</p>}
            <h1 className="break-words font-display text-xl font-bold sm:text-3xl">{product.title}</h1>
            {product.sku && <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p>}
            {avgRating != null && (
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                <Stars value={avgRating} />
                <span className="text-muted-foreground">({reviews.length})</span>
              </div>
            )}
          </div>

          {/* trust badges */}
          {store.trust_badges.length > 0 && (
            <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              {store.trust_badges.slice(0, 4).map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> {b}
                </span>
              ))}
            </div>
          )}

          {/* price */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">{formatBRL(price)}</span>
              {pct > 0 && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatBRL(Number(product.price))}</span>
                  <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-{pct}%</span>
                </>
              )}
            </div>
            {pct > 0 && (
              <p className="mt-1 text-sm text-accent">
                Você economiza {formatBRL(Number(product.price) - price)}
              </p>
            )}
          </div>

          {/* colors */}
          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Cor: <span className="font-normal">{colorName}</span></p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const avail = colorAvailable(c.id);
                  const sel = c.id === colorId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setColorId(c.id); setSizeId(null); }}
                      title={c.name}
                      className={cn(
                        "h-10 w-10 rounded-full border-2 transition relative",
                        sel ? "border-accent" : "border-border",
                        !avail && "opacity-40",
                      )}
                      style={{ background: c.hex }}
                    >
                      {!avail && <span className="absolute inset-0 m-auto h-px w-[140%] rotate-45 bg-foreground/40" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const avail = colorId ? sizeAvailableForColor(s.id) : true;
                  const sel = s.id === sizeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => avail && setSizeId(s.id)}
                      disabled={!avail}
                      className={cn(
                        "min-w-[3rem] rounded-md border px-3 py-2 text-sm font-medium transition",
                        sel ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground",
                        !avail && "cursor-not-allowed line-through opacity-40",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* stock */}
          <div className="text-sm">
            {isOut ? (
              <span className="font-medium text-destructive">Esgotado</span>
            ) : lowStock ? (
              <span className="font-medium text-destructive">⚠️ Últimas {variantStock} unidades!</span>
            ) : (
              <span className="text-muted-foreground">Em estoque</span>
            )}
          </div>

          {/* qty + actions */}
          <div className="flex w-full max-w-full items-center gap-2 overflow-hidden">
            <div className="inline-flex shrink-0 items-center rounded-md border border-input">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted">−</button>
              <span className="min-w-[2.5ch] text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-muted">+</button>
            </div>
            <Button onClick={addToCart} disabled={isOut} className="h-12 min-w-0 flex-1 truncate px-2 text-sm sm:px-4 sm:text-base">
              <ShoppingBag className="h-4 w-4 shrink-0" /> <span className="truncate">Adicionar ao carrinho</span>
            </Button>
          </div>
          <Button onClick={buyNow} disabled={isOut} className="h-12 w-full max-w-full bg-[#25d366] px-2 text-sm text-white hover:bg-[#20bd5a] sm:text-base">
            <WhatsAppIcon className="h-5 w-5 shrink-0" /> <span className="truncate">Comprar agora pelo WhatsApp</span>
          </Button>

          <div className="flex w-full max-w-full gap-2 overflow-hidden">
            <button
              onClick={() => { toggleWish(product.id); toast.success(wished ? "Removido" : "Salvo na lista"); }}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 truncate rounded-md border border-border py-2 text-sm hover:bg-muted"
            >
              <Heart className={cn("h-4 w-4 shrink-0", wished && "fill-destructive text-destructive")} />
              <span className="truncate">{wished ? "Salvo" : "Favoritar"}</span>
            </button>
            <button
              onClick={share}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 truncate rounded-md border border-border py-2 text-sm hover:bg-muted"
            >
              <Share2 className="h-4 w-4 shrink-0" /> <span className="truncate">Compartilhar</span>
            </button>
          </div>

          {product.description && (
            <details className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer text-sm font-semibold">Descrição</summary>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
            </details>
          )}
        </div>
      </div>

      {/* Product video */}
      {product.video_url && product.video_type && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-bold">Veja em vídeo</h2>
          <div className="mx-auto max-w-3xl">
            <VideoPreview url={product.video_url} type={product.video_type as VideoType} />
          </div>
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-2xl font-bold">O que dizem nossos clientes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((v: any) => (
              <div key={v.id} className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-[9/16] bg-black">
                  {v.kind === "youtube" ? (
                    <iframe
                      src={v.video_url.replace("watch?v=", "embed/")}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={v.video_url} controls muted playsInline className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <Stars value={v.rating} />
                  {v.customer_name && <p className="mt-1 text-xs font-medium">{v.customer_name}</p>}
                  {v.quote && <p className="mt-1 text-xs text-muted-foreground">"{v.quote}"</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-2 font-display text-2xl font-bold">Avaliações</h2>
          {avgRating != null && (
            <div className="mb-5 flex items-center gap-2">
              <Stars value={avgRating} />
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} de 5 ({reviews.length} avaliações)</span>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 6).map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.customer_name}</p>
                  <Stars value={r.rating} />
                </div>
                {r.text && <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {relatedQ.data && relatedQ.data.length > 0 && (
        <ProductRow title="Você também pode gostar" products={(relatedQ.data as ProductCardData[]).filter((p) => p.id !== product.id)} />
      )}
    </div>

    <CheckoutFormDialog
      open={buyNowOpen}
      onClose={() => setBuyNowOpen(false)}
      items={[{
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: images[0]?.url ?? "",
        colorId,
        colorName,
        sizeId,
        sizeLabel,
        unitPrice: price,
        quantity: qty,
        storeId: store.id,
      }]}
      subtotal={price * qty}
      coupon={null}
      total={price * qty}
      buyNow={{
        productTitle: product.title,
        productSlug: product.slug,
        productUrl: typeof window !== "undefined" ? `${window.location.origin}/loja/${store.slug}/produto/${product.slug}` : "",
        colorName,
        sizeLabel,
        quantity: qty,
        unitPrice: price,
      }}
    />
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-3.5 w-3.5", n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
    </div>
  );
}
