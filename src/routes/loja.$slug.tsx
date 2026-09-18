import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AffiliateBar } from "@/components/storefront/AffiliateShare";
import { savePendingAffiliateRef } from "@/lib/affiliates";
import {
  fetchStoreBySlug,
  fetchCategories,
  fetchActiveThemeSlug,
  fetchPaymentSettings,
  fetchSocialLinks,
  fetchContactInfo,
  fetchStoreMenus,
  fetchStaticPages,
} from "@/lib/storefront";
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
import { TheShoesGlobalStyles } from "@/components/storefront/the-shoes/TheShoesGlobalStyles";
import { TheShoesMobileBar } from "@/components/storefront/the-shoes/TheShoesMobileBar";
import { Button } from "@/components/ui/button";
import { VisitTracker } from "@/components/storefront/VisitTracker";
import { StorefrontCustomizer } from "@/components/storefront/StorefrontCustomizer";
import { MioVipPopupHost, MioVipMobileLock, MioCouponTab } from "@/components/storefront/MioAddonOverlays";
import { PromoTopBar } from "@/components/storefront/PromoTopBar";


export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params }) => {
    const store = await fetchStoreBySlug(params.slug);
    if (!store) {
      return {
        store: null,
        categories: [],
        activeThemeSlug: null,
        paymentSettings: null,
        socialLinks: null,
        contactInfo: null,
        menus: [],
        pages: [],
      };
    }
    const [categories, activeThemeSlug, paymentSettings, socialLinks, contactInfo, menus, pages] = await Promise.all([
      fetchCategories(store.id),
      fetchActiveThemeSlug(store.id),
      fetchPaymentSettings(store.id),
      fetchSocialLinks(store.id),
      fetchContactInfo(store.id),
      fetchStoreMenus(store.id),
      fetchStaticPages(store.id),
    ]);
    return { store, categories, activeThemeSlug, paymentSettings, socialLinks, contactInfo, menus, pages };
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
  const { store, categories, activeThemeSlug, paymentSettings, socialLinks, contactInfo, menus, pages } =
    Route.useLoaderData();
  const [navOpen, setNavOpen] = useState(false);

  // Store-wide affiliate link: /loja/[slug]?ref=[affiliate_slug]
  useEffect(() => {
    if (!store?.affiliates_enabled) return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) savePendingAffiliateRef(store.slug, ref);
  }, [store?.slug, store?.affiliates_enabled]);

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

  // Trial expired or store inactive → block storefront
  const trialExpired =
    store.subscription_status === "trialing" && store.trial_ends_at && new Date(store.trial_ends_at) < new Date();
  if (!store.active || trialExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="max-w-md rounded-2xl bg-background p-8 text-center shadow-md">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="mb-2 text-xl font-bold">Loja temporariamente indisponível</h1>
          <p className="text-sm text-muted-foreground">
            Esta loja está com o acesso suspenso. Se você é o proprietário, acesse o painel para renovar sua assinatura.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-[#25d366] underline">
            Acessar painel →
          </Link>
        </div>
      </div>
    );
  }

  const isTheShoes = activeThemeSlug === "mio-style" || store.slug === "the-shoes";
  const isLegacyTheShoes = store.slug === "the-shoes";

  return (
    <StoreProvider
      value={{ store, categories, activeThemeSlug, paymentSettings, socialLinks, contactInfo, menus, pages }}
    >
      <div
        className="storefront-root min-h-screen bg-background"
        data-store-slug={store.slug}
        data-theme={isTheShoes ? "mio" : undefined}
        style={{ ["--accent" as any]: isTheShoes ? "#111111" : store.accent_color }}
      >
        {!isLegacyTheShoes && <StorefrontCustomizer storeId={store.id} />}
        <PromoTopBar storeId={store.id} />
        <AffiliateBar />

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
        {isLegacyTheShoes && <TheShoesCouponTab />}
        {isTheShoes && <TheShoesMobileBar showVip={isLegacyTheShoes} />}
        {!isLegacyTheShoes && <MioVipPopupHost />}
        {!isTheShoes && <MioVipMobileLock />}
        {isTheShoes && !isLegacyTheShoes && <MioCouponTab />}
        {isTheShoes && <TheShoesGlobalStyles />}
        <WelcomePopup />
        <MarketingScripts pixelId={store.facebook_pixel_id} gaId={store.google_analytics_id} />
        <VisitTracker storeId={store.id} />
      </div>
    </StoreProvider>
  );
}
