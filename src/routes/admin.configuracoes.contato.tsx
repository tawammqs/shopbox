import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/contato")({
  component: ContatoPage,
});

type Info = {
  company_name: string;
  tax_id: string;
  store_email: string;
  address: string;
  phone: string;
  contact_text: string;
};
const EMPTY: Info = { company_name: "", tax_id: "", store_email: "", address: "", phone: "", contact_text: "" };

function ContatoPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [form, setForm] = useState<Info>(EMPTY);

  const { data } = useQuery({
    queryKey: ["contact-info", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("store_contact_info").select("*").eq("store_id", store!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (data) setForm({
      company_name: data.company_name ?? "",
      tax_id: data.tax_id ?? "",
      store_email: data.store_email ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      contact_text: data.contact_text ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const { error } = await supabase
        .from("store_contact_info")
        .upsert({ store_id: store.id, ...form }, { onConflict: "store_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informações de contato salvas");
      qc.invalidateQueries({ queryKey: ["contact-info"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = (k: keyof Info, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Informação de contato</h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <Field label="Nome da empresa / Nome do responsável">
          <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
        </Field>
        <Field label="CNPJ ou CPF">
          <Input value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="E-mail da loja" hint="Pode ser diferente do e-mail que você usa para acessar seu painel administrador.">
          <Input type="email" value={form.store_email} onChange={(e) => set("store_email", e.target.value)} />
        </Field>
        <Field label="Endereço da loja">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Telefone da sua loja">
          <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Texto informativo para contato" hint="Informação adicional que você queira exibir no formulário de contato.">
          <Textarea rows={3} value={form.contact_text} onChange={(e) => set("contact_text", e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={() => data && setForm({
            company_name: data.company_name ?? "", tax_id: data.tax_id ?? "", store_email: data.store_email ?? "",
            address: data.address ?? "", phone: data.phone ?? "", contact_text: data.contact_text ?? "",
          })}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
            Salvar
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-[#6b7280]">{hint}</p>}
    </div>
  );
}
