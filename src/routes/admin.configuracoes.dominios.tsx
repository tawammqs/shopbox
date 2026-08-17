import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Star, Trash2, Settings, Eye, Calendar, Lock, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStore } from "@/hooks/useMyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  addCustomDomain,
  checkDomainStatus,
  removeCustomDomain,
} from "@/lib/custom-domain.functions";

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
  cloudflare_hostname_id: string | null;
  ownership_verification_name: string | null;
  ownership_verification_value: string | null;
};

type DnsInstructions = {
  cname: { type: string; name: string; value: string; description: string };
  ownership: { type: string; name: string; value: string; description: string } | null;
};

function DominiosPage() {
  const { data: store } = useMyStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);

  const addFn = useServerFn(addCustomDomain);
  const checkFn = useServerFn(checkDomainStatus);
  const removeFn = useServerFn(removeCustomDomain);

  const planSlug = store?.plan?.slug;
  const canAddCustom = planSlug === "inicial" || planSlug === "profissional" || planSlug === "premium";

  const { data: domains = [] } = useQuery({
    queryKey: ["store-domains", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("store_domains")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at");
      return (data ?? []) as Domain[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!store?.id || !newDomain.trim()) return null;
      return await addFn({ data: { domain: newDomain.trim(), storeId: store.id } });
    },
    onSuccess: (res) => {
      if (!res) return;
      setNewDomain("");
      setOpen(false);
      setDnsInstructions(res.instructions);
      toast.success("Domínio adicionado! Configure o DNS conforme as instruções.");
      qc.invalidateQueries({ queryKey: ["store-domains"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao adicionar domínio"),
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
    mutationFn: async (d: Domain) => {
      if (d.cloudflare_hostname_id) await removeFn({ data: { storeDomainId: d.id } });
      else await supabase.from("store_domains").delete().eq("id", d.id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["store-domains"] }); toast.success("Domínio removido"); },
    onError: (e: any) => toast.error(e?.message || "Erro ao remover"),
  });

  const check = useMutation({
    mutationFn: async (d: Domain) => await checkFn({ data: { storeDomainId: d.id } }),
    onSuccess: (res) => {
      if (res?.domain_status === "active") toast.success("✅ Domínio ativo e funcionando!");
      else toast.info("⏳ DNS ainda propagando. Tente novamente em algumas horas.");
      qc.invalidateQueries({ queryKey: ["store-domains"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao verificar"),
  });

  const handleAddClick = () => {
    if (!canAddCustom) setUpgradeOpen(true);
    else setOpen(true);
  };

  const showInstructionsFor = (d: Domain) => {
    setDnsInstructions({
      cname: { type: "CNAME", name: d.domain, value: "shopboxapp.com.br", description: "Aponte seu domínio para a ShopBox" },
      ownership: d.ownership_verification_name && d.ownership_verification_value
        ? { type: "TXT", name: d.ownership_verification_name, value: d.ownership_verification_value, description: "Registro de verificação de propriedade" }
        : null,
    });
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
                      d.status === "error" ? <Pill color="red">✗ Erro</Pill> : <Pill color="amber">⏳ Aguardando DNS</Pill>}
                  </td>
                  <td className="px-5 py-3">
                    {d.ssl_status === "active" ? <Pill color="green">🔒 SSL ativo</Pill> :
                      d.ssl_status === "error" ? <Pill color="red">⚠️ SSL com erro</Pill> : <Pill color="amber">🔒 SSL pendente</Pill>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => showInstructionsFor(d)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-[#374151] hover:bg-gray-50"
                      >
                        <Settings className="h-3.5 w-3.5" /> Ver instruções DNS
                      </button>
                      <button
                        onClick={() => check.mutate(d)}
                        disabled={check.isPending}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#25d366]/40 px-2.5 py-1.5 text-xs font-medium text-[#15803d] hover:bg-green-50 disabled:opacity-60"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${check.isPending ? "animate-spin" : ""}`} /> Verificar status
                      </button>

                      {!d.is_primary && (
                        <button title="Tornar principal" onClick={() => setPrimary.mutate(d.id)} className="rounded-md p-1.5 text-[#6b7280] hover:bg-gray-100">
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm(`Remover o domínio ${d.domain}?`)) remove.mutate(d); }}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[#ef4444] hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
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
              Após adicionar, mostraremos os registros DNS para você configurar no seu registrador (Registro.br, GoDaddy, Hostinger, etc).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => add.mutate()} disabled={!newDomain.trim() || add.isPending} className="bg-[#25d366] text-white hover:bg-[#1fb955]">
              {add.isPending ? "Adicionando..." : "Adicionar domínio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DNS instructions modal */}
      <Dialog open={!!dnsInstructions} onOpenChange={(o) => !o && setDnsInstructions(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Configure o DNS do seu domínio</DialogTitle></DialogHeader>
          {dnsInstructions && (
            <div className="space-y-4">
              <p className="text-sm text-[#6b7280]">
                Acesse o painel do seu registrador (Registro.br, GoDaddy, Hostinger, Cloudflare...) e adicione os registros abaixo:
              </p>

              <DnsRecord
                label="Registro 1 — Apontar domínio"
                type="CNAME"
                color="blue"
                name={dnsInstructions.cname.name}
                value={dnsInstructions.cname.value}
              />

              {dnsInstructions.ownership && (
                <DnsRecord
                  label="Registro 2 — Verificação SSL"
                  type="TXT"
                  color="purple"
                  name={dnsInstructions.ownership.name}
                  value={dnsInstructions.ownership.value}
                />
              )}

              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                ⏱ A propagação do DNS pode levar até <strong>48 horas</strong>. Depois de configurar, clique em <strong>Verificar status</strong> na linha do domínio.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDnsInstructions(null)} className="w-full bg-[#25d366] text-white hover:bg-[#1fb955]">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Recurso disponível em outro plano</DialogTitle></DialogHeader>
          <p className="text-sm text-[#6b7280]">
            Domínio próprio está disponível a partir do plano Inicial. Faça upgrade para conectar seu domínio personalizado.
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

function DnsRecord({ label, type, color, name, value }: { label: string; type: string; color: "blue" | "purple"; name: string; value: string }) {
  const chip = color === "blue" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700";
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado"); };
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-gray-500">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${chip}`}>{type}</span>
      </div>
      <div className="space-y-2 text-sm">
        <RowKV label="Nome" value={name} onCopy={() => copy(name)} />
        <RowKV label="Valor" value={value} onCopy={() => copy(value)} />
      </div>
    </div>
  );
}

function RowKV({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}:</span>
      <div className="flex items-center gap-2">
        <code className="max-w-[260px] truncate rounded border bg-white px-2 py-1 text-xs">{value}</code>
        <button onClick={onCopy} className="rounded p-1 text-gray-500 hover:bg-gray-200" title="Copiar">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
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
