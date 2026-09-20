import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Edit3, Eye, EyeOff, Loader2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BLOG_CATEGORIES, deleteBlogPost, generateBlogPost, listAdminPosts, saveBlogPost, setBlogPostPublished, type BlogPost } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/superadmin/blog")({
  head: () => ({ meta: [
    { title: "Blog — Superadmin ShopBox" }, { name: "description", content: "Gerencie os artigos do Blog ShopBox." },
    { property: "og:title", content: "Blog — Superadmin ShopBox" }, { property: "og:description", content: "Gerencie os artigos do Blog ShopBox." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SuperadminBlogPage,
});

type FormState = Omit<BlogPost, "created_at" | "updated_at" | "published_at">;
const EMPTY: FormState = { id: "", title: "", slug: "", excerpt: "", content: "", cover_image_url: null, author_name: "Time ShopBox", author_avatar_url: null, category: BLOG_CATEGORIES[0], tags: [], meta_title: null, meta_description: null, reading_time: 5, is_published: false };
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Não foi possível concluir a ação."; }

function SuperadminBlogPage() {
  const qc = useQueryClient();
  const listPosts = useServerFn(listAdminPosts), savePost = useServerFn(saveBlogPost), publishPost = useServerFn(setBlogPostPublished), removePost = useServerFn(deleteBlogPost), generatePost = useServerFn(generateBlogPost);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false), [generateOpen, setGenerateOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [generation, setGeneration] = useState({ theme: "", keyword: "", category: BLOG_CATEGORIES[0] as (typeof BLOG_CATEGORIES)[number] });
  const query = useQuery({ queryKey: ["superadmin-blog"], queryFn: () => listPosts() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["superadmin-blog"] });
  const save = useMutation({ mutationFn: (published: boolean) => savePost({ data: { ...form, id: form.id || null, cover_image_url: form.cover_image_url || null, author_avatar_url: form.author_avatar_url || null, meta_title: form.meta_title || null, meta_description: form.meta_description || null, tags: form.tags.filter(Boolean), is_published: published } }), onSuccess: (_post, published) => { toast.success(published ? "Artigo publicado" : "Rascunho salvo"); setEditorOpen(false); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const publish = useMutation({ mutationFn: ({ id, published }: { id: string; published: boolean }) => publishPost({ data: { id, published } }), onSuccess: (_d, vars) => { toast.success(vars.published ? "Artigo publicado" : "Artigo movido para rascunhos"); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const remove = useMutation({ mutationFn: (id: string) => removePost({ data: { id } }), onSuccess: () => { toast.success("Artigo excluído"); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const generate = useMutation({ mutationFn: () => generatePost({ data: generation }), onSuccess: (post) => { toast.success("Rascunho criado pela IA"); setGenerateOpen(false); setForm(post); setEditorOpen(true); refresh(); }, onError: (e) => toast.error(errorMessage(e)) });
  const posts = useMemo(() => (query.data ?? []).filter((post) => post.title.toLowerCase().includes(search.toLowerCase()) || post.category.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const openNew = () => { setForm({ ...EMPTY }); setEditorOpen(true); };
  const openEdit = (post: BlogPost) => { const { created_at: _created, updated_at: _updated, published_at: _published, ...editable } = post; setForm(editable); setEditorOpen(true); };
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((old) => ({ ...old, [key]: value }));
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-semibold">Blog</h1><p className="text-sm text-muted-foreground">Crie, revise e publique conteúdo para a ShopBox.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setGenerateOpen(true)}><Sparkles className="h-4 w-4" />Gerar artigo com IA</Button><Button onClick={openNew}><Plus className="h-4 w-4" />Novo post</Button></div></div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título ou categoria" className="pl-9" /></div>
    <div className="overflow-hidden rounded-lg border bg-card"><Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
      {query.isLoading && <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>}
      {!query.isLoading && posts.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Nenhum artigo encontrado.</TableCell></TableRow>}
      {posts.map((post) => <TableRow key={post.id}><TableCell><div className="max-w-md font-medium">{post.title}</div><div className="text-xs text-muted-foreground">/{post.slug}</div></TableCell><TableCell>{post.category}</TableCell><TableCell><Badge variant={post.is_published ? "default" : "secondary"}>{post.is_published ? "Publicado" : "Rascunho"}</Badge></TableCell><TableCell>{new Date(post.published_at ?? post.created_at).toLocaleDateString("pt-BR")}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(post)}><Edit3 className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title={post.is_published ? "Despublicar" : "Publicar"} onClick={() => publish.mutate({ id: post.id, published: !post.is_published })}>{post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button size="icon" variant="ghost" title="Excluir" onClick={() => { if (window.confirm(`Excluir “${post.title}”?`)) remove.mutate(post.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>)}
    </TableBody></Table></div>

    <Dialog open={generateOpen} onOpenChange={setGenerateOpen}><DialogContent><DialogHeader><DialogTitle>Gerar artigo com IA</DialogTitle><DialogDescription>Informe o assunto principal para criar um rascunho completo.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Tema</Label><Textarea value={generation.theme} onChange={(e) => setGeneration((old) => ({ ...old, theme: e.target.value }))} placeholder="Ex.: Como vender tênis pelo WhatsApp" /></div><div><Label>Palavra-chave</Label><Input value={generation.keyword} onChange={(e) => setGeneration((old) => ({ ...old, keyword: e.target.value }))} placeholder="vender tênis pelo WhatsApp" /></div><div><Label>Categoria</Label><Select value={generation.category} onValueChange={(value) => setGeneration((old) => ({ ...old, category: value as typeof old.category }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BLOG_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancelar</Button><Button disabled={generate.isPending || generation.theme.length < 5 || generation.keyword.length < 2} onClick={() => generate.mutate()}>{generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Gerar rascunho</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{form.id ? "Editar artigo" : "Novo artigo"}</DialogTitle><DialogDescription>Revise o conteúdo, a capa e as informações de busca antes de publicar.</DialogDescription></DialogHeader><div className="grid gap-5 md:grid-cols-2"><div className="md:col-span-2"><Label>Título</Label><Input value={form.title} onChange={(e) => { update("title", e.target.value); if (!form.id) update("slug", slugify(e.target.value)); }} /></div><div><Label>Slug</Label><Input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} /></div><div><Label>Categoria</Label><Select value={form.category} onValueChange={(value) => update("category", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BLOG_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="md:col-span-2"><Label>Resumo</Label><Textarea value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} /></div><div className="md:col-span-2"><Label>URL da capa</Label><Input value={form.cover_image_url ?? ""} onChange={(e) => update("cover_image_url", e.target.value || null)} placeholder="https://..." /></div><div className="md:col-span-2"><Label>Conteúdo HTML</Label><Textarea className="min-h-80 font-mono text-sm" value={form.content} onChange={(e) => update("content", e.target.value)} /></div><div><Label>Autor</Label><Input value={form.author_name} onChange={(e) => update("author_name", e.target.value)} /></div><div><Label>Tempo de leitura (min)</Label><Input type="number" min={1} value={form.reading_time} onChange={(e) => update("reading_time", Number(e.target.value) || 1)} /></div><div className="md:col-span-2"><Label>Tags (separadas por vírgula)</Label><Input value={form.tags.join(", ")} onChange={(e) => update("tags", e.target.value.split(",").map((tag) => tag.trim()))} /></div><div><Label>Título SEO</Label><Input value={form.meta_title ?? ""} onChange={(e) => update("meta_title", e.target.value || null)} maxLength={70} /></div><div><Label>Descrição SEO</Label><Textarea value={form.meta_description ?? ""} onChange={(e) => update("meta_description", e.target.value || null)} maxLength={170} /></div></div><DialogFooter><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button><Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate(false)}>Salvar rascunho</Button><Button disabled={save.isPending} onClick={() => save.mutate(true)}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Publicar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}