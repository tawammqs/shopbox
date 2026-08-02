import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Phone, MessageCircle, Users, Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — ShopBox" }] }),
  component: SettingsLayout,
});

type Group = { label: string; items: { to: string; label: string; icon: typeof CreditCard }[] };

const GROUPS: Group[] = [
  {
    label: "PAGAMENTOS",
    items: [{ to: "/admin/configuracoes/pagamentos", label: "Pagamentos", icon: CreditCard }],
  },
  {
    label: "COMUNICAÇÃO",
    items: [
      { to: "/admin/configuracoes/contato", label: "Informação de contato", icon: Phone },
      { to: "/admin/configuracoes/whatsapp", label: "Botão de WhatsApp", icon: MessageCircle },
      { to: "/admin/configuracoes/equipe", label: "Equipe de vendas", icon: Users },
    ],
  },
  {
    label: "CONTEÚDO",
    items: [{ to: "/admin/configuracoes/politicas", label: "Políticas e Sobre a marca", icon: FileText }],
  },
  {
    label: "OUTROS",
    items: [
      { to: "/admin/configuracoes/usuarios", label: "Usuários", icon: Users },
      { to: "/admin/configuracoes/dominios", label: "Domínios", icon: Globe },
    ],
  },
];

function SettingsLayout() {
  const loc = useLocation();
  return (
    <div className="mx-auto flex max-w-7xl gap-6">
      <aside className="hidden w-60 shrink-0 md:block">
        <Link to="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827]">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <nav className="space-y-4 rounded-xl border border-gray-200 bg-white p-3">
          {GROUPS.map((g) => (
            <div key={g.label}>
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const active = loc.pathname === it.to;
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#25d366]/10 text-[#15803d]"
                          : "text-[#374151] hover:bg-gray-50",
                      )}
                    >
                      <Icon className="h-4 w-4" /> {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile nav */}
        <div className="mb-4 -mx-4 flex gap-2 overflow-x-auto px-4 md:hidden">
          {GROUPS.flatMap((g) => g.items).map((it) => {
            const active = loc.pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
                  active ? "border-[#25d366] bg-[#25d366]/10 text-[#15803d]" : "border-gray-200 bg-white text-[#374151]",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
