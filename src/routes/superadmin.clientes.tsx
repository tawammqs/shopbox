import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Search,
  Mail,
  Store as StoreIcon,
  ExternalLink,
  Power,
  PowerOff,
  Copy,
  KeyRound,
  LogIn,
  MessageCircle,
  Hash,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  searchClients,
  sendPasswordResetForUser,
  impersonateStore,
  type SuperadminClient,
} from "@/lib/superadmin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/superadmin/clientes")({
  component: SuperadminClientesPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatWhatsapp(raw: string | null) {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar");
  }
}

function SuperadminClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const search$ = useServerFn(searchClients);
  const sendReset$ = useServerFn(sendPasswordResetForUser);
  const impersonate$ = useServerFn(impersonateStore);

  const clientsQ = useQuery({
    queryKey: ["sa-clients-v2"],
    queryFn: () => search$({ data: {} }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("stores").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? "Loja reativada" : "Loja suspensa");
      qc.invalidateQueries({ queryKey: ["sa-clients-v2"] });
      qc.invalidateQueries({ queryKey: ["sa-stores"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendReset = useMutation({
    mutationFn: (user_id: string) =>
      sendReset$({
        data: {
          user_id,
          redirect_to: `${window.location.origin}/reset-password`,
        },
      }),
    onSuccess: (r) => {
      toast.success(`E-mail de redefinição enviado para ${r.email}`);
      if (r.action_link) {
        navigator.clipboard.writeText(r.action_link).catch(() => {});
        toast.message("Link de redefinição copiado para a área de transferência");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const impersonate = useMutation({
    mutationFn: ({ store_id, reason }: { store_id: string; reason: string }) =>
      impersonate$({
        data: {
          store_id,
          reason,
          redirect_to: `${window.location.origin}/admin/dashboard`,
        },
      }),
    onSuccess: (r) => {
      if (!r.action_link) {
        toast.error("Link de acesso não foi gerado");
        return;
      }
      // Abre em nova aba para preservar a sessão de superadmin atual
      const win = window.open(r.action_link, "_blank", "noopener,noreferrer");
      if (!win) {
        navigator.clipboard.writeText(r.action_link).catch(() => {});
        toast.message(
          "Pop-up bloqueado — link copiado, abra em uma aba anônima para não desconectar do superadmin",
        );
      } else {
        toast.success(`Acesso liberado como ${r.store_name}. Abra em aba anônima para não trocar sua sessão.`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo<SuperadminClient[]>(() => {
    const list = clientsQ.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    const qDigits = q.replace(/\D/g, "");
    return list.filter((c) => {
      if (c.email.toLowerCase().includes(q)) return true;
      if (c.user_id.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 4 && (c.whatsapp ?? "").replace(/\D/g, "").includes(qDigits)) return true;
      return c.stores.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (qDigits.length >= 4 && (s.whatsapp ?? "").replace(/\D/g, "").includes(qDigits)),
      );
    });
  }, [clientsQ.data, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Buscar lojistas por nome, e-mail, WhatsApp ou ID. Você pode enviar redefinição de senha ou
          entrar na conta para suporte.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {clientsQ.isLoading ? "Carregando…" : `${filtered.length} ${filtered.length === 1 ? "cliente" : "clientes"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, WhatsApp, slug ou ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {clientsQ.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando clientes…
            </div>
          ) : clientsQ.error ? (
            <div className="py-12 text-center text-sm text-destructive">
              {(clientsQ.error as Error).message}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => (
                <ClientCard
                  key={c.user_id}
                  client={c}
                  onSendReset={() => sendReset.mutate(c.user_id)}
                  onImpersonate={(store_id) => {
                    const reason =
                      window.prompt("Motivo do acesso (auditoria):", "Suporte ao lojista") ?? "";
                    if (!reason.trim()) {
                      toast.error("Motivo é obrigatório");
                      return;
                    }
                    impersonate.mutate({ store_id, reason });
                  }}
                  onToggleActive={(id, active) => toggleActive.mutate({ id, active })}
                  busy={
                    sendReset.isPending ||
                    impersonate.isPending ||
                    toggleActive.isPending
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientCard({
  client: c,
  onSendReset,
  onImpersonate,
  onToggleActive,
  busy,
}: {
  client: SuperadminClient;
  onSendReset: () => void;
  onImpersonate: (storeId: string) => void;
  onToggleActive: (storeId: string, active: boolean) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Identificação do usuário */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{c.email}</span>
            <button
              onClick={() => copy(c.email, "E-mail")}
              className="text-muted-foreground hover:text-foreground"
              title="Copiar e-mail"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {c.whatsapp && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{formatWhatsapp(c.whatsapp)}</span>
              <button
                onClick={() => copy(c.whatsapp ?? "", "WhatsApp")}
                className="hover:text-foreground"
                title="Copiar WhatsApp"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-3 w-3 shrink-0" />
            <span className="font-mono truncate">{c.user_id}</span>
            <button
              onClick={() => copy(c.user_id, "ID")}
              className="hover:text-foreground"
              title="Copiar ID"
            >
              <Copy className="h-3 w-3" />
            </button>
            <span className="ml-2">cadastrado em {formatDate(c.created_at)}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onSendReset}
          disabled={busy}
          className="shrink-0"
        >
          <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Redefinir senha
        </Button>
      </div>

      {/* Lojas */}
      <div className="space-y-2 pt-2 border-t">
        {c.stores.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2"
          >
            <StoreIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{s.name}</span>
            <Badge variant={s.active ? "default" : "secondary"} className="text-[10px]">
              {s.active ? "Ativa" : "Suspensa"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {s.subscription_status}
            </Badge>
            <span className="text-xs text-muted-foreground">/{s.slug}</span>

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Link
                to="/loja/$slug"
                params={{ slug: s.slug }}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Loja <ExternalLink className="h-3 w-3" />
              </Link>
              <Button
                size="sm"
                variant="default"
                onClick={() => onImpersonate(s.id)}
                disabled={busy}
                className="h-7 text-xs"
              >
                <LogIn className="mr-1 h-3 w-3" /> Entrar como
              </Button>
              <Button
                size="sm"
                variant={s.active ? "outline" : "default"}
                onClick={() => onToggleActive(s.id, !s.active)}
                disabled={busy}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
