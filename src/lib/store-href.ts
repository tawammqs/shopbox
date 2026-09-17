import { useRouter } from "@tanstack/react-router";

/**
 * Returns a function that converts an internal storefront path
 * (/loja/<slug>/...) into the address shown to the visitor. On a merchant's
 * own domain the /loja/<slug> prefix is stripped; elsewhere it is kept.
 */
export function useStoreHref() {
  const router = useRouter();
  return (path: string) => {
    if (!path.startsWith("/")) return path;
    const output = (router.options as any)?.rewrite?.output;
    if (!output) return path;
    try {
      const url = new URL(path, "http://local");
      const next = output({ url });
      if (!next) return path;
      const out = typeof next === "string" ? new URL(next, "http://local") : next;
      return `${out.pathname}${out.search}${out.hash}`;
    } catch {
      return path;
    }
  };
}
