import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, LayoutDashboard, ArrowLeft, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin")({
  component: SuperadminLayout,
});

const NAV = [
  { to: "/superadmin/lojas", label: "Lojas & MRR", icon: LayoutDashboard },
  { to: "/superadmin/clientes", label: "Clientes", icon: Users },
] as const;

type GateState = "checking" | "ok" | "error";

function SuperadminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GateState>("checking");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      const redirectTo = location.pathname + location.search;
      navigate({ to: "/login", search: { redirect: redirectTo } as never, replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (cancelled) return;

        if (error) {
          setErrorMsg(error.message);
          setState("error");
          return;
        }

        const isAdmin = data?.some((r) => r.role === "platform_admin");
        if (!isAdmin) {
          navigate({ to: "/", replace: true });
          return;
        }
        setState("ok");
      } catch (err: any) {
        if (cancelled) return;
        setErrorMsg(err?.message ?? "Erro inesperado ao verificar acesso");
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, navigate, location.pathname, location.search]);

  if (authLoading || state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Carregando acesso…</span>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Não foi possível verificar o acesso</h1>
          <p className="text-sm text-muted-foreground">{errorMsg ?? "Erro desconhecido"}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
