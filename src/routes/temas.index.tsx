import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Star, Download, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBRL, SEGMENT_OPTIONS, STYLE_OPTIONS, type ThemeTokens } from "@/lib/themes";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/temas/")({
  head: () => ({
    meta: [
      { title: "Marketplace de Temas — Shopbox" },
      { name: "description", content: "Temas exclusivos para deixar sua loja ainda mais profissional. Gratuitos e premium a partir de R$97." },
      { property: "og:title", content: "Marketplace de Temas — Shopbox" },
      { property: "og:description", content: "Temas exclusivos para sua loja online." },
    ],
  }),
  component: ThemeMarketplacePage,
});

type ThemeRow = {
  id: string; slug: string; name: string; tagline: string | null;
  price_cents: number; is_free: boolean;
  preview_desktop_url: string | null; preview_mobile_url: string | null;
  segment_tags: string[]; style_tags: string[];
  rating_avg: number; rating_count: number; install_count: number;
  tokens: ThemeTokens; demo_url: string | null;
  created_at: string;
};

function ThemeMarketplacePage() {
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [segments, setSegments] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [sort, setSort] = useState<"popular" | "newest" | "price">("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const themesQ = useQuery({
    queryKey: ["public-themes"],
    queryFn: async () => {
      const { data } = await supabase.from("themes").select("*").eq("status", "approved").order("display_order");
      return (data ?? []) as unknown as ThemeRow[];
    },
  });

  const filtered = useMemo(() => {
    let list = themesQ.data ?? [];
    if (search) list = list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.tagline ?? "").toLowerCase().includes(search.toLowerCase()));
    if (priceFilter === "free") list = list.filter((t) => t.is_free);
    if (priceFilter === "paid") list = list.filter((t) => !t.is_free);
    if (segments.length) list = list.filter((t) => t.segment_tags.some((s) => segments.includes(s)));
    if (styles.length) list = list.filter((t) => t.style_tags.some((s) => styles.includes(s)));
    if (sort === "newest") list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === "price") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    else list = [...list].sort((a, b) => b.install_count - a.install_count);
    return list;
  }, [themesQ.data, search, priceFilter, segments, styles, sort]);

  function toggle(arr: string[], v: string, setter: (n: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
      <MarketingHeader />

      {/* Hero */}
      <section className="bg-white py-20 lg:py-24 border-b border-[#e5e7eb]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 px-3.5 py-1 text-[11px] font-medium text-[#25D366]" style={{ fontFamily: "Geist Mono, monospace" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
            Marketplace de Temas
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-[-0.03em] text-[#0a0f0a] md:text-6xl lg:text-7xl" style={{ fontFamily: "Geist, system-ui, sans-serif" }}>
            Deixe sua loja ainda<br />mais profissional
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#5a6a5a] leading-relaxed">
            Escolha entre dezenas de temas exclusivos. Ative em um clique, personalize tudo no editor visual.
          </p>
          <div className="mx-auto mt-8 flex max-w-md gap-2">
            <Input placeholder="Buscar temas…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-[280px_1fr]">
        {/* Filters sidebar */}
        <aside className={`${filtersOpen ? "block" : "hidden md:block"} space-y-6 rounded-2xl border border-border bg-card p-5 h-fit`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Filtros</h2>
            <button onClick={() => setFiltersOpen(false)} className="md:hidden text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Preço</p>
            <div className="space-y-1.5">
              {[{ v: "all", l: "Todos" }, { v: "free", l: "Gratuitos" }, { v: "paid", l: "Pagos" }].map((o) => (
                <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-muted/50">
                  <input type="radio" checked={priceFilter === o.v} onChange={() => setPriceFilter(o.v as any)} className="accent-primary" />
                  <span className="text-sm">{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Segmento</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {SEGMENT_OPTIONS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-muted/50">
                  <Checkbox checked={segments.includes(s)} onCheckedChange={() => toggle(segments, s, setSegments)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Estilo</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {STYLE_OPTIONS.map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-muted/50">
                  <Checkbox checked={styles.includes(s)} onCheckedChange={() => toggle(styles, s, setStyles)} />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {(segments.length > 0 || styles.length > 0 || priceFilter !== "all") && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSegments([]); setStyles([]); setPriceFilter("all"); }}>
              Limpar filtros
            </Button>
          )}
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setFiltersOpen(true)}>
              <Filter className="mr-1.5 h-4 w-4" /> Filtros
            </Button>
            <p className="text-sm text-muted-foreground">{filtered.length} tema{filtered.length === 1 ? "" : "s"}</p>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Mais populares</SelectItem>
                <SelectItem value="newest">Mais novos</SelectItem>
                <SelectItem value="price">Menor preço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {themesQ.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
              <p className="text-muted-foreground">Nenhum tema encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => <ThemeCard key={t.id} theme={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: ThemeRow }) {
  const c = theme.tokens?.colors ?? { primary: "#1A6B4A", accent: "#F4A300", bg: "#FFF" };
  return (
    <Link to="/temas/$slug" params={{ slug: theme.slug }} className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}22)` }}>
        {theme.preview_desktop_url ? (
          <img src={theme.preview_desktop_url} alt={theme.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6">
            <div className="mb-3 h-16 w-24 rounded-md" style={{ background: c.primary }} />
            <div className="space-y-1.5 w-full">
              <div className="h-2 w-3/4 rounded" style={{ background: c.primary, opacity: 0.3 }} />
              <div className="h-2 w-1/2 rounded" style={{ background: c.accent, opacity: 0.6 }} />
            </div>
          </div>
        )}
        <div className="absolute right-2 top-2">
          {theme.is_free ? <Badge className="bg-emerald-500/90 hover:bg-emerald-500">Gratuito</Badge> : <Badge>{formatBRL(theme.price_cents)}</Badge>}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-bold">{theme.name}</h3>
        {theme.tagline && <p className="line-clamp-1 text-sm text-muted-foreground">{theme.tagline}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {theme.segment_tags.slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
          {theme.style_tags.slice(0, 1).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {theme.rating_avg.toFixed(1)} ({theme.rating_count})</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {theme.install_count}</span>
        </div>
      </div>
    </Link>
  );
}
