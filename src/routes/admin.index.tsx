import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, ExternalLink, Shield, Info, X } from "lucide-react";
import { useMyStore } from "@/hooks/useMyStore";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Início — ShopBox" }] }),
  component: InicioPage,
});

type Step = {
  id: string;
  title: string;
  description: string;
  body: React.ReactNode;
  cta?: { label: string; to: string; external?: boolean };
  done: boolean;
};

function InicioPage() {
  const { data: store } = useMyStore();
  const [counts, setCounts] = useState<{ products: number; categories: number; banners: number; orders: number } | null>(null);
  const [dismissEmail, setDismissEmail] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    (async () => {
      const [p, c, b, o] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("categories").select("id", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("banners").select("id", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("store_id", store.id),
      ]);
      setCounts({
        products: p.count ?? 0,
        categories: c.count ?? 0,
        banners: b.count ?? 0,
        orders: o.count ?? 0,
      });
    })();
  }, [store?.id]);

  const steps: Step[] = [
    {
      id: "personalizar",
      title: "Personalize sua loja",
      description: "Defina logo, cores, banners e identidade visual.",
      body: <p>Acesse a personalização e deixe sua loja com a cara da sua marca.</p>,
      cta: { label: "Personalizar loja", to: "/admin/personalizar-loja" },
      done: !!(store?.logo_url && (counts?.banners ?? 0) > 0),
    },
    {
      id: "produtos",
      title: "Cadastre seus produtos",
      description: "Adicione produtos, variações e preços.",
      body: <p>Você tem {counts?.products ?? 0} produtos cadastrados.</p>,
      cta: { label: "Adicionar produto", to: "/admin/produtos" },
      done: (counts?.products ?? 0) > 0,
    },
    {
      id: "categorias",
      title: "Organize em categorias",
      description: "Agrupe produtos para facilitar a navegação.",
      body: <p>Você tem {counts?.categories ?? 0} categorias.</p>,
      cta: { label: "Criar categoria", to: "/admin/categorias" },
      done: (counts?.categories ?? 0) > 0,
    },
    {
      id: "whatsapp",
      title: "Configure o WhatsApp",
      description: "Receba pedidos direto no seu WhatsApp.",
      body: <p>Configure o número de WhatsApp que receberá os pedidos.</p>,
      cta: { label: "Configurar", to: "/admin/configuracoes" },
      done: !!store?.whatsapp,
    },
    {
      id: "pagamento",
      title: "Pagamento e envio",
      description: "Configure formas de pagamento e frete.",
      body: <p>Configure as opções de pagamento e cálculo de frete.</p>,
      cta: { label: "Configurar", to: "/admin/configuracoes" },
      done: false,
    },
    {
      id: "publicar",
      title: "Publique sua loja",
      description: "Compartilhe o link e comece a vender.",
      body: <p>Sua loja já está online em <code>/loja/{store?.slug}</code>.</p>,
      cta: { label: "Ver loja", to: `/loja/${store?.slug ?? ""}`, external: true },
      done: (counts?.orders ?? 0) > 0,
    },
  ];

  const firstDoneIdx = steps.findIndex((s) => s.done);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Início</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Confira os passos para deixar sua loja do seu jeito!</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="divide-y divide-gray-200">
          {steps.map((step, idx) => (
            <StepRow
              key={step.id}
              step={step}
              showViewStore={idx === firstDoneIdx && step.done && step.id !== "publicar"}
              storeSlug={store?.slug ?? ""}
            />
          ))}
        </div>
      </section>

      <h2 className="mt-10 mb-3 text-base font-semibold text-[#111827]">Medidas de segurança</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#25d366]" />
            <div>
              <p className="text-sm font-medium text-[#111827]">Proteja sua conta</p>
              <p className="text-xs text-[#6b7280]">Habilite a verificação em 2 passos para mais segurança.</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
        {!dismissEmail && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-[#25d366]" />
              <div>
                <p className="text-sm font-medium text-[#111827]">Confirme seu e-mail</p>
                <p className="text-xs text-[#6b7280]">Verifique seu e-mail e garanta seu acesso.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-sm font-medium text-[#25d366] hover:underline">Reenviar e-mail</button>
              <button onClick={() => setDismissEmail(true)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ step, showViewStore, storeSlug }: { step: Step; showViewStore: boolean; storeSlug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50"
      >
        {step.done ? (
          <CheckCircle2 className="h-5 w-5 text-[#25d366]" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300" />
        )}
        <div className="flex-1">
          <p className={cn("text-sm font-medium text-[#111827]", step.done && "text-gray-400 line-through")}>
            {step.title}
          </p>
          <p className="text-xs text-[#6b7280]">{step.description}</p>
        </div>
        {showViewStore && (
          <a
            href={`/loja/${storeSlug}`}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#111827] hover:bg-gray-50"
          >
            Ver loja <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <ChevronDown className={cn("h-5 w-5 text-gray-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 text-sm text-[#374151]">
          <div className="mb-3">{step.body}</div>
          {step.cta && (
            step.cta.external ? (
              <a
                href={step.cta.to}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1fb959]"
              >
                {step.cta.label} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                to={step.cta.to}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1fb959]"
              >
                {step.cta.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
