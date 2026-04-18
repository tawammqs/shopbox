import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ProductListItem } from "@/hooks/useProducts";
import { formatBRL, discountPct, effectivePrice } from "@/lib/format";

export function ProductCard({ product, index = 0 }: { product: ProductListItem; index?: number }) {
  const images = [...product.product_images].sort((a, b) => a.position - b.position);
  const main = images[0]?.url;
  const hover = images[1]?.url;
  const colors = [...product.product_colors].sort((a, b) => a.position - b.position);
  const visibleColors = colors.slice(0, 4);
  const extra = colors.length - visibleColors.length;
  const price = Number(product.price);
  const promo = product.promo_price ? Number(product.promo_price) : null;
  const pct = discountPct(price, promo);
  const finalPrice = effectivePrice(price, promo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to="/produto/$slug"
        params={{ slug: product.slug }}
        className="group block product-card-hover overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {main && (
            <img
              src={main}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            />
          )}
          {hover && (
            <img
              src={hover}
              alt=""
              loading="lazy"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
          {pct > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
              -{pct}%
            </span>
          )}
        </div>
        <div className="p-3 md:p-4">
          {product.brand && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.brand}</div>
          )}
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{product.title}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold">{formatBRL(finalPrice)}</span>
            {promo && (
              <span className="text-xs text-muted-foreground line-through">{formatBRL(price)}</span>
            )}
          </div>
          {visibleColors.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              {visibleColors.map((c) => (
                <span
                  key={c.id}
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              {extra > 0 && <span className="text-[10px] text-muted-foreground">+{extra}</span>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
