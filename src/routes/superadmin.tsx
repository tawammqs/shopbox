import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { Store, LayoutDashboard, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  beforeLoad: async () => {
    console.log("[SUPERADMIN] beforeLoad start");
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    console.log("[SUPERADMIN] getUser →", { user: userData?.user?.email, id: userData?.user?.id, err: userErr?.message });
    if (!userData.user) {
      console.warn("[SUPERADMIN] No user → redirect /login");
      throw redirect({ to: "/login" });
    }
    const { data: roles, error: rolesErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    console.log("[SUPERADMIN] roles →", { roles, err: rolesErr?.message });
    if (!roles?.some((r) => r.role === "platform_admin")) {
      console.warn("[SUPERADMIN] Not platform_admin → redirect /");
      throw redirect({ to: "/" });
    }
    console.log("[SUPERADMIN] Access granted");
  },
  component: SuperadminLayout,
});

const NAV = [
  { to: "/superadmin/lojas", label: "Lojas & MRR", icon: LayoutDashboard },
  { to: "/superadmin/clientes", label: "Clientes", icon: Users },
] as const;

function SuperadminLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Shopbox
              </div>
              <div className="font-semibold">Painel Superadmin</div>
            </div>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </Link>
        </div>
      </header>
      <div className="container grid gap-6 py-6 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
