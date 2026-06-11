import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { fetchStaticPage } from "@/lib/storefront";
import { useStorefront } from "@/components/storefront/StoreContext";

export const Route = createFileRoute("/loja/$slug/pagina/$pageSlug")({
  component: StaticPage,
});

function StaticPage() {
  const { pageSlug } = Route.useParams();
  const { store } = useStorefront();
  const { data, isLoading } = useQuery({
    queryKey: ["static-page", store.id, pageSlug],
    queryFn: () => fetchStaticPage(store.id, pageSlug),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="font-display text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">A página que você procura não existe.</p>
        <Link
          to="/loja/$slug"
          params={{ slug: store.slug }}
          className="mt-4 inline-block text-sm text-accent underline"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 font-display text-3xl font-bold">{data.title}</h1>
      <div className="prose prose-gray max-w-none prose-headings:font-display prose-a:text-accent">
        <ReactMarkdown>{data.content_md ?? ""}</ReactMarkdown>
      </div>
    </article>
  );
}
