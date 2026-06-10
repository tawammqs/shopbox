import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Heart, Share2,
  FileText, Ruler, ShieldCheck, Truck, CreditCard, Star, ThumbsUp, CheckCircle2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useStorefront } from "@/components/storefront/StoreContext";
import { fetchProductsByTag, type ProductCardData } from "@/lib/storefront";
import { supabase } from "@/integrations/supabase/client";
import { discountPct, effectivePrice, formatBRL } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { trackViewContent, trackAddToCart, trackInitiateCheckout } from "@/lib/tracking";
import { buildShareProductMessage } from "@/lib/whatsapp";
import { ProductRow } from "@/components/storefront/ProductRow";
import { CheckoutFormDialog } from "@/components/storefront/CheckoutFormDialog";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { cn } from "@/lib/utils";

export function TheShoesProductPage({ product }: { product: any }) {
  const { store } = useStorefront();
  const addItem = useCart((s) => s.addItem);
  const wished = useWishlist((s) => s.has(product.id));
  const toggleWish = useWishlist((s) => s.toggle);

  const images: { id: string; url: string; position: number }[] = (product.product_images ?? [])
    .slice().sort((a: any, b: any) => a.position - b.position);
  const colors: { id: string; name: string; hex: string }[] = (product.product_colors ?? [])
    .slice().sort((a: any, b: any) => a.position - b.position);
  const sizes: { id: string; label: string }[] = (product.product_sizes ?? [])
    .slice().sort((a: any, b: any) => a.position - b.position);
  const reviews = (product.product_reviews ?? []).filter((r: any) => r.status === "approved");
  const videos = (product.product_video_testimonials ?? [])
    .slice().sort((a: any, b: any) => a.position - b.position);

  const [imgIdx, setImgIdx] = useState(0);
  const [colorId, setColorId] = useState<string | null>(colors[0]?.id ?? null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [openAcc, setOpenAcc] = useState<string | null>("descricao");
  const [activeTab, setActiveTab] = useState<"avaliacoes" | "perguntas">("avaliacoes");
  const [sortBy, setSortBy] = useState<"relevant" | "recent" | "rating">("relevant");
  const [videoModalIdx, setVideoModalIdx] = useState<number | null>(null);

  useEffect(() => {
    if (product?.id) supabase.rpc("increment_product_view", { _product_id: product.id }).then(() => {});
  }, [product?.id]);

  const price = effectivePrice(Number(product.price), product.promo_price ? Number(product.promo_price) : null);
  const pct = discountPct(Number(product.price), product.promo_price ? Number(product.promo_price) : null);
  const colorName = colors.find((c) => c.id === colorId)?.name ?? null;
  const sizeLabel = sizes.find((s) => s.id === sizeId)?.label ?? null;

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length;
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    const arr = [...reviews];
    if (sortBy === "recent") {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "rating") {
      arr.sort((a, b) => b.rating - a.rating);
    } else {
      arr.sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0));
    }
    return arr;
  }, [reviews, sortBy]);

  useEffect(() => {
    void trackViewContent(store, { id: product.id, title: product.title, value: price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const validate = () => {
    if (colors.length > 0 && !colorId) return "Selecione uma cor";
    if (sizes.length > 0 && !sizeId) return "Selecione um tamanho";
    return null;
  };

  const addToCart = () => {
    const err = validate();
    if (err) return toast.error(err);
    addItem({
      productId: product.id, slug: product.slug, title: product.title,
      image: images[0]?.url ?? "",
      colorId, colorName, sizeId, sizeLabel,
      unitPrice: price, quantity: qty, storeId: store.id,
    });
    void trackAddToCart(store, { id: product.id, title: product.title, value: price, quantity: qty });
    toast.success("Adicionado ao carrinho");
  };

  const buyNow = () => {
    const err = validate();
    if (err) return toast.error(err);
    void trackInitiateCheckout(store, { ids: [product.id], numItems: qty, value: price * qty });
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

  // accordion items
  const accItems = [
    { id: "descricao", icon: FileText, label: "DESCRIÇÃO", body: product.description || "Sem descrição disponível." },
    { id: "tamanhos", icon: Ruler, label: "GUIA DE TAMANHOS", body: "Consulte nossa tabela de medidas para escolher o tamanho ideal. Em caso de dúvida, fale com a gente pelo WhatsApp." },
    { id: "garantia", icon: ShieldCheck, label: "GARANTIA E DEVOLUÇÃO", body: "Você tem até 7 dias após o recebimento para trocar ou devolver seu produto, conforme o Código de Defesa do Consumidor." },
    { id: "envio", icon: Truck, label: "CONDIÇÕES DE ENVIO", body: "Enviamos para todo o Brasil. O prazo e o valor do frete são combinados pelo WhatsApp após o pedido. Frete grátis acima de R$ 599,99." },
    { id: "pagamento", icon: CreditCard, label: "MÉTODOS DE PAGAMENTO", body: "Pix, cartão de crédito em até 12x e boleto. O pagamento é combinado diretamente pelo WhatsApp." },
  ];

  return (
    <div className="ts-product mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 text-[13px] text-[#aaa]">
        <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-[#111]">Início</Link>
        <span className="mx-2">/</span>
        <span className="text-[#111]">{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div className="min-w-0">
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-[#f8f8f8]">
            {images[imgIdx] && (
              <img src={images[imgIdx].url} alt={product.title} className="h-full w-full object-cover" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setImgIdx(i)}
                  className={cn("h-20 w-20 shrink-0 overflow-hidden rounded-md border-2",
                    i === imgIdx ? "border-[#111]" : "border-transparent")}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 space-y-5">
          <div>
            {product.brand && <p className="text-[12px] uppercase tracking-wide text-[#888]">{product.brand}</p>}
            <h1 className="ts-h1 text-[24px] font-extrabold leading-tight text-[#111] md:text-[32px]"
              style={{ letterSpacing: "-0.5px" }}>{product.title}</h1>
            {product.sku && <p className="mt-1 text-[12px] text-[#aaa]">SKU: {product.sku}</p>}
            {avgRating != null && (
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                <Stars value={avgRating} />
                <span className="text-[#888]">({reviews.length})</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-[30px] font-extrabold text-[#111]">{formatBRL(price)}</span>
              {pct > 0 && (
                <>
                  <span className="text-base text-[#aaa] line-through">{formatBRL(Number(product.price))}</span>
                  <span className="rounded-md bg-[#111] px-2 py-0.5 text-xs font-bold text-white">-{pct}%</span>
                </>
              )}
            </div>
            {pct > 0 && (
              <p className="mt-1 text-sm text-[#111]">Você economiza {formatBRL(Number(product.price) - price)}</p>
            )}
          </div>

          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#111]">Cor: <span className="font-normal">{colorName}</span></p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const sel = c.id === colorId;
                  return (
                    <button key={c.id} onClick={() => { setColorId(c.id); setSizeId(null); }} title={c.name}
                      className={cn("h-10 w-10 rounded-full border-2 transition",
                        sel ? "border-[#111]" : "border-[#e0e0e0]")}
                      style={{ background: c.hex }} />
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#111]">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const sel = s.id === sizeId;
                  return (
                    <button key={s.id} onClick={() => setSizeId(s.id)}
                      className={cn("min-w-[3rem] rounded-md border px-3 py-2 text-sm font-medium transition",
                        sel ? "border-[#111] bg-[#111] text-white" : "border-[#e0e0e0] text-[#111] hover:border-[#111]")}
                    >{s.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          {/* qty + actions */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-[#e0e0e0]">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-[#f5f5f5]">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2.5ch] text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-[#f5f5f5]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={addToCart}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#111] text-sm font-semibold text-white hover:opacity-90">
              <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
            </button>
          </div>
          <button onClick={buyNow}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:opacity-90">
            <WhatsAppIcon className="h-5 w-5" /> Comprar agora pelo WhatsApp
          </button>

          <div className="flex gap-2">
            <button onClick={() => { toggleWish(product.id); toast.success(wished ? "Removido" : "Salvo na lista"); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[#e0e0e0] py-2 text-sm hover:bg-[#f5f5f5]">
              <Heart className={cn("h-4 w-4", wished && "fill-[#111] text-[#111]")} />
              {wished ? "Salvo" : "Favoritar"}
            </button>
            <button onClick={share}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[#e0e0e0] py-2 text-sm hover:bg-[#f5f5f5]">
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Circular video thumbnails */}
      {videos.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-[18px] font-extrabold text-[#111]" style={{ letterSpacing: "-0.5px" }}>
            Descubra cada detalhe em vídeo
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {videos.map((v: any, i: number) => {
              const thumb = images[0]?.url ?? "";
              return (
                <button key={v.id} onClick={() => setVideoModalIdx(i)}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#dfdac8] bg-[#f5f5f5]"
                >
                  {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Accordion */}
      <section className="mt-8 max-w-3xl">
        <div className="border-t border-[#e5e5e5]">
          {accItems.map((it) => {
            const Icon = it.icon;
            const open = openAcc === it.id;
            return (
              <div key={it.id} className="border-b border-[#e5e5e5]">
                <button
                  onClick={() => setOpenAcc(open ? null : it.id)}
                  className="flex w-full items-center justify-between px-3 py-4 text-left"
                >
                  <span className="flex items-center gap-3 text-[13px] font-bold tracking-wide text-[#111]">
                    <Icon className="h-4 w-4" /> {it.label}
                  </span>
                  <span className="text-xl font-light text-[#111]">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="px-3 pb-5 text-[14px] leading-relaxed text-[#555]">
                    <p className="whitespace-pre-line">{it.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Video carousel (full) */}
      {videos.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-[22px] font-extrabold text-[#111]" style={{ letterSpacing: "-0.5px" }}>
            Veja em vídeo
          </h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden">
            {videos.map((v: any, i: number) => (
              <div key={v.id} className="w-[240px] shrink-0 snap-start overflow-hidden rounded-xl border border-[#eee] bg-black">
                <div className="aspect-[9/16] cursor-pointer" onClick={() => setVideoModalIdx(i)}>
                  {v.kind === "youtube" ? (
                    <iframe src={v.video_url.replace("watch?v=", "embed/")}
                      className="h-full w-full pointer-events-none" allowFullScreen />
                  ) : (
                    <video src={v.video_url} muted playsInline className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {relatedQ.data && relatedQ.data.length > 0 && (
        <ProductRow title="Você também pode gostar"
          products={(relatedQ.data as ProductCardData[]).filter((p) => p.id !== product.id)} />
      )}

      {/* Reviews + Questions */}
      <section className="mt-14">
        <div className="mb-6 flex justify-center gap-2">
          <button onClick={() => setActiveTab("avaliacoes")}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold transition",
              activeTab === "avaliacoes" ? "bg-[#f5f5f0] text-[#111]" : "text-[#888] hover:text-[#111]")}>
            Avaliações
          </button>
          <button onClick={() => setActiveTab("perguntas")}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold transition",
              activeTab === "perguntas" ? "bg-[#f5f5f0] text-[#111]" : "text-[#888] hover:text-[#111]")}>
            Perguntas
          </button>
        </div>

        {activeTab === "avaliacoes" ? (
          <>
            <div className="text-center">
              {avgRating != null ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[32px] font-extrabold text-[#111]">{avgRating.toFixed(1)}</span>
                    <Stars value={avgRating} size={20} />
                  </div>
                  <p className="mt-1 text-[13px] text-[#888]">baseado em {reviews.length} avaliações</p>
                </>
              ) : (
                <p className="text-[13px] text-[#888]">Ainda sem avaliações</p>
              )}
              <h3 className="mt-4 text-[28px] font-black text-[#111] md:text-[40px]" style={{ letterSpacing: "-1px" }}>
                Avaliações do produto
              </h3>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => toast.info("Em breve: deixe sua avaliação")}
                className="rounded-md bg-[#111] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
              >
                Faça uma avaliação
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-[13px] text-[#111]">
                <option value="relevant">Mais relevantes</option>
                <option value="recent">Mais recentes</option>
                <option value="rating">Melhor nota</option>
              </select>
            </div>

            {sortedReviews.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedReviews.map((r: any) => (
                  <article key={r.id} className="rounded-lg border border-[#eee] bg-white p-4">
                    <Stars value={r.rating} />
                    {r.text && <p className="mt-2 text-[14px] leading-snug text-[#111]">{r.text}</p>}
                    <p className="mt-2 text-[12px] text-[#999]">
                      {r.customer_name}
                      {r.created_at && ` - ${daysAgo(r.created_at)}`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eef6ff] px-2 py-1 text-[11px] font-semibold text-[#1d6bd6]">
                        <ThumbsUp className="h-3 w-3" /> Recomendo este produto
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eafaf0] px-2 py-1 text-[11px] font-semibold text-[#1aa055]">
                        <CheckCircle2 className="h-3 w-3" /> Compra verificada
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-[#888]">Seja o primeiro a avaliar este produto.</p>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e0e0e0] py-12 text-center text-sm text-[#888]">
            Ainda não há perguntas. Em breve você poderá enviar suas dúvidas por aqui.
          </div>
        )}
      </section>

      {/* Video modal */}
      {videoModalIdx != null && videos[videoModalIdx] && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setVideoModalIdx(null)}>
          <button className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white"
            onClick={() => setVideoModalIdx(null)} aria-label="Fechar"><X className="h-5 w-5" /></button>
          {videos.length > 1 && (
            <>
              <button className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
                onClick={(e) => { e.stopPropagation(); setVideoModalIdx((i) => ((i ?? 0) - 1 + videos.length) % videos.length); }}
                aria-label="Anterior"><ChevronLeft className="h-6 w-6" /></button>
              <button className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
                onClick={(e) => { e.stopPropagation(); setVideoModalIdx((i) => ((i ?? 0) + 1) % videos.length); }}
                aria-label="Próximo"><ChevronRight className="h-6 w-6" /></button>
            </>
          )}
          <div className="aspect-[9/16] w-full max-w-[380px] overflow-hidden rounded-xl bg-black" onClick={(e) => e.stopPropagation()}>
            {videos[videoModalIdx].kind === "youtube" ? (
              <iframe src={videos[videoModalIdx].video_url.replace("watch?v=", "embed/") + "?autoplay=1"}
                className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
            ) : (
              <video src={videos[videoModalIdx].video_url} controls autoPlay playsInline className="h-full w-full object-cover" />
            )}
          </div>
        </div>
      )}

      <CheckoutFormDialog
        open={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        items={[{
          productId: product.id, slug: product.slug, title: product.title,
          image: images[0]?.url ?? "",
          colorId, colorName, sizeId, sizeLabel,
          unitPrice: price, quantity: qty, storeId: store.id,
        }]}
        subtotal={price * qty}
        coupon={null}
        total={price * qty}
        buyNow={{
          productTitle: product.title, productSlug: product.slug,
          productUrl: typeof window !== "undefined" ? `${window.location.origin}/loja/${store.slug}/produto/${product.slug}` : "",
          colorName, sizeLabel, quantity: qty, unitPrice: price,
        }}
      />

      <style>{`
        .ts-product, .ts-product * { font-family: 'DM Sans', 'Helvetica Neue', -apple-system, sans-serif; }
      `}</style>
    </div>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} style={{ width: size, height: size }}
          className={cn(n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-[#e0e0e0]")} />
      ))}
    </div>
  );
}

function daysAgo(date: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  if (diff === 0) return "hoje";
  if (diff === 1) return "1 dia";
  if (diff < 30) return `${diff} dias`;
  const months = Math.floor(diff / 30);
  return months === 1 ? "1 mês" : `${months} meses`;
}
