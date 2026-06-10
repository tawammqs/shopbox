import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/temas")({
  head: () => ({ meta: [{ title: "Temas — ShopBox" }] }),
  component: AdminThemesPage,
});

type ThemeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_free: boolean;
  preview_desktop_url: string | null;
  features: string[];
};

function AdminThemesPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();

  const themes = useQuery({
    queryKey: ["themes-marketplace"],
    queryFn: async (): Promise<ThemeRow[]> => {
      const { data, error } = await supabase
        .from("themes")
        .select(
          "id, slug, name, description, price_cents, is_free, preview_desktop_url, features, display_order",
        )
        .eq("status", "approved")
        .in("slug", ["default", "mio-style"])
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({
        ...t,
        features: Array.isArray(t.features) ? (t.features as string[]) : [],
      }));
    },
  });

  const settings = useQuery({
    queryKey: ["my-theme-settings", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("store_theme_settings")
        .select("active_theme_id")
        .eq("store_id", store!.id)
        .maybeSingle();
      return data;
    },
  });

  const purchases = useQuery({
    queryKey: ["my-theme-purchases", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("theme_purchases")
        .select("theme_id, status")
        .eq("store_id", store!.id);
      return data ?? [];
    },
  });

  const ownedIds = new Set(
    (purchases.data ?? [])
      .filter((p: any) => p.status === "completed")
      .map((p: any) => p.theme_id),
  );

  const apply = useMutation({
    mutationFn: async (themeId: string) => {
      if (!store) return;
      const { error } = await (supabase as any)
        .from("store_theme_settings")
        .upsert(
          { store_id: store.id, active_theme_id: themeId },
          { onConflict: "store_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tema aplicado!");
      qc.invalidateQueries({ queryKey: ["my-theme-settings"] });
      qc.invalidateQueries({ queryKey: ["store-theme"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (themes.isLoading || !store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeId = settings.data?.active_theme_id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Temas</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o visual da sua loja. Você pode trocar a qualquer momento.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {themes.data?.map((t) => {
          const owned = t.is_free || ownedIds.has(t.id);
          const isActive = activeId === t.id;
          return (
            <div
              key={t.id}
              className="overflow-hidden rounded-2xl bg-card"
              style={{
                border: isActive ? "2px solid #25D366" : "1px solid hsl(var(--border))",
              }}
            >
              <div
                className="relative"
                style={{
                  height: 200,
                  background: t.preview_desktop_url
                    ? `#0f0f0f url(${t.preview_desktop_url}) center/cover no-repeat`
                    : "linear-gradient(135deg, #25D366 0%, #0f0f0f 100%)",
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "#25D366",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "6px 10px",
                      borderRadius: 6,
                      letterSpacing: "0.5px",
                    }}
                  >
                    TEMA ATIVO
                  </span>
                )}
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: t.is_free ? "#25D366" : "#0f0f0f",
                    color: "#fff",
                    fontSize: t.is_free ? 11 : 13,
                    fontWeight: 700,
                    padding: "8px 14px",
                    borderRadius: "0 0 0 10px",
                  }}
                >
                  {t.is_free ? "GRATUITO" : formatBRL(t.price_cents / 100)}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-display text-xl font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {t.description}
                </p>

                <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {t.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-foreground/80">
                      <Check size={12} strokeWidth={3} className="text-[#25D366]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {isActive ? (
                    <Button disabled variant="outline" className="flex-1">
                      Tema atual
                    </Button>
                  ) : owned ? (
                    <Button
                      onClick={() => apply.mutate(t.id)}
                      disabled={apply.isPending}
                      style={{ background: "#25D366", color: "#fff" }}
                      className="flex-1"
                    >
                      Aplicar tema
                    </Button>
                  ) : (
                    <Button asChild className="flex-1 bg-foreground text-background">
                      <Link to="/temas/$slug" params={{ slug: t.slug }}>
                        Comprar tema
                      </Link>
                    </Button>
                  )}

                  {t.slug === "mio-style" && (owned || isActive) && (
                    <Button asChild variant="outline" size="default">
                      <Link to="/admin/personalizar-loja">
                        <Palette className="mr-1 h-4 w-4" /> Personalizar
                      </Link>
                    </Button>
                  )}

                  <Button asChild variant="ghost" size="default">
                    <Link to="/temas/$slug" params={{ slug: t.slug }}>
                      Detalhes
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
