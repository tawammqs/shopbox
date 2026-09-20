import { createFileRoute } from "@tanstack/react-router";
import { listPublishedPosts } from "@/lib/blog.functions";

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: async () => {
    const posts = await listPublishedPosts();
    const base = "https://www.shopboxapp.com.br";
    const urls = ["", "/blog", "/precos", "/termos", "/privacidade", ...posts.map((post) => `/blog/${post.slug}`)];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => { const post = posts.find((item) => `/blog/${item.slug}` === path); return `\n  <url><loc>${base}${path || "/"}</loc>${post?.published_at ? `<lastmod>${new Date(post.published_at).toISOString()}</lastmod>` : ""}</url>`; }).join("")}\n</urlset>`;
    return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
  } } },
});
