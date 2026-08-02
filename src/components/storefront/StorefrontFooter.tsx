import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Music2 } from "lucide-react";
import { useStorefront } from "./StoreContext";
import { useStorefrontCustomizations } from "./StorefrontCustomizer";
import shopboxLogo from "@/assets/shopbox-badge-logo.png";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function StorefrontFooter() {
  const { store, menus, socialLinks, contactInfo, pages } = useStorefront();
  const { data: cust } = useStorefrontCustomizations(store.id);
  const fcfg = cust?.footer ?? {};

  const ig = socialLinks?.instagram_username || store.instagram;
  const fb = socialLinks?.facebook_url || (store.facebook ? `https://facebook.com/${store.facebook}` : null);
  const yt = socialLinks?.youtube_url || store.youtube;
  const tt = socialLinks?.tiktok_username || store.tiktok;

  // Editor can override the menus rendered in the footer
  const pickedMenus = (() => {
    const picks: typeof menus = [];
    if (fcfg.primaryMenuEnabled && fcfg.primaryMenuId) {
      const m = menus.find((x) => x.id === fcfg.primaryMenuId);
      if (m) picks.push(m);
    }
    if (fcfg.secondaryMenuEnabled && fcfg.secondaryMenuId) {
      const m = menus.find((x) => x.id === fcfg.secondaryMenuId);
      if (m) picks.push(m);
    }
    return picks.length ? picks : menus.slice(0, 2);
  })();
  const renderedMenus = pickedMenus;

  // Contact overrides from editor (fall back to store contact info)
  const phone = fcfg.showContact ? (fcfg.phone || contactInfo?.phone) : contactInfo?.phone;
  const email = fcfg.showContact ? (fcfg.email || contactInfo?.store_email) : contactInfo?.store_email;

  return (
    <footer data-sf-footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-10 w-auto object-contain" />
          ) : (
            <span className="font-display text-xl font-bold">{fcfg.store_name || store.name}</span>
          )}
          {store.logo_url && (fcfg.store_name || store.name) && (
            <h4 className="mt-3 text-sm font-bold">{fcfg.store_name || store.name}</h4>
          )}
          {fcfg.about_text ? (
            <p className="mt-2 text-sm leading-relaxed opacity-80">{fcfg.about_text}</p>
          ) : contactInfo?.contact_text ? (
            <p className="mt-3 text-sm text-muted-foreground">{contactInfo.contact_text}</p>
          ) : (
            store.tagline && <p className="mt-3 text-sm text-muted-foreground">{store.tagline}</p>
          )}
          <div className="mt-4 flex gap-2">
            {ig && (
              <a
                href={`https://instagram.com/${ig.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-border p-2 text-foreground hover:border-accent hover:text-accent"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {fb && (
              <a
                href={fb}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {yt && (
              <a
                href={yt}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
              >
                <Youtube className="h-4 w-4" />
              </a>
            )}
            {tt && (
              <a
                href={`https://tiktok.com/@${tt.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="rounded-full border border-border p-2 hover:border-accent hover:text-accent"
              >
                <Music2 className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {renderedMenus.length > 0 ? (
          renderedMenus.map((m) => (
            <div key={m.id}>
              <h4 className="mb-3 text-sm font-semibold">{m.name}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {m.items.map((it) => (
                  <li key={it.id}>
                    <a href={it.url ?? "#"} className="hover:text-accent">
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div>
            <h4 className="mb-3 text-sm font-semibold">Loja</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/loja/$slug" params={{ slug: store.slug }} className="hover:text-accent">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/loja/$slug/rastreio" params={{ slug: store.slug }} className="hover:text-accent">
                  Rastrear pedido
                </Link>
              </li>
              <li>
                <Link to="/loja/$slug/wishlist" params={{ slug: store.slug }} className="hover:text-accent">
                  Lista de desejos
                </Link>
              </li>
              {pages.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/loja/$slug/pagina/$pageSlug"
                    params={{ slug: store.slug, pageSlug: p.slug }}
                    className="hover:text-accent"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-sm font-semibold">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {phone && <li>📱 {phone}</li>}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-accent">
                  ✉ {email}
                </a>
              </li>
            )}
            <li>
              <a
                href={buildWhatsAppUrl(store.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>

        {renderedMenus.length < 2 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold">Garantias</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {store.trust_badges.slice(0, 4).map((b, i) => (
                <li key={i}>✓ {b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {contactInfo?.company_name || store.name}
            {contactInfo?.tax_id ? ` — CNPJ ${contactInfo.tax_id}` : ""}
          </span>
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
              width={135}
              height={45}
              className="h-[45px] min-h-[45px] w-auto shrink-0 object-contain sm:h-[49px] sm:min-h-[49px]"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
