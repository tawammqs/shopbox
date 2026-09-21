import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Clock, UserRound } from "lucide-react";
import { getPublishedPost, incrementBlogView, parseFaq } from "@/lib/blog.functions";
import { BlogLeadCapture } from "@/components/blog/BlogLeadCapture";
import { BlogWhatsAppButton } from "@/components/blog/BlogWhatsAppButton";

function sanitizeArticleHtml(html: string) {
  return html
    .replace(/<\/?(script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function slugifyHeading(text: string, index: number) {
  const base = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base || `secao-${index + 1}`;
}

type TocItem = { id: string; text: string; level: string };

function buildArticle(rawHtml: string) {
  const toc: TocItem[] = [];
  let index = 0;
  const html = sanitizeArticleHtml(rawHtml).replace(
    /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const existing = attrs.match(/id\s*=\s*"([^"]+)"/i)?.[1];
      const id = existing || slugifyHeading(text, index);
      index += 1;
      toc.push({ id, text, level: tag.toLowerCase() });
      const cleaned = attrs.replace(/\sid\s*=\s*("[^"]*"|'[^']*')/gi, "");
      return `<${tag}${cleaned} id="${id}">${inner}</${tag}>`;
    },
  );
  const parts = html.split("</p>");
  let before = html;
  let after = "";
  if (parts.length > 3) {
    const splitAt = Math.min(3, Math.floor(parts.length / 2)) || 1;
    before = parts.slice(0, splitAt).join("</p>") + "</p>";
    after = parts.slice(splitAt).join("</p>");
  }
  return { toc, before, after };
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
  const registerView = useServerFn(incrementBlogView);
  const { toc, before, after } = useMemo(() => buildArticle(post.content), [post.content]);
  const faq = useMemo(() => parseFaq(post.faq), [post.faq]);
  const [activeSection, setActiveSection] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => { void registerView({ data: { id: post.id } }).catch(() => undefined); }, [post.id, registerView]);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-100px 0px -70% 0px" },
    );
    toc.forEach((item) => { const el = document.getElementById(item.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [toc]);

  const date = post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";

  const articleBody = <>
    <div className="blog-prose" dangerouslySetInnerHTML={{ __html: before }} />
    <BlogLeadCapture source="blog-artigo" compact />
    {after && <div className="blog-prose" dangerouslySetInnerHTML={{ __html: after }} />}
    {post.tags.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">#{tag}</span>)}</div>}
    {faq.length > 0 && <div className="mt-12">
      <h2 className="text-[22px] font-semibold">Perguntas frequentes</h2>
      <div className="mt-6">
        {faq.map((item) => <details key={item.question} className="group border-b border-border py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">{item.question}<span className="text-xl text-[#25d366] group-open:rotate-45 transition">+</span></summary>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
        </details>)}
      </div>
    </div>}
  </>;

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/"><img src="/logo-shopbox.png" alt="ShopBox" className="h-10 w-auto" /></Link><Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Todos os artigos</Link></div></header>
    <main>
      <article>
        <header className="mx-auto max-w-4xl px-5 pb-12 pt-14 text-center"><nav className="mb-8 text-sm text-muted-foreground"><Link to="/">Início</Link><span className="mx-2">/</span><Link to="/blog">Blog</Link><span className="mx-2">/</span><span className="text-foreground">{post.category}</span></nav><span className="text-sm font-semibold uppercase text-accent">{post.category}</span><h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{post.title}</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p><div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><UserRound className="h-4 w-4" />{post.author_name}</span><span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.reading_time} min de leitura</span><span>{date}</span></div></header>
        {post.cover_image_url && <div className="mx-auto max-w-5xl px-5"><img src={post.cover_image_url} alt={post.title} className="aspect-[16/8] w-full rounded-lg object-cover" /></div>}

        <div className="mx-auto max-w-[1100px] px-5 py-14 md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-16">
          <div className="max-w-3xl">{articleBody}</div>
          {toc.length > 0 && <aside className="hidden md:block md:sticky md:top-[100px] md:self-start">
            <div className="rounded-2xl border border-border p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Neste artigo</p>
              {toc.map((item, index) => <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => { event.preventDefault(); document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }); setActiveSection(item.id); }}
                className={`flex items-start gap-2.5 border-b border-border/60 py-2 text-[13px] leading-snug transition ${activeSection === item.id ? "text-[#25d366]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="shrink-0 text-[11px] font-bold text-[#25d366]">{String(index + 1).padStart(2, "0")}</span>
                {item.text}
              </a>)}
            </div>
          </aside>}
        </div>
      </article>
      <section className="mx-5 mb-16 rounded-lg bg-gradient-to-br from-primary to-accent px-6 py-14 text-center text-primary-foreground md:mx-auto md:max-w-5xl"><h2 className="text-3xl font-semibold md:text-4xl">Sua loja pode começar hoje.</h2><p className="mx-auto mt-4 max-w-xl text-base opacity-90">Crie sua vitrine, compartilhe no WhatsApp e transforme conversas em pedidos.</p><Link to="/cadastro" className="mt-7 inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 font-semibold text-foreground">Criar loja grátis <ArrowRight className="h-4 w-4" /></Link></section>
      {related.length > 0 && <section className="border-t border-border bg-muted/30 px-5 py-14"><div className="mx-auto max-w-6xl"><h2 className="text-3xl font-semibold">Continue aprendendo</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{related.map((item) => <Link key={item.id} to="/blog/$slug" params={{ slug: item.slug }} className="rounded-lg border border-border bg-card p-6"><span className="text-xs font-semibold uppercase text-accent">{item.category}</span><h3 className="mt-3 text-xl font-semibold">{item.title}</h3><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold">Ler artigo <ArrowRight className="h-4 w-4" /></span></Link>)}</div></div></section>}
    </main>
    <BlogWhatsAppButton />
  </div>;
}
