import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const BLOG_CATEGORIES = [
  "Vendas pelo WhatsApp",
  "Marketing Digital",
  "Gestão de Loja",
  "Empreendedorismo",
  "Redes Sociais",
  "Dicas de Vendas",
] as const;

export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];

const BlogPostInput = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20).max(100_000),
  cover_image_url: z.string().url().nullable(),
  author_name: z.string().trim().min(2).max(100),
  author_avatar_url: z.string().url().nullable(),
  category: z.enum(BLOG_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(50)).max(12),
  meta_title: z.string().trim().max(70).nullable(),
  meta_description: z.string().trim().max(170).nullable(),
  reading_time: z.number().int().min(1).max(120),
  is_published: z.boolean(),
  faq: z.array(z.object({ question: z.string().trim().min(3).max(300), answer: z.string().trim().min(3).max(2000) })).max(10).default([]),
});

export type BlogFaqItem = { question: string; answer: string };

export function parseFaq(value: unknown): BlogFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const question = typeof record["question"] === "string" ? record["question"] : "";
    const answer = typeof record["answer"] === "string" ? record["answer"] : "";
    return question && answer ? [{ question, answer }] : [];
  });
}

const GeneratedPost = z.object({
  title: z.string().min(3).max(180),
  slug: z.string().min(3).max(180),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(100),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(170).optional(),
  tags: z.array(z.string()).max(12).optional(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).max(8).optional(),
});

async function assertPlatformAdmin(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "platform_admin",
  });
  if (error) throw new Response(error.message, { status: 500 });
  if (!data) throw new Response("Acesso restrito a superadmins", { status: 403 });
}

function createPublicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("blog_posts")
    .select("id,title,slug,excerpt,cover_image_url,author_name,author_avatar_url,category,tags,reading_time,published_at,created_at")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error) throw new Response(error.message, { status: 500 });
  return data ?? [];
});

export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1).max(180) }).parse(input))
  .handler(async ({ data }) => {
    const client = createPublicClient();
    const { data: post, error } = await client
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw new Response(error.message, { status: 500 });
    if (!post) throw new Response("Artigo não encontrado", { status: 404 });
    const { data: related } = await client
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image_url,category,reading_time,published_at")
      .eq("is_published", true)
      .eq("category", post.category)
      .neq("id", post.id)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3);
    return { post, related: related ?? [] };
  });

export const listTopPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicClient()
    .from("blog_posts")
    .select("id,title,slug,excerpt,cover_image_url,category,reading_time,view_count")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("view_count", { ascending: false })
    .limit(3);
  if (error) throw new Response(error.message, { status: 500 });
  return data ?? [];
});

export const incrementBlogView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await createPublicClient().rpc("increment_blog_view", { _post_id: data.id });
    return { ok: true };
  });

export const submitBlogLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    whatsapp: z.string().trim().min(8).max(30),
    source: z.string().trim().max(60).default("blog"),
  }).parse(input))
  .handler(async ({ data }) => {
    const digits = data.whatsapp.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) throw new Response("Informe um WhatsApp válido com DDD.", { status: 400 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_leads").insert({ whatsapp: digits, source: data.source });
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const listBlogLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("blog_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data ?? [];
  });


export const listAdminPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Response(error.message, { status: 500 });
    return data ?? [];
  });

export const saveBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BlogPostInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const payload = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      cover_image_url: data.cover_image_url,
      author_name: data.author_name,
      author_avatar_url: data.author_avatar_url,
      category: data.category,
      tags: data.tags,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      reading_time: data.reading_time,
      is_published: data.is_published,
      faq: data.faq,
      published_at: data.is_published ? new Date().toISOString() : null,
    };
    const query = data.id
      ? context.supabase.from("blog_posts").update(payload).eq("id", data.id)
      : context.supabase.from("blog_posts").insert(payload);
    const { data: saved, error } = await query.select().single();
    if (error) throw new Response(error.message, { status: error.code === "23505" ? 409 : 500 });
    return saved;
  });

export const setBlogPostPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), published: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("blog_posts")
      .update({ is_published: data.published, published_at: data.published ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Response(error.message, { status: 500 });
    return { ok: true };
  });

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  if (!candidate) throw new Error("A IA não retornou um artigo válido.");
  return JSON.parse(candidate) as unknown;
}

async function requestClaude(apiKey: string, body: object) {
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const raw = await response.text();
    if (response.ok) return JSON.parse(raw) as { content?: Array<{ type?: string; text?: string }> };
    let safeMessage = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      safeMessage = parsed.error?.message ?? raw;
    } catch { /* keep response text */ }
    lastError = safeMessage;
    if (response.status !== 429 && response.status < 500) {
      throw new Response(safeMessage, { status: response.status });
    }
  }
  throw new Response(lastError || "A Anthropic está temporariamente indisponível.", { status: 503 });
}

export const generateBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    theme: z.string().trim().min(5).max(300),
    keyword: z.string().trim().min(2).max(100),
    category: z.enum(BLOG_CATEGORIES),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context.supabase, context.userId);
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Response("A chave da Anthropic não está configurada.", { status: 401 });
    const prompt = `Crie um artigo de blog em português do Brasil sobre "${data.theme}". Palavra-chave principal: "${data.keyword}". Categoria: "${data.category}". Público: pequenos empreendedores brasileiros que vendem online e pelo WhatsApp. Escreva entre 1200 e 1800 palavras, com tom profissional, claro, prático e acolhedor. Não mencione concorrentes. Inclua uma CTA natural para criar uma loja na ShopBox. Retorne SOMENTE JSON válido com: title, slug, excerpt, content, meta_title, meta_description e tags. content deve ser HTML sem markdown, usando apenas h2, h3, p, ul, li e strong. O slug deve usar letras minúsculas, números e hífens.`;
    const response = await requestClaude(apiKey, {
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content?.filter((part) => part.type === "text").map((part) => part.text ?? "").join("") ?? "";
    const generated = GeneratedPost.parse(extractJson(text));
    const slug = generated.slug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const words = generated.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    const { data: saved, error } = await context.supabase.from("blog_posts").insert({
      title: generated.title,
      slug,
      excerpt: generated.excerpt,
      content: generated.content,
      category: data.category,
      tags: generated.tags ?? [data.keyword],
      meta_title: generated.meta_title ?? generated.title.slice(0, 70),
      meta_description: generated.meta_description ?? generated.excerpt.slice(0, 170),
      reading_time: Math.max(1, Math.ceil(words / 220)),
      is_published: false,
    }).select().single();
    if (error) throw new Response(error.message, { status: error.code === "23505" ? 409 : 500 });
    return saved;
  });
