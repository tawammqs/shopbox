import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useStorefront } from "./StoreContext";
import { useStorefrontCustomizations } from "./StorefrontCustomizer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DISMISS_KEY = "shopbox_welcome_dismissed_";

export function WelcomePopup() {
  const { store } = useStorefront();
  const { data: cust } = useStorefrontCustomizations(store.id);

  // Prefer the layout editor's customizations.homepage.popup; fall back to
  // the legacy stores.welcome_popup so older configs keep working.
  const editorPopup = cust?.homepage?.popup;
  const legacyPopup = store.welcome_popup ?? {};
  const hasEditorPopup =
    !!editorPopup &&
    Object.values(editorPopup).some((v) => v !== undefined && v !== "" && v !== false);

  const enabled = hasEditorPopup ? !!editorPopup?.enabled : !!legacyPopup.enabled;

  const title = editorPopup?.title ?? "";
  const text =
    editorPopup?.text ??
    legacyPopup.message ??
    (legacyPopup.coupon ? `Ganhe um desconto na primeira compra! Use o cupom: ${legacyPopup.coupon}` : "");
  const image = editorPopup?.image ?? "";
  const ctaText = editorPopup?.ctaText ?? (legacyPopup.coupon ? "Copiar cupom" : "");
  const ctaLink = editorPopup?.ctaLink ?? "";
  const coupon = legacyPopup.coupon ?? "";
  const delay = ((hasEditorPopup ? editorPopup?.delay : legacyPopup.delaySeconds) ?? 15) * 1000;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const key = DISMISS_KEY + store.id;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [enabled, delay, store.id]);

  const close = () => {
    sessionStorage.setItem(DISMISS_KEY + store.id, "1");
    setOpen(false);
  };

  if (!enabled || !open) return null;

  const handleCta = () => {
    if (ctaLink) {
      window.open(ctaLink, "_blank", "noopener,noreferrer");
    } else if (coupon) {
      navigator.clipboard.writeText(coupon).catch(() => {});
      toast.success("Cupom copiado!");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Fechar"
          onClick={close}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-1.5 hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        {image ? (
          <img src={image} alt="" className="h-48 w-full object-cover" />
        ) : null}
        <div className="bg-gradient-to-br from-accent/20 via-accent/5 to-transparent p-8 text-center">
          {!image && <div className="text-5xl">🎁</div>}
          {title && <h2 className="mt-3 font-display text-2xl font-bold">{title}</h2>}
          {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
          <div className="mt-5 flex flex-col items-center gap-3">
            {coupon && !ctaLink && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(coupon).catch(() => {});
                  toast.success("Cupom copiado!");
                }}
                className="group inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-accent bg-accent/10 px-5 py-3 font-mono text-lg font-bold tracking-wider text-accent transition hover:bg-accent/20"
              >
                {coupon}
                <span className="text-xs font-normal text-muted-foreground group-hover:text-accent">copiar</span>
              </button>
            )}
            {(ctaText || ctaLink) && (
              <Button onClick={handleCta} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {ctaText || "Aproveitar"}
              </Button>
            )}
            <Button onClick={close} variant="outline" size="sm">
              Continuar comprando
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
