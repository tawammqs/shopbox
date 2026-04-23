import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { useStorefront } from "./StoreContext";
import shopboxLogo from "@/assets/shopbox-badge-logo.png";

export function StorefrontFooter() {
  const { store } = useStorefront();
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-10 w-auto object-contain" />
          ) : (
            <span className="font-display text-xl font-bold">{store.name}</span>
          )}
          {store.tagline && <p className="mt-3 text-sm text-muted-foreground">{store.tagline}</p>}
          <div className="mt-4 flex gap-2">
            {store.instagram && (
              <a
                href={`https://instagram.com/${store.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-border p-2 text-foreground hover:border-accent hover:text-accent"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {store.facebook && (
              <a
                href={`https://facebook.com/${store.facebook}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {store.youtube && (
              <a
                href={store.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
              >
                <Youtube className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Loja</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-accent">
                Início
              </Link>
            </li>
            <li>
              <Link to="/loja/$slug/wishlist" params={{ slug: store.slug }} className="hover:text-accent">
                Lista de desejos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Garantias</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {store.trust_badges.slice(0, 4).map((b, i) => (
              <li key={i}>✓ {b}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {store.name}</span>
          <a
            href="https://shopboxapp.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Criado com ShopBox"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-3.5 py-1.5 text-[12px] font-normal text-muted-foreground shadow-sm transition hover:border-foreground/30 hover:text-foreground"
          >
            <span className="tracking-tight">criado com</span>
            <img
              src={shopboxLogo}
              alt="ShopBox"
              loading="lazy"
              decoding="async"
              width={120}
              height={32}
              className="h-8 min-h-[32px] w-auto shrink-0 object-contain sm:h-9 sm:min-h-[36px]"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
