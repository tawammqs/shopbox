import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes/whatsapp")({
  component: WhatsAppPage,
});

function WhatsAppPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const [showButton, setShowButton] = useState(true);
  const [loginNumber, setLoginNumber] = useState("");

  // Lê o login_whatsapp atual (não vem em useMyStore por padrão)
  const { data: loginData } = useQuery({
    queryKey: ["store-login-whatsapp", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("login_whatsapp")
        .eq("id", store!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (store) {
      const raw = (store.whatsapp ?? "").replace(/\D/g, "");
      setNumber(raw.startsWith("55") ? raw.slice(2) : raw);
    }
  }, [store?.id]);

  useEffect(() => {
    const raw = ((loginData as any)?.login_whatsapp ?? "").replace(/\D/g, "");
    setLoginNumber(raw.startsWith("55") ? raw.slice(2) : raw);
  }, [loginData]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const digits = number.replace(/\D/g, "");
      const full = digits ? (showButton ? `55${digits}` : "") : "";
      const { error } = await supabase.from("stores").update({ whatsapp: full }).eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("WhatsApp de pedidos salvo");
      qc.invalidateQueries({ queryKey: ["my-store-full"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveLogin = useMutation({
    mutationFn: async () => {
      if (!store?.id) return;
      const digits = loginNumber.replace(/\D/g, "");
      if (digits.length < 10) throw new Error("Informe um número válido com DDD");
      const { error } = await supabase
        .from("stores")
        .update({ login_whatsapp: digits } as any)
        .eq("id", store.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("WhatsApp de acesso atualizado");
      qc.invalidateQueries({ queryKey: ["store-login-whatsapp"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Botão de WhatsApp</h1>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#111827]">WhatsApp de pedidos</h2>
        <p className="mb-4 text-xs text-[#6b7280]">
          Número para onde os pedidos do checkout serão enviados. Alterar este campo <strong>não muda</strong> seu número de acesso ao painel.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Número de telefone</Label>
            <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-[#25d366]/30">
              <span className="flex items-center bg-gray-50 px-3 text-sm font-medium text-[#374151]">+55</span>
              <input
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11999999999"
                className="flex-1 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="show-wa" checked={showButton} onCheckedChange={(v) => setShowButton(!!v)} />
            <Label htmlFor="show-wa" className="cursor-pointer text-sm font-normal leading-relaxed">
              Mostrar um botão na loja para que possam te contatar pelo WhatsApp
            </Label>
          </div>

          <div className="rounded-xl bg-gray-50 p-6">
            <p className="mb-3 text-xs uppercase tracking-wider text-[#6b7280]">Prévia</p>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] shadow-lg">
                <WhatsAppIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-sm text-[#6b7280]">Aparecerá no canto inferior direito da loja</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h2 className="text-base font-semibold text-[#111827]">WhatsApp de acesso ao painel</h2>
        </div>
        <p className="mb-4 text-xs text-[#92400e]">
          Este é o número usado para <strong>fazer login</strong> no painel. Alterar aqui muda sua credencial de acesso — só mude se souber o que está fazendo.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Número de login</Label>
            <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-amber-400/40">
              <span className="flex items-center bg-gray-50 px-3 text-sm font-medium text-[#374151]">+55</span>
              <input
                inputMode="numeric"
                value={loginNumber}
                onChange={(e) => setLoginNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="11999999999"
                className="flex-1 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => saveLogin.mutate()}
              disabled={saveLogin.isPending}
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              {saveLogin.isPending ? "Salvando…" : "Salvar número de login"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
