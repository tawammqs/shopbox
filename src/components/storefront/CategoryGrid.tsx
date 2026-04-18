import { Link } from "@tanstack/react-router";
import { useStorefront } from "./StoreContext";

export function CategoryGrid() {
  const { store, categories } = useStorefront();
  const roots = categories.filter((c) => !c.parent_id).slice(0, 8);
  if (roots.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="mb-5 font-display text-2xl font-bold md:text-3xl">Navegue por categoria</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {roots.map((c) => (
          <Link
            key={c.id}
            to="/loja/$slug/categoria/$categorySlug"
            params={{ slug: store.slug, categorySlug: c.slug }}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            {c.image_url && (
              <img
                src={c.image_url}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 to-transparent p-4">
              <span className="font-display text-lg font-semibold text-background">{c.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
