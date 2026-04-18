import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/stores/cart";
import { formatBRL } from "@/lib/format";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { openWhatsAppCheckout } from "@/lib/whatsapp";
import { toast } from "sonner";

export function CartDrawer() {
  const { isOpen, close, items, updateQty, removeItem, totalPrice } = useCart();
  const { data: settings } = useStoreSettings();
  const total = totalPrice();

  const handleCheckout = () => {
    if (!settings?.whatsapp) {
      toast.error("WhatsApp da loja não configurado.");
      return;
    }
    openWhatsAppCheckout(settings.whatsapp, items, total);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-xl font-semibold">Seu Carrinho</h3>
              <button onClick={close} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-secondary">
                  <ShoppingBag className="h-9 w-9 text-muted-foreground" />
                </div>
                <p className="font-display text-lg font-semibold">Seu carrinho está vazio</p>
                <p className="mt-1 text-sm text-muted-foreground">Que tal dar uma olhada nos produtos?</p>
                <Link
                  to="/"
                  onClick={close}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent/90"
                >
                  Ver Produtos
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li
                        key={`${item.productId}-${item.colorId}-${item.sizeId}`}
                        className="flex gap-3 border-b border-border pb-4 last:border-0"
                      >
                        <img src={item.image} alt={item.title} className="h-24 w-20 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to="/produto/$slug"
                              params={{ slug: item.slug }}
                              onClick={close}
                              className="line-clamp-2 text-sm font-medium hover:text-accent"
                            >
                              {item.title}
                            </Link>
                            <button
                              onClick={() => removeItem(item.productId, item.colorId, item.sizeId)}
                              className="text-muted-foreground transition hover:text-destructive"
                              aria-label="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.colorName && <span>Cor: {item.colorName}</span>}
                            {item.colorName && item.sizeLabel && <span> · </span>}
                            {item.sizeLabel && <span>Tam: {item.sizeLabel}</span>}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-border">
                              <button
                                onClick={() => updateQty(item.productId, item.colorId, item.sizeId, item.quantity - 1)}
                                className="grid h-8 w-8 place-items-center"
                                aria-label="Diminuir"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQty(item.productId, item.colorId, item.sizeId, item.quantity + 1)}
                                className="grid h-8 w-8 place-items-center"
                                aria-label="Aumentar"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-semibold">
                              {formatBRL(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border bg-secondary/30 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-display text-xl font-bold">{formatBRL(total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Frete combinado via WhatsApp</p>
                  <button
                    onClick={handleCheckout}
                    className="w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
                  >
                    Finalizar Compra pelo WhatsApp
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
