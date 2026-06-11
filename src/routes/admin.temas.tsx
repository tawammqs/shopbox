import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle, DollarSign, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  preview_mobile_url: string | null;
  category: string | null;
};

const SEGMENTS = [
  "Roupas",
  "Acessórios",
  "Saúde e beleza",
  "Casa e decor",
  "Comida e bebida",
  "Tecnologia",
  "Infantil",
  "Esportes",
  "Livros, arte e música",
  "Presentes",
  "Pets",
];

function AdminThemesPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [segments, setSegments] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<ThemeRow | null>(null);

  const themes = useQuery({
    queryKey: ["themes-marketplace-v2"],
    queryFn: async (): Promise<ThemeRow[]> => {
      const { data, error } = await (supabase as any)
        .from("themes")
        .select("id, slug, name, description, price_cents, is_free, preview_desktop_url, preview_mobile_url, category, display_order")
        .eq("status", "approved")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const settings = useQuery({
    queryKey: ["my-theme-settings", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("store_theme_settings").select("active_theme_id").eq("store_id", store!.id).maybeSingle();
      return data;
    },
  });

  const purchases = useQuery({
    queryKey: ["my-theme-purchases", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("theme_purchases").select("theme_id, status").eq("store_id", store!.id);
      return data ?? [];
    },
  });

  const ownedIds = new Set((purchases.data ?? []).filter((p: any) => p.status === "completed").map((p: any) => p.theme_id));

  const apply = useMutation({
    mutationFn: async (themeId: string) => {
      if (!store) return;
      const { error } = await (supabase as any).from("store_theme_settings").upsert({ store_id: store.id, active_theme_id: themeId }, { onConflict: "store_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tema aplicado!");
      qc.invalidateQueries({ queryKey: ["my-theme-settings"] });
      qc.invalidateQueries({ queryKey: ["store-theme"] });
      setPending(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeId = settings.data?.active_theme_id ?? null;
  const all = themes.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (segments.size > 0) {
        const cat = (t.category ?? "").toLowerCase();
        const anyMatch = Array.from(segments).some((s) => cat.includes(s.toLowerCase()));
        if (!anyMatch) return false;
      }
      return true;
    });
  }, [all, search, segments]);

  function toggleSeg(s: string) {
    setSegments((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function onCardClick(t: ThemeRow) {
    if (activeId === t.id) return;
    const owned = t.is_free || ownedIds.has(t.id);
    if (owned) setPending(t);
    else navigate({ to: "/temas/$slug", params: { slug: t.slug } });
  }

  if (themes.isLoading || !store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#111827] md:text-[32px]">
              Templates de loja virtual prontos para refletir sua marca
            </h1>
            <p className="mt-4 text-base text-[#6b7280]">
              Escolha entre <strong className="text-[#111827]">mais de {all.length} temas</strong> como ponto de partida.
            </p>
            <button
              onClick={() => document.getElementById("themes-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-6 h-11 rounded-lg bg-[#25d366] px-5 text-sm font-semibold text-white hover:bg-[#1fb959]"
            >
              Ver todos os temas
            </button>
          </div>
          <div className="relative hidden h-56 md:block">
            {all.slice(0, 4).map((t, i) => (
              <div
                key={t.id}
                className="absolute h-44 w-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-lg transition-transform"
                style={{
                  left: `${i * 60}px`,
                  top: `${i * 8}px`,
                  transform: `rotate(${(i - 1.5) * 2}deg)`,
                  zIndex: 10 - i,
                }}
              >
                {t.preview_desktop_url && (
                  <img src={t.preview_desktop_url} alt={t.name} className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section id="themes-grid" className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#25d366]"
            />
          </div>
          <div>
            <h3 className="mb-2 text-base font-semibold text-[#111827]">Segmento</h3>
            <div className="space-y-1.5">
              {SEGMENTS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={segments.has(s)}
                    onChange={() => toggleSeg(s)}
                    className="h-4 w-4 rounded border-gray-300 text-[#25d366] focus:ring-[#25d366]"
                  />
                  <span className="text-[#374151]">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const isActive = activeId === t.id;
            return (
              <div key={t.id} className="space-y-2">
                <button
                  onClick={() => onCardClick(t)}
                  className={cn(
                    "relative block w-full overflow-hidden rounded-xl border-2 bg-gray-100 transition hover:shadow-lg",
                    isActive ? "border-[#25d366]" : "border-transparent",
                  )}
                  style={{ aspectRatio: "4 / 3" }}
                >
                  {t.preview_desktop_url ? (
                    <img src={t.preview_desktop_url} alt={t.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#25d366]/20 to-[#0f4732]/20" />
                  )}
                  {t.preview_mobile_url && (
                    <img
                      src={t.preview_mobile_url}
                      alt=""
                      className="absolute bottom-3 right-3 w-[35%] rounded-lg border-2 border-white object-cover"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
                    />
                  )}
                  {isActive && (
                    <span className="absolute right-2 top-2">
                      <CheckCircle className="h-7 w-7 fill-[#25d366] text-white drop-shadow" />
                    </span>
                  )}
                </button>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-base font-semibold text-[#111827]">{t.name}</h3>
                      {t.category && <span className="text-xs text-[#9ca3af]">{t.category}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-sm">
                      <DollarSign className={cn("h-3.5 w-3.5", t.is_free ? "text-gray-400" : "text-[#25d366]")} />
                      <span className={cn(t.is_free ? "text-gray-500" : "font-semibold text-[#25d366]")}>
                        {t.is_free ? "Grátis" : `R$ ${(t.price_cents / 100).toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="rounded-full bg-[#f0fdf4] px-2 py-1 text-[11px] font-semibold text-[#25d366]">Tema atual</span>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">
              Nenhum tema encontrado com esses filtros.
            </div>
          )}
        </div>
      </section>

      {/* Apply confirmation modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPending(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#111827]">Aplicar tema {pending.name}?</h3>
            <p className="mt-2 text-sm text-[#6b7280]">Sua loja passará a usar este tema imediatamente. Você pode trocar de tema a qualquer momento.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPending(null)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={() => apply.mutate(pending.id)}
                disabled={apply.isPending}
                className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fb959] disabled:opacity-60"
              >
                {apply.isPending ? "Aplicando…" : "Aplicar tema"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
