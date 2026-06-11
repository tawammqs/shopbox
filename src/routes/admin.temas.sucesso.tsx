import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/temas/sucesso")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || "",
    theme: (search.theme as string) || "",
  }),
  head: () => ({ meta: [{ title: "Compra confirmada — ShopBox" }] }),
  component: ThemeSuccessPage,
});

function ThemeSuccessPage() {
  const navigate = useNavigate();
  const { session_id, theme } = Route.useSearch();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({ to: "/admin/temas" });
    }, 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-[#25d366]" />
        </div>
        <h1 className="text-2xl font-bold text-[#111827]">Compra confirmada! 🎉</h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          {theme
            ? <>O tema <strong>{theme}</strong> foi liberado para sua loja.</>
            : <>Seu tema foi liberado para a sua loja.</>}
          {" "}A ativação acontece automaticamente em alguns instantes.
        </p>
        {session_id && (
          <p className="mt-2 text-[11px] text-gray-400">
            Sessão: {session_id.slice(0, 24)}…
          </p>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            to="/admin/temas"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#25d366] px-6 text-sm font-semibold text-white hover:bg-[#1fb959]"
          >
            Ir para meus temas →
          </Link>
          <Link
            to="/admin/dashboard"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Voltar para o painel
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-gray-400">
          Redirecionando automaticamente em alguns segundos…
        </p>
      </div>
    </div>
  );
}
