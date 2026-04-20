import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Mail, Store as StoreIcon, ExternalLink, Power, PowerOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/clientes")({
  component: SuperadminClientesPage,
});

type StoreItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  subscription_status: string;
  created_at: string;
  owner_user_id: string;
};

type ClientRow = {
  user_id: string;
  email: string;
  created_at: string;
  stores: StoreItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SuperadminClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const clientsQ = useQuery({
    queryKey: ["sa-clients"],
    queryFn: async (): Promise<ClientRow[]> => {
      // Buscar todas as lojas com seus donos
      const { data: stores, error: sErr } = await supabase
        .from("stores")
        .select("id, name, slug, active, subscription_status, created_at, owner_user_id")
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;

      // Agrupar por owner
      const byOwner = new Map<string, StoreItem[]>();
      (stores ?? []).forEach((s) => {
        const arr = byOwner.get(s.owner_user_id) ?? [];
        arr.push(s as StoreItem);
        byOwner.set(s.owner_user_id, arr);
      });

      // Buscar e-mails via edge function não disponível — usar admin RPC alternativa.
      // Como não há acesso direto a auth.users via JS SDK, usar a função RPC list_admin_users
      // se existir; senão, retornar sem e-mail. Aqui usamos uma view auxiliar criada via migration.
      const ownerIds = Array.from(byOwner.keys());
      let usersById = new Map<string, { email: string; created_at: string }>();
      if (ownerIds.length > 0) {
        const { data: users, error: uErr } = await supabase.rpc("admin_list_users", {
          _user_ids: ownerIds,
        });
        if (!uErr && Array.isArray(users)) {
          users.forEach((u: { id: string; email: string; created_at: string }) => {
            usersById.set(u.id, { email: u.email, created_at: u.created_at });
          });
        }
      }

      return ownerIds.map((uid) => {
        const u = usersById.get(uid);
        return {
          user_id: uid,
          email: u?.email ?? "(e-mail indisponível)",
          created_at: u?.created_at ?? byOwner.get(uid)![0].created_at,
          stores: byOwner.get(uid) ?? [],
        };
      });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("stores").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? "Loja reativada" : "Loja suspensa");
      qc.invalidateQueries({ queryKey: ["sa-clients"] });
      qc.invalidateQueries({ queryKey: ["sa-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clients = clientsQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.stores.some(
          (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
        ),
    );
  }, [clients, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Todos os usuários da Shopbox e as lojas que possuem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail, nome de loja ou slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {clientsQ.isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Lojas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{c.email}</span>
                        </div>
                        <div className="ml-6 mt-0.5 text-xs text-muted-foreground">
                          {c.user_id.slice(0, 8)}…
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          {c.stores.map((s) => (
                            <div
                              key={s.id}
                              className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5"
                            >
                              <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium">{s.name}</span>
                              <Badge
                                variant={s.active ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {s.active ? "Ativa" : "Suspensa"}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {s.subscription_status}
                              </Badge>
                              <Link
                                to="/loja/$slug"
                                params={{ slug: s.slug }}
                                target="_blank"
                                className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Abrir <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          {c.stores.map((s) => (
                            <Button
                              key={s.id}
                              size="sm"
                              variant={s.active ? "outline" : "default"}
                              onClick={() =>
                                toggleActive.mutate({ id: s.id, active: !s.active })
                              }
                              disabled={toggleActive.isPending}
                              className="h-7 text-xs"
                            >
                              {s.active ? (
                                <>
                                  <PowerOff className="mr-1 h-3 w-3" /> Suspender
                                </>
                              ) : (
                                <>
                                  <Power className="mr-1 h-3 w-3" /> Reativar
                                </>
                              )}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
