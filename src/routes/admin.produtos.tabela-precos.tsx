import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";

export const Route = createFileRoute("/admin/produtos/tabela-precos")({
  head: () => ({ meta: [{ title: "Tabela de Preços — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const isPremium = store?.plan?.slug === "premium";

  if (isPremium) {
    return (
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Tabela de Preços</h1>
          <p className="mt-1 text-sm text-[#6b7280]">Crie tabelas de preços para atacado e segmentos de clientes.</p>
        </header>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-[#6b7280]">
          Configure suas tabelas de preço aqui — em breve.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#25d366]">
        CENTRALIZAÇÃO E CONTROLE
      </p>
      <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-[#111827]">
        Venda atacado e varejo no mesmo site
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-[#6b7280]">
        Crie tabelas de preços exclusivas, regras de compra mínima e gerencie um estoque
        unificado para todos os seus clientes, sem precisar de uma segunda loja.
      </p>
      <Link
        to="/admin/plano"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-[#25d366] px-7 text-base font-semibold text-white hover:bg-[#1fb959]"
      >
        Criar tabela de preços
      </Link>

      <h2 className="mt-16 text-lg font-semibold text-[#111827]">Como funciona?</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            n: "1",
            t: "Crie sua Tabela de Preços",
            d: "Defina o percentual de desconto para a loja toda, categorias ou produtos selecionados.",
          },
          {
            n: "2",
            t: "Defina as Regras de Compra",
            d: "Configure o mínimo de compra para proteger sua margem.",
          },
          {
            n: "3",
            t: "Associe seus clientes",
            d: "Envie o link de auto-cadastro para seus clientes atacadistas.",
          },
        ].map((s) => (
          <div key={s.n} className="rounded-xl border border-gray-200 bg-white p-6 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0fdf4] text-sm font-bold text-[#25d366]">
              {s.n}
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#111827]">{s.t}</h3>
            <p className="mt-2 text-sm text-[#6b7280]">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
