import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { maskPhoneBR, onlyDigits } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/equipe")({
  head: () => ({ meta: [{ title: "Equipe de vendas — ShopBox" }] }),
  component: SalesTeamPage,
});

type Member = {
  id: string;
  name: string;
  whatsapp: string;
  photo_url: string | null;
  is_active: boolean;
  position: number;
};

function SalesTeamPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [draft, setDraft] = useState({ name: "", whatsapp: "", photo_url: "" });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ["admin-sales-team", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_sales_team")
        .select("id, name, whatsapp, photo_url, is_active, position")
        .eq("store_id", store!.id)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-sales-team", store?.id] });

  const add = useMutation({
    mutationFn: async () => {
      const digits = onlyDigits(draft.whatsapp);
      if (draft.name.trim().length < 2) throw new Error("Informe o nome do vendedor");
      if (digits.length < 10) throw new Error("WhatsApp inválido (use DDD + número)");
      const { error } = await supabase.from("store_sales_team").insert({
        store_id: store!.id,
        name: draft.name.trim(),
        whatsapp: digits,
        photo_url: draft.photo_url || null,
        position: team.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ name: "", whatsapp: "", photo_url: "" });
      toast.success("Vendedor adicionado");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      const { error } = await supabase.from("store_sales_team").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_sales_team").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vendedor removido");
      refresh();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Equipe de vendas</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Com 2 ou mais vendedores ativos, o cliente escolhe com quem falar ao clicar no botão de WhatsApp ou finalizar
          o pedido. Com nenhum ou apenas um, o atendimento segue direto para o número configurado.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#111827]">Adicionar vendedor</h2>
        <div className="grid gap-4 md:grid-cols-[120px_1fr_1fr_auto] md:items-end">
          <div>
            <Label className="text-sm">Foto</Label>
            <div className="mt-1">
              {store?.id && (
                <ImageUpload
                  bucket="logo"
                  storeId={store.id}
                  value={draft.photo_url || null}
                  onChange={(url) => setDraft((d) => ({ ...d, photo_url: url ?? "" }))}
                  label="Foto"
                />
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm">Nome</Label>
            <Input
              className="mt-1"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Vendedora Julia"
            />
          </div>
          <div>
            <Label className="text-sm">WhatsApp com DDD</Label>
            <Input
              className="mt-1"
              value={draft.whatsapp}
              onChange={(e) => setDraft((d) => ({ ...d, whatsapp: maskPhoneBR(e.target.value) }))}
              placeholder="(18) 99999-1111"
              inputMode="tel"
            />
          </div>
          <Button
            onClick={() => add.mutate()}
            disabled={add.isPending || !store?.id}
            className="bg-[#25d366] text-white hover:bg-[#1fb955]"
          >
            {add.isPending ? "Adicionando…" : "Adicionar"}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#111827]">Vendedores cadastrados</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#6b7280]" />
          </div>
        ) : team.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6b7280]">Nenhum vendedor cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {team.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366]/15">
                    <User className="h-6 w-6 text-[#25d366]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Input
                    className="h-8 border-transparent px-1 font-medium hover:border-gray-200"
                    defaultValue={m.name}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== m.name) update.mutate({ id: m.id, patch: { name: v } });
                    }}
                  />
                  <p className="px-1 text-xs text-[#6b7280]">{maskPhoneBR(m.whatsapp)}</p>
                </div>
                <button
                  title={m.is_active ? "Ativo" : "Inativo"}
                  onClick={() => update.mutate({ id: m.id, patch: { is_active: !m.is_active } })}
                  className="rounded-md p-2 text-[#6b7280] hover:bg-gray-100"
                >
                  {m.is_active ? <Eye className="h-4 w-4 text-[#25d366]" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  title="Remover"
                  onClick={() => remove.mutate(m.id)}
                  className="rounded-md p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
