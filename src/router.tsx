import { createRouter, useRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [showStack, setShowStack] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Você pode tentar novamente ou recarregar a página.
        </p>
        {error?.message && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        )}
        {error?.stack && (
          <div className="mt-2 text-left">
            <button
              type="button"
              onClick={() => setShowStack((s) => !s)}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              {showStack ? "Ocultar detalhes técnicos" : "Mostrar detalhes técnicos"}
            </button>
            {showStack && (
              <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            )}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Recarregar página
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Ir para a loja
          </a>
        </div>
      </div>
    </div>
  );
}

/** Paths that must never be rewritten into the storefront tree. */
const NON_STORE_PREFIXES = [
  "/loja",
  "/api",
  "/feed",
  "/hooks",
  "/email",
  "/lovable",
  "/admin",
  "/superadmin",
  "/painel",
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/reset-password",
  "/checkout",
  "/vip",
  "/unsubscribe",
];

function isNonStorePath(pathname: string) {
  return NON_STORE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * On a merchant's own domain the storefront lives at the root of the URL, while
 * internally the app keeps using the /loja/<slug> route tree.
 */
function buildRewrite(slug: string) {
  const base = `/loja/${slug}`;
  return {
    input: ({ url }: { url: URL }) => {
      if (url.pathname === base || url.pathname.startsWith(`${base}/`)) return undefined;
      if (isNonStorePath(url.pathname)) return undefined;
      const next = new URL(url);
      next.pathname = url.pathname === "/" ? base : `${base}${url.pathname}`;
      return next;
    },
    output: ({ url }: { url: URL }) => {
      if (url.pathname !== base && !url.pathname.startsWith(`${base}/`)) return undefined;
      const next = new URL(url);
      next.pathname = url.pathname.slice(base.length) || "/";
      return next;
    },
  };
}

function readClientHostSlug(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)sb_store_host_slug=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return value || null;
}

export const createAppRouter = (hostSlug: string | null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        throwOnError: false,
        retry: 1,
      },
      mutations: {
        throwOnError: false,
      },
    },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
    ...(hostSlug ? { rewrite: buildRewrite(hostSlug) } : {}),
  });
  return router;
};

export const getRouter = async () => {
  let hostSlug: string | null = null;
  if (import.meta.env.SSR) {
    const { resolveHostSlugForRequest } = await import("@/lib/host-slug.server");
    hostSlug = await resolveHostSlugForRequest();
  } else {
    hostSlug = readClientHostSlug();
  }
  return createAppRouter(hostSlug);
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
