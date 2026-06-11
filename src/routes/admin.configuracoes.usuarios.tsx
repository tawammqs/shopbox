import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, ExternalLink, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/usuarios")({
  component: UsuariosPage,
});

const PERM_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  { label: "Administração", items: [
    { key: "stats", label: "Estatísticas" },
    { key: "view_cost", label: "Ver preços de compra" },
    { key: "full_access", label: "Acesso total" },
  ] },
  { label: "Vendas", items: [
    { key: "sales_list", label: "Ver lista de vendas" },
    { key: "mark_paid", label: "Marcar pagamentos como recebidos" },
    { key: "mark_shipped", label: "Marcar vendas como enviadas" },
    { key: "cancel_sales", label: "Cancelar vendas" },
    { key: "create_sales", label: "Fazer criação de vendas" },
    { key: "abandoned", label: "Carrinhos abandonados" },
  ] },
  { label: "Produtos", items: [
    { key: "products", label: "Produtos" },
    { key: "edit_prices", label: "Editar preços" },
    { key: "categories", label: "Categorias" },
    { key: "price_table", label: "Tabela de preços" },
  ] },
  { label: "Clientes", items: [{ key: "customers", label: "Clientes" }] },
  { label: "Descontos", items: [
    { key: "coupons", label: "Cupons" },
    { key: "promotions", label: "Promoções" },
  ] },
  { label: "Configurações", items: [
    { key: "store_info", label: "Informações da loja" },
    { key: "payments", label: "Formas de pagamento" },
    { key: "emails", label: "E-mails automáticos" },
    { key: "checkout_opts", label: "Opções de checkout" },
    { key: "shipping", label: "Meios de envio" },
    { key: "themes", label: "Temas" },
    { key: "domains", label: "Domínios" },
  ] },
];
const NOTIF_OPTIONS = [
  { key: "messages", label: "Mensagens" },
  { key: "newsletter", label: "Newsletter" },
  { key: "sale", label: "Venda" },
];

type StoreUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: any;
  notifications: any;
  two_factor_enabled: boolean;
  is_owner: boolean;
  user_id: string | null;
};

