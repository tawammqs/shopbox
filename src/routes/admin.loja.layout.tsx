import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyStore } from "@/hooks/useMyStore";
import { MoreVertical } from "lucide-react";

export const Route = createFileRoute("/admin/loja/layout")({
  head: () => ({ meta: [{ title: "Layout — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Layout</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#111827]">Layout atual</h3>
            <div className="mt-4 flex items-start gap-4">
              <div className="h-32 w-44 shrink-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-[#111827]">Tema Atual</p>
                  <span className="rounded-full border border-[#25d366] bg-[#f0fdf4] px-2 py-0.5 text-[11px] font-medium text-[#25d366]">Layout atual</span>
                </div>
                <Link to="/admin/personalizar-loja" className="mt-3 inline-block h-10 rounded-lg bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb959]">
                  Editar layout atual
                </Link>
              </div>
              <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><MoreVertical className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#111827]">Mais temas disponíveis</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200" />
              ))}
            </div>
            <p className="mt-3 text-xs text-[#6b7280]">Mais de 10 temas disponíveis</p>
            <Link to="/admin/temas" className="mt-3 inline-block h-10 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
              Ver outros temas
            </Link>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#111827]">Logotipo da sua marca</h3>
            <div className="mt-4 flex h-24 items-center justify-center rounded-lg bg-gray-50">
              {store?.logo_url ? <img src={store.logo_url} alt="Logo" className="max-h-20 max-w-full" /> : <span className="text-xs text-[#9ca3af]">Sem logo</span>}
            </div>
            <Link to="/admin/configuracoes" className="mt-3 inline-block h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-medium hover:bg-gray-50">
              Editar logotipo
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
