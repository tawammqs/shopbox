import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { fetchStoreBySlug, fetchCategories } from "@/lib/storefront";
import { StoreProvider } from "@/components/storefront/StoreContext";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontNav, MobileNavDrawer } from "@/components/storefront/StorefrontNav";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { WelcomePopup } from "@/components/storefront/WelcomePopup";
import { MarketingScripts } from "@/components/storefront/MarketingScripts";
import { TheShoesHeader } from "@/components/storefront/the-shoes/TheShoesHeader";
import { TheShoesFooter } from "@/components/storefront/the-shoes/TheShoesFooter";
import { TheShoesCartDrawer } from "@/components/storefront/the-shoes/TheShoesCartDrawer";
import { TheShoesCouponTab } from "@/components/storefront/the-shoes/TheShoesCouponTab";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const store = await fetchStoreBySlug(params.slug);
    if (!store) return { store: null, categories: [] };
    const categories = await fetchCategories(store.id);
    return { store, categories };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.store
      ? [
          { title: `${loaderData.store.name} — Loja online` },
          { name: "description", content: loaderData.store.tagline ?? `Compre na ${loaderData.store.name} pelo WhatsApp.` },
          { property: "og:title", content: loaderData.store.name },
          { property: "og:description", content: loaderData.store.tagline ?? "" },
        ]
      : [{ title: "Loja não encontrada" }],
  }),
  component: StorefrontLayout,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-display text-2xl">Erro ao carregar a loja</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={() => { router.invalidate(); reset(); }}>Tentar novamente</Button>
      </div>
    );
  },
});

function StorefrontLayout() {
  const { store, categories } = Route.useLoaderData();
  const [navOpen, setNavOpen] = useState(false);

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-3xl font-bold">Loja não encontrada</h1>
        <p className="text-muted-foreground">A loja que você procura não existe ou foi desativada.</p>
        <Link to="/" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          Voltar à página inicial
        </Link>
      </div>
    );
  }

  const isTheShoes = store.slug === "the-shoes";

  return (
    <StoreProvider value={{ store, categories }}>
      <div
        className="storefront-root min-h-screen bg-background"
        data-store-slug={store.slug}
        style={{ ["--accent" as any]: isTheShoes ? "#111111" : store.accent_color }}
      >
        {isTheShoes ? (
          <TheShoesHeader />
        ) : (
          <>
            <StorefrontHeader onOpenMobileNav={() => setNavOpen(true)} />
            <StorefrontNav />
            <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
          </>
        )}
        <main>
          <Outlet />
        </main>
        {isTheShoes ? <TheShoesFooter /> : <StorefrontFooter />}
        {isTheShoes ? <TheShoesCartDrawer /> : <CartDrawer />}
        {isTheShoes && <TheShoesCouponTab />}
        <WelcomePopup />
        <MarketingScripts pixelId={store.facebook_pixel_id} gaId={store.google_analytics_id} />
      </div>
    </StoreProvider>
  );
}
