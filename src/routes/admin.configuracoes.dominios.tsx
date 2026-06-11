import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2, Settings, Eye, Calendar, Lock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/dominios")({
  component: DominiosPage,
});

type Domain = {
  id: string;
  domain: string;
  is_primary: boolean;
  is_default: boolean;
  status: string;
  ssl_status: string;
};

function DominiosPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");

  const planSlug = store?.plan?.slug;
  const canAddCustom = planSlug === "profissional" || planSlug === "premium";

  const { data: domains = [] } = useQuery({
    queryKey: ["store-domains", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase.from("store_domains").select("*").eq("store_id", store!.id).order("created_at");
      return (data ?? []) as Domain[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!store?.id || !newDomain.trim()) return;
      const { error } = await supabase.from("store_domains").insert({
        store_id: store.id,
        domain: newDomain.trim(),
        is_primary: domains.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Domínio adicionado. Enviaremos instruções por e-mail.");
      setNewDomain("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["store-domains"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setPrimary = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("store_domains").update({ is_primary: false }).eq("store_id", store!.id);
      const { error } = await supabase.from("store_domains").update({ is_primary: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["store-domains"] }); toast.success("Domínio principal atualizado"); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["store-domains"] }); toast.success("Domínio removido"); },
  });

  const handleAddClick = () => {
    if (!canAddCustom) setUpgradeOpen(true);
    else setOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Domínios</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            O domínio é o endereço de sua loja na Internet. Você pode ter mais de um e gerenciá-los aqui.
          </p>
        </div>
        <Button onClick={handleAddClick} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
          <Plus className="mr-1.5 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-[#111827]">Administre seus domínios</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-[#6b7280]">
              <tr>
                <th className="px-5 py-3">Domínios</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">SSL</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">shopboxapp.com.br/{store?.slug ?? "loja"}</span>
                    <Pill>Por padrão</Pill>
                  </div>
                </td>
                <td className="px-5 py-3"><Pill color="green">✓ Ativado</Pill></td>
                <td className="px-5 py-3"><Pill color="green">🔒 SSL ativado</Pill></td>
                <td className="px-5 py-3 text-[#9ca3af]">—</td>
              </tr>
              {domains.map((d) => (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm">{d.domain}</span>
                      {d.is_primary && <Pill color="amber">⭐ Principal</Pill>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {d.status === "active" ? <Pill color="green">✓ Ativado</Pill> :
                      d.status === "error" ? <Pill color="red">✗ Erro</Pill> : <Pill color="amber">⏳ Pendente</Pill>}
                  </td>
                  <td className="px-5 py-3">
                    {d.ssl_status === "active" ? <Pill color="green">🔒 SSL ativado</Pill> : <Pill color="amber">⏳ Aguardando</Pill>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {!d.is_primary && (
                        <button title="Tornar principal" onClick={() => setPrimary.mutate(d.id)} className="rounded-md p-1.5 text-[#6b7280] hover:bg-gray-100">
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => remove.mutate(d.id)} className="rounded-md p-1.5 text-[#ef4444] hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[#111827]">Aprenda mais</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <LearnCard icon={Settings} title="Configure seu domínio" desc="Use um domínio próprio para destacar a identidade da sua marca." />
          <LearnCard icon={Eye} title="Verifique a configuração" desc="Siga estes passos para revisar se seu domínio ficou corretamente vinculado." />
          <LearnCard icon={Calendar} title="Consulte o vencimento" desc="Identifique se o registro do seu domínio deve ser renovado em breve." />
          <LearnCard icon={Lock} title="Certificado de segurança" desc="Saiba se seu certificado de segurança está ativo." />
        </div>
        <a href="#" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#15803d] hover:underline">
          Mais sobre domínios <ExternalLink className="h-3 w-3" />
        </a>
      </section>

      {/* Add domain modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar domínio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm">Seu domínio</Label>
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="www.minhaloja.com.br"
            />
            <p className="text-xs text-[#6b7280]">
              Após adicionar, você precisará apontar seu domínio para os nossos servidores. Enviaremos as instruções por e-mail.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => add.mutate()} disabled={!newDomain.trim() || add.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
              Adicionar domínio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recurso disponível em outro plano</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6b7280]">
            Domínio próprio está disponível nos planos Profissional e Premium. Faça upgrade para conectar seu domínio personalizado.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Fechar</Button>
            <Link to="/admin/plano">
              <Button className="bg-[#25d366] text-white hover:bg-[#1fb955]">Ver planos</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "green" | "amber" | "red" }) {
  const cls = {
    gray: "bg-gray-100 text-[#374151]",
    green: "bg-[#25d366]/15 text-[#15803d]",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
  }[color];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function LearnCard({ icon: Icon, title, desc }: { icon: typeof Settings; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <Icon className="mb-2 h-5 w-5 text-[#25d366]" />
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-xs text-[#6b7280]">{desc}</p>
      <a href="#" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#15803d] hover:underline">
        Ver tutorial <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
