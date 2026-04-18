import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCategories } from "@/hooks/useCategories";

export function Footer() {
  const { data: settings } = useStoreSettings();
  const { data: categories = [] } = useCategories();
  const top = categories.filter((c) => !c.parent_id);

  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.name} className="h-10 w-auto" />
          ) : (
            <span className="font-display text-2xl font-bold">{settings?.name ?? "Loja"}</span>
          )}
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Moda infantil cuidadosamente selecionada. Atendimento próximo via WhatsApp.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {settings?.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-accent hover:text-accent-foreground hover:border-accent">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings?.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-accent hover:text-accent-foreground hover:border-accent">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {settings?.tiktok && (
              <a href={settings.tiktok} target="_blank" rel="noopener" aria-label="TikTok" className="grid h-10 w-10 place-items-center rounded-full border border-border text-xs font-bold transition hover:bg-accent hover:text-accent-foreground hover:border-accent">
                TT
              </a>
            )}
            {settings?.youtube && (
              <a href={settings.youtube} target="_blank" rel="noopener" aria-label="YouTube" className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-accent hover:text-accent-foreground hover:border-accent">
                <Youtube className="h-4 w-4" />
              </a>
            )}
            {settings?.whatsapp && (
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full border border-border text-xs font-bold transition hover:bg-accent hover:text-accent-foreground hover:border-accent">
                WA
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider">Categorias</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {top.map((c) => (
              <li key={c.id}>
                <Link to="/categoria/$slug" params={{ slug: c.slug }} className="transition hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Pedidos via WhatsApp</li>
            <li>Frete combinado direto com o vendedor</li>
            {settings?.whatsapp && (
              <li>
                <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} className="text-accent transition hover:underline">
                  Falar agora
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {settings?.name ?? "Loja"}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
