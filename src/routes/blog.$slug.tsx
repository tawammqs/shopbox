import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, UserRound } from "lucide-react";
import { getPublishedPost } from "@/lib/blog.functions";

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    try { return await getPublishedPost({ data: { slug: params.slug } }); }
    catch (error) { if (error instanceof Response && error.status === 404) throw notFound(); throw error; }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [] };
    const title = post.meta_title || `${post.title} — Blog ShopBox`;
    const description = post.meta_description || post.excerpt;
    const meta = [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ];
    if (post.cover_image_url?.startsWith("https://")) meta.push({ property: "og:image", content: post.cover_image_url }, { name: "twitter:image", content: post.cover_image_url });
    return { meta };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post, related } = Route.useLoaderData();
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/"><img src="/logo-shopbox.png" alt="ShopBox" className="h-10 w-auto" /></Link><Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Todos os artigos</Link></div></header>
    <main>
      <article>
        <header className="mx-auto max-w-4xl px-5 pb-12 pt-14 text-center"><nav className="mb-8 text-sm text-muted-foreground"><Link to="/">Início</Link><span className="mx-2">/</span><Link to="/blog">Blog</Link><span className="mx-2">/</span><span className="text-foreground">{post.category}</span></nav><span className="text-sm font-semibold uppercase text-accent">{post.category}</span><h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{post.title}</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p><div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{post.author_name}</span><span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.reading_time} min de leitura</span><span>{date}</span></div></header>
        {post.cover_image_url && <div className="mx-auto max-w-5xl px-5"><img src={post.cover_image_url} alt={post.title} className="aspect-[16/8] w-full rounded-lg object-cover" /></div>}
        <div className="blog-prose mx-auto max-w-3xl px-5 py-14" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(post.content) }} />
        {post.tags.length > 0 && <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-5 pb-12">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">#{tag}</span>)}</div>}
      </article>
      <section className="mx-5 mb-16 rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-14 text-center text-primary-foreground md:mx-auto md:max-w-5xl"><h2 className="text-3xl font-semibold md:text-4xl">Sua loja pode começar hoje.</h2><p className="mx-auto mt-4 max-w-xl text-base opacity-90">Crie sua vitrine, compartilhe no WhatsApp e transforme conversas em pedidos.</p><Link to="/cadastro" className="mt-7 inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 font-semibold text-foreground">Criar loja grátis <ArrowRight className="h-4 w-4" /></Link></section>
      {related.length > 0 && <section className="border-t border-border bg-muted/30 px-5 py-14"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-semibold">Continue aprendendo</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{related.map((item) => <Link key={item.id} to="/blog/$slug" params={{ slug: item.slug }} className="rounded-lg border border-border bg-card p-6"><span className="text-xs font-semibold uppercase text-accent">{item.category}</span><h3 className="mt-3 text-xl font-semibold">{item.title}</h3><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">Ler artigo <ArrowRight className="h-4 w-4" /></span></Link>)}</div></div></section>}
    </main>
  </div>;
}