function UsuariosPage() {
  const { data: store } = useMyStore();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StoreUser | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["store-users", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("store_users").select("*").eq("store_id", store!.id).order("created_at");
      return (data ?? []) as StoreUser[];
    },
  });

  // Always show the current owner row even before any record was created
  const rows: StoreUser[] = useMemo(() => {
    const ownerRow: StoreUser = {
      id: "__owner",
      email: user?.email ?? "",
      name: (user?.user_metadata as any)?.full_name ?? user?.email?.split("@")[0] ?? "Você",
      role: "owner",
      permissions: { full_access: true },
      notifications: { messages: true, sale: true },
      two_factor_enabled: false,
      is_owner: true,
      user_id: user?.id ?? null,
    };
    const hasOwnerRow = users.some((u) => u.is_owner);
    return hasOwnerRow ? users : [ownerRow, ...users];
  }, [users, user]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Usuário removido"); qc.invalidateQueries({ queryKey: ["store-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Usuários e notificações</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-[#6b7280]">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Permissões</th>
                <th className="px-4 py-3">Notificações</th>
                <th className="px-4 py-3">2 passos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isCurrent = r.user_id === user?.id || r.is_owner;
                const perms = Object.entries(r.permissions || {}).filter(([, v]) => v).map(([k]) => k);
                const notifs = Object.entries(r.notifications || {}).filter(([, v]) => v).map(([k]) => k);
                return (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.name || "—"}</span>
                        {isCurrent && <Pill color="green">Usuário atual</Pill>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{r.email}</td>
                    <td className="px-4 py-3">
                      <Pill>{r.role === "owner" || r.permissions?.full_access ? "Acesso total" : perms.length ? `${perms.length} permissões` : "Sem permissões"}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {notifs.length ? notifs.map((n) => <Pill key={n}>{NOTIF_OPTIONS.find((x) => x.key === n)?.label ?? n}</Pill>) : <span className="text-xs text-[#9ca3af]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.two_factor_enabled
                        ? <Pill color="green">Ativado</Pill>
                        : <span className="inline-flex items-center gap-1"><Pill>Desativado</Pill><button className="text-xs font-medium text-[#15803d] hover:underline">Ativar</button></span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!r.is_owner && r.id !== "__owner" && (
                          <button onClick={() => { setEditing(r); setOpen(true); }} className="rounded-md p-1.5 text-[#6b7280] hover:bg-gray-100">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {!isCurrent && r.id !== "__owner" && (
                          <button onClick={() => remove.mutate(r.id)} className="rounded-md p-1.5 text-[#ef4444] hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-gray-100 md:hidden">
          {rows.map((r) => {
            const isCurrent = r.user_id === user?.id || r.is_owner;
            return (
              <div key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.name || "—"}</span>
                      {isCurrent && <Pill color="green">Você</Pill>}
                    </div>
                    <p className="truncate text-xs text-[#6b7280]">{r.email}</p>
                  </div>
                  <Shield className="h-4 w-4 text-[#9ca3af]" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Pill>{r.role === "owner" ? "Acesso total" : "Personalizado"}</Pill>
                  {r.two_factor_enabled ? <Pill color="green">2FA</Pill> : <Pill>Sem 2FA</Pill>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-[#6b7280]">
          <span>Mostrando 1–{rows.length} usuários de {rows.length}</span>
          <a href="#" className="inline-flex items-center gap-1 font-medium text-[#15803d] hover:underline">
            Mais sobre permissões para usuários <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </section>

      {open && store && (
        <UserDialog
          open={open}
          onOpenChange={setOpen}
          storeId={store.id}
          initial={editing}
          onSaved={() => qc.invalidateQueries({ queryKey: ["store-users"] })}
        />
      )}
    </div>
  );
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "green" }) {
  const cls = color === "green"
    ? "bg-[#25d366]/15 text-[#15803d]"
    : "bg-gray-100 text-[#374151]";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function UserDialog({
  open, onOpenChange, storeId, initial, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; storeId: string;
  initial: StoreUser | null; onSaved: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [accessType, setAccessType] = useState<"custom" | "full">(
    initial?.permissions?.full_access ? "full" : "custom",
  );
  const [perms, setPerms] = useState<Record<string, boolean>>(initial?.permissions ?? {});
  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    initial?.notifications ?? { messages: true, newsletter: false, sale: true },
  );

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        store_id: storeId,
        email,
        role: accessType === "full" ? "full_access" : "custom",
        permissions: accessType === "full" ? { full_access: true } : perms,
        notifications: notifs,
      };
      if (initial?.id && initial.id !== "__owner") {
        const { error } = await supabase.from("store_users").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_users").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Usuário salvo");
      onSaved();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar usuário" : "Adicionar usuário"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6b7280]">Dados da conta</h3>
            <Label className="text-sm">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            <p className="mt-1.5 text-xs text-[#6b7280]">
              Confirmação do e-mail necessária — o novo usuário receberá um e-mail com instruções para criar a senha e acessar o administrador.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6b7280]">Permissões</h3>
            <RadioGroup value={accessType} onValueChange={(v) => setAccessType(v as any)} className="space-y-2">
              <div className="flex items-center gap-2"><RadioGroupItem value="custom" id="r-c" /><Label htmlFor="r-c" className="font-normal">Personalizar as permissões</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="full" id="r-f" /><Label htmlFor="r-f" className="font-normal">Acesso total</Label></div>
            </RadioGroup>

            {accessType === "custom" && (
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {PERM_GROUPS.map((g) => (
                  <div key={g.label}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">{g.label}</h4>
                    <div className="space-y-1.5">
                      {g.items.map((it) => (
                        <label key={it.key} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={!!perms[it.key]}
                            onCheckedChange={(v) => setPerms({ ...perms, [it.key]: !!v })}
                          />
                          {it.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#6b7280]">Notificações</h3>
            <div className="space-y-1.5">
              {NOTIF_OPTIONS.map((n) => (
                <label key={n.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={!!notifs[n.key]} onCheckedChange={(v) => setNotifs({ ...notifs, [n.key]: !!v })} />
                  {n.label}
                </label>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !email} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
            {save.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
