import { createFileRoute, useParams, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useProductBySlug, useAllProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCart } from "@/stores/cart";
import { formatBRL, discountPct, effectivePrice } from "@/lib/format";
import { openWhatsAppCheckout } from "@/lib/whatsapp";
import { ProductCard } from "@/components/storefront/ProductCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_storefront/produto/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = useParams({ from: "/_storefront/produto/$slug" });
  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useAllProducts();
  const { data: settings } = useStoreSettings();
  const addItem = useCart((s) => s.addItem);

  const images = useMemo(
    () => (product?.product_images ?? []).slice().sort((a, b) => a.position - b.position),
    [product],
  );
  const colors = useMemo(
    () => (product?.product_colors ?? []).slice().sort((a, b) => a.position - b.position),
    [product],
  );
  const sizes = useMemo(
    () => (product?.product_sizes ?? []).slice().sort((a, b) => a.position - b.position),
    [product],
  );

  const [imgIdx, setImgIdx] = useState(0);
  const [colorId, setColorId] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!product) throw notFound();

  const price = Number(product.price);
  const promo = product.promo_price ? Number(product.promo_price) : null;
  const pct = discountPct(price, promo);
  const finalPrice = effectivePrice(price, promo);

  const stockFor = (cId: string | null, sId: string | null) =>
    product.product_stock.find((s) => s.color_id === cId && s.size_id === sId)?.quantity ?? 0;

  const sizeAvailableForColor = (sId: string) => {
    if (!colorId) return product.product_stock.some((s) => s.size_id === sId && s.quantity > 0);
    return stockFor(colorId, sId) > 0;
  };
  const colorAvailable = (cId: string) =>
    product.product_stock.some((s) => s.color_id === cId && s.quantity > 0);

  const currentStock = colorId && sizeId ? stockFor(colorId, sizeId) : null;
  const totalStock = product.product_stock.reduce((a, b) => a + b.quantity, 0);

  const stockLabel =
    totalStock === 0
      ? "Esgotado"
      : currentStock !== null && currentStock === 0
      ? "Combinação esgotada"
      : currentStock !== null && currentStock <= 5
      ? `Últimas ${currentStock} unidades`
      : "Em estoque";

  const cat = categories.find((c) => c.id === product.category_id);
  const sub = categories.find((c) => c.id === product.subcategory_id);

  const canAdd = (colors.length === 0 || !!colorId) && (sizes.length === 0 || !!sizeId) && (currentStock === null || currentStock >= qty);

  const handleAdd = () => {
    if (!canAdd) {
      toast.error("Selecione cor e tamanho disponíveis.");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: images[0]?.url ?? "",
      colorId,
      colorName: colors.find((c) => c.id === colorId)?.name ?? null,
      sizeId,
      sizeLabel: sizes.find((s) => s.id === sizeId)?.label ?? null,
      unitPrice: finalPrice,
      quantity: qty,
    });
    toast.success("Adicionado ao carrinho");
  };

  const handleBuyNow = () => {
    if (!canAdd) {
      toast.error("Selecione cor e tamanho disponíveis.");
      return;
    }
    if (!settings?.whatsapp) {
      toast.error("WhatsApp da loja não configurado.");
      return;
    }
    openWhatsAppCheckout(
      settings.whatsapp,
      [
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          image: images[0]?.url ?? "",
          colorId,
          colorName: colors.find((c) => c.id === colorId)?.name ?? null,
          sizeId,
          sizeLabel: sizes.find((s) => s.id === sizeId)?.label ?? null,
          unitPrice: finalPrice,
          quantity: qty,
        },
      ],
      finalPrice * qty,
    );
  };

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground md:text-sm">
        <Link to="/" className="hover:text-accent">
          Home
        </Link>
        {cat && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/categoria/$slug" params={{ slug: cat.slug }} className="hover:text-accent">
              {cat.name}
            </Link>
          </>
        )}
        {sub && cat && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/categoria/$slug/$sub" params={{ slug: cat.slug, sub: sub.slug }} className="hover:text-accent">
              {sub.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
            <AnimatePresence mode="wait">
              <motion.img
                key={imgIdx}
                src={images[imgIdx]?.url}
                alt={product.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-20 w-16 shrink-0 overflow-hidden rounded-md border-2 transition",
                    i === imgIdx ? "border-accent" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{product.brand}</div>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">{product.title}</h1>
          {product.sku && (
            <div className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{formatBRL(finalPrice)}</span>
            {promo && (
              <>
                <span className="text-base text-muted-foreground line-through">{formatBRL(price)}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                  -{pct}%
                </span>
              </>
            )}
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-sm font-medium">
                Cor: <span className="text-muted-foreground">{colors.find((c) => c.id === colorId)?.name ?? "Selecione"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const avail = colorAvailable(c.id);
                  return (
                    <button
                      key={c.id}
                      disabled={!avail}
                      onClick={() => {
                        setColorId(c.id);
                        if (sizeId && stockFor(c.id, sizeId) === 0) setSizeId(null);
                      }}
                      title={c.name}
                      className={cn(
                        "h-10 w-10 rounded-full border-2 transition relative",
                        colorId === c.id ? "border-accent ring-2 ring-accent/30" : "border-border",
                        !avail && "opacity-30 cursor-not-allowed",
                      )}
                      style={{ backgroundColor: c.hex }}
                    >
                      {!avail && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs">×</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-sm font-medium">
                Tamanho: <span className="text-muted-foreground">{sizes.find((s) => s.id === sizeId)?.label ?? "Selecione"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const avail = sizeAvailableForColor(s.id);
                  return (
                    <button
                      key={s.id}
                      disabled={!avail}
                      onClick={() => setSizeId(s.id)}
                      className={cn(
                        "min-w-12 rounded-md border px-3 py-2 text-sm font-medium transition",
                        sizeId === s.id
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border hover:border-foreground",
                        !avail && "opacity-40 cursor-not-allowed line-through",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                totalStock === 0 || (currentStock !== null && currentStock === 0)
                  ? "bg-destructive/10 text-destructive"
                  : currentStock !== null && currentStock <= 5
                  ? "bg-amber-500/10 text-amber-700"
                  : "bg-accent/10 text-accent",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {stockLabel}
            </span>
          </div>

          {/* Quantity & buttons */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center" aria-label="Diminuir">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center" aria-label="Aumentar">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className="flex-1 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar ao Carrinho
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!canAdd}
              className="flex-1 rounded-full border-2 border-accent bg-accent/5 px-6 py-3.5 text-sm font-semibold text-accent transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comprar pelo WhatsApp
            </button>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="mb-2 font-display text-lg font-semibold">Descrição</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
