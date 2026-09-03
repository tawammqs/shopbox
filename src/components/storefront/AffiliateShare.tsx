import { Link } from "@tanstack/react-router";
import { Link2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useStorefront } from "./StoreContext";
import {
  affiliateProductUrl,
  clearAffiliateSession,
  copyToClipboard,
  TS_BEIGE,
  TS_LIME,
  useAffiliateSession,
} from "@/lib/affiliates";
import { cn } from "@/lib/utils";

/** Returns the logged affiliate only when the store has the program enabled. */
export function useStoreAffiliate() {
  const { store } = useStorefront();
  const { affiliate } = useAffiliateSession(store.id);
  return store.affiliates_enabled ? affiliate : null;
}

type Props = {
  productSlug: string;
  /** "icon" = round overlay button on the image; "text" = inline link; "button" = outlined pill */
  variant?: "icon" | "text" | "button";
  className?: string;
};

export function AffiliateShareButton({ productSlug, variant = "icon", className }: Props) {
  const { store } = useStorefront();
  const affiliate = useStoreAffiliate();
  if (!affiliate) return null;

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = affiliateProductUrl(store.slug, productSlug, affiliate.affiliate_slug);
    const ok = await copyToClipboard(url);
    if (ok) toast.success("Link de afiliado copiado! 🔗");
    else toast.error("Não foi possível copiar o link");
  };

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={share}
        className={cn("shrink-0 text-xs font-semibold text-[#111] underline decoration-2 underline-offset-2 hover:opacity-80", className)}
        style={{ textDecorationColor: TS_LIME }}
      >
        Compartilhar
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={share}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-[#111] transition hover:opacity-90",
          className,
        )}
        style={{ borderColor: TS_LIME, backgroundColor: TS_BEIGE }}
      >
        <Link2 className="h-3.5 w-3.5" style={{ color: TS_LIME }} /> Meu link
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      title="Copiar meu link de afiliado"
      aria-label="Copiar meu link de afiliado"
      className={cn(
        "absolute right-2 top-12 z-10 grid h-8 w-8 place-items-center rounded-full bg-white shadow-md transition hover:scale-105",
        className,
      )}
      style={{ color: TS_LIME }}
    >
      <Link2 className="h-4 w-4" />
    </button>
  );
}

/** Slim bar shown on top of the storefront while an affiliate is logged in. */
export function AffiliateBar() {
  const { store } = useStorefront();
  const affiliate = useStoreAffiliate();
  if (!affiliate) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs font-semibold text-[#111]" style={{ backgroundColor: TS_LIME }}>
      <span className="truncate">
        👋 Logado como afiliado: <strong>{affiliate.name}</strong>
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <Link to="/loja/$slug/afiliados/painel" params={{ slug: store.slug }} className="underline decoration-2 underline-offset-2" style={{ color: "#111", textDecorationColor: TS_BEIGE }}>
          Meu painel
        </Link>
        <button
          type="button"
          onClick={() => {
            clearAffiliateSession();
            toast.success("Você saiu da área do afiliado");
          }}
          className="flex items-center gap-1 opacity-80 hover:opacity-100"
        >
          <LogOut className="h-3 w-3" /> Sair
        </button>
      </div>
    </div>
  );
}

export const affiliateInputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-foreground";

export function AffiliateUnavailable({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-bold">Programa de afiliados indisponível</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta loja ainda não ativou o programa de afiliados.</p>
      <Link
        to="/loja/$slug"
        params={{ slug }}
        className="mt-4 inline-block text-sm font-semibold text-[#111] underline decoration-2 underline-offset-2"
        style={{ textDecorationColor: TS_LIME }}
      >
        Voltar para a loja
      </Link>
    </div>
  );
}
