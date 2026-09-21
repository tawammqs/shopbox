import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, UserRound } from "lucide-react";
import { BLOG_CATEGORIES, listPublishedPosts, listTopPosts } from "@/lib/blog.functions";
import { BlogLeadCapture } from "@/components/blog/BlogLeadCapture";
import { BlogWhatsAppButton } from "@/components/blog/BlogWhatsAppButton";

export const Route = createFileRoute("/blog")({
  loader: async () => ({ posts: await listPublishedPosts(), topPosts: await listTopPosts() }),
  head: () => ({ meta: [
    { title: "Blog ShopBox — Vendas, WhatsApp e empreendedorismo" },
    { name: "description", content: "Estratégias práticas para vender mais pelo WhatsApp, organizar sua loja e crescer no digital." },
    { property: "og:title", content: "Blog ShopBox" },
    { property: "og:description", content: "Conteúdo prático para pequenos empreendedores venderem mais online." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: BlogPage,
});

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function BlogPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/blog" && pathname !== "/blog/") return <Outlet />;

  const { posts, topPosts } = Route.useLoaderData();
  const [category, setCategory] = useState("Todos");
  const filtered = useMemo(() => category === "Todos" ? posts : posts.filter((post) => post.category === category), [category, posts]);
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/"><img src="/logo-shopbox.png" alt="ShopBox" className="h-10 w-auto" /></Link>
        <div className="flex items-center gap-3"><Link to="/login" className="text-sm font-semibold">Login</Link><Link to="/cadastro" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Criar loja grátis</Link></div>
      </div>
    </header>
    <main>
      <section className="border-b border-border bg-muted/35 px-5 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase text-accent">Conteúdo ShopBox</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Venda melhor. Cresça com mais clareza.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Estratégias diretas para transformar conversas no WhatsApp em vendas e clientes fiéis.</p>
      </section>
      {topPosts.length > 0 && <section className="mx-auto max-w-6xl px-5 pt-14">
        <h2 className="text-2xl font-semibold">Mais lidos</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {topPosts.map((post, index) => <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-[#25d366]">
            <span className="text-2xl font-bold text-[#25d366]">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <span className="block text-base font-semibold leading-snug">{post.title}</span>
              <span className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="font-semibold uppercase text-accent">{post.category}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.reading_time} min</span></span>
            </span>
          </Link>)}
        </div>
      </section>}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <BlogLeadCapture source="blog-listagem" />
        <div className="scrollbar-hide mb-10 flex gap-2 overflow-x-auto pb-2">
          {["Todos", ...BLOG_CATEGORIES].map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>{item}</button>)}
        </div>
        {filtered.length === 0 ? <div className="py-20 text-center text-muted-foreground"><h2 className="text-2xl font-semibold text-foreground">Novos artigos em breve</h2><p className="mt-2">Estamos preparando conteúdos para esta categoria.</p></div> : <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => <article key={post.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
              {post.cover_image_url ? <img src={post.cover_image_url} alt="" className="aspect-[16/9] w-full object-cover" /> : <div className="flex aspect-[16/9] items-end bg-gradient-to-br from-accent to-primary p-6"><span className="text-sm font-semibold text-primary-foreground">{post.category}</span></div>}
              <div className="p-6"><span className="text-xs font-semibold uppercase text-accent">{post.category}</span><h2 className="mt-3 text-xl font-semibold leading-snug">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{post.author_name}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.reading_time} min</span><span>{formatDate(post.published_at)}</span></div><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent">Ler artigo <ArrowRight className="h-4 w-4" /></span></div>
            </Link>
          </article>)}
        </div>}
      </section>
    </main>
    <footer className="border-t border-border px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row"><img src="/logo-shopbox.png" alt="ShopBox" className="h-9 w-auto" /><p>Conteúdo para quem vende pelo WhatsApp.</p></div></footer>
  </div>;
}
