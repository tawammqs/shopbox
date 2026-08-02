import { Link } from "@tanstack/react-router";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { useStorefront } from "./StoreContext";
import { cn } from "@/lib/utils";

export function StorefrontNav() {
  const { store, categories } = useStorefront();
  const roots = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  return (
    <nav className="hidden border-b border-border/60 bg-background md:block">
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-4">
        <Link
          to="/loja/$slug"
          params={{ slug: store.slug }}
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-accent"
          activeOptions={{ exact: true }}
          activeProps={{ className: "text-accent" }}
        >
          Início
        </Link>
        {roots.map((cat) => {
          const subs = childrenOf(cat.id);
          return (
            <div key={cat.id} className="group relative">
              <Link
                to="/loja/$slug/categoria/$categorySlug"
                params={{ slug: store.slug, categorySlug: cat.slug }}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-accent"
                activeProps={{ className: "text-accent" }}
              >
                {cat.name}
                {subs.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
              {subs.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-[200px] rounded-xl border border-border bg-popover p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {subs.map((s) => (
                    <Link
                      key={s.id}
                      to="/loja/$slug/categoria/$categorySlug"
                      params={{ slug: store.slug, categorySlug: s.slug }}
                      className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <Link
          to="/loja/$slug/rastreio"
          params={{ slug: store.slug }}
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-accent"
          activeProps={{ className: "text-accent" }}
        >
          Rastrear pedido
        </Link>
      </div>
    </nav>
  );
}

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { store, categories } = useStorefront();
  const roots = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-background shadow-xl transition-transform md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span className="font-display text-lg font-semibold">{store.name}</span>
          <button onClick={onClose} aria-label="Fechar menu" className="rounded-md p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          <Link
            to="/loja/$slug"
            params={{ slug: store.slug }}
            onClick={onClose}
            className="block rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"
          >
            Início
          </Link>
          {roots.map((cat) => {
            const subs = childrenOf(cat.id);
            const isOpen = openId === cat.id;
            return (
              <div key={cat.id}>
                <div className="flex items-center">
                  <Link
                    to="/loja/$slug/categoria/$categorySlug"
                    params={{ slug: store.slug, categorySlug: cat.slug }}
                    onClick={onClose}
                    className="flex-1 rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"
                  >
                    {cat.name}
                  </Link>
                  {subs.length > 0 && (
                    <button
                      onClick={() => setOpenId(isOpen ? null : cat.id)}
                      className="rounded-md p-2 hover:bg-muted"
                      aria-label={isOpen ? "Recolher" : "Expandir"}
                    >
                      <ChevronDown className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="ml-3 border-l border-border pl-2">
                    {subs.map((s) => (
                      <Link
                        key={s.id}
                        to="/loja/$slug/categoria/$categorySlug"
                        params={{ slug: store.slug, categorySlug: s.slug }}
                        onClick={onClose}
                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
