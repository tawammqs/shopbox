import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ADDON_INFO, type AddonKey } from "@/lib/addons";
import { useMyStore } from "@/hooks/useMyStore";

export function AddonPaywall({ addonKey }: { addonKey: AddonKey }) {
  const info = ADDON_INFO[addonKey];
  const { data: store } = useMyStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(info.plans[0].id);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!store?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-addon-checkout", {
        body: {
          store_id: store.id,
          addon_key: addonKey,
          plan_tier: selectedPlan,
        },
      });
      if (error || !data?.url) {
        toast.error(data?.error || "Erro ao iniciar pagamento.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao iniciar pagamento");
      setLoading(false);
    }
  }

  const multi = info.plans.length > 1;

  return (
    <div className="mx-auto max-w-3xl py-10 text-center">
      <div className="mb-4 text-5xl">{info.icon}</div>
      <h1 className="text-2xl font-bold text-[#111827]">{info.title}</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#6b7280]">{info.description}</p>

      {multi ? (
        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-4">
          {info.plans.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selected ? "border-[#25d366] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <h3 className="font-bold text-[#111827]">{plan.name}</h3>
                <p className="my-2 text-2xl font-bold text-[#25d366]">
                  R$ {plan.price.toFixed(2).replace(".", ",")}
                  <span className="text-xs text-gray-400">/mês</span>
                </p>
                <ul className="mt-3 space-y-1 text-xs text-gray-600">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#25d366]" /> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 inline-block rounded-2xl bg-green-50 p-6 text-left">
          <p className="text-center text-3xl font-bold text-[#25d366]">
            R$ {info.plans[0].price.toFixed(2).replace(".", ",")}
            <span className="text-sm text-gray-400">/mês</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-600">
            {info.plans[0].features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#25d366]" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-8 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-[#1fb959] disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? "Aguarde..." : "Ativar agora →"}
        </button>
        <p className="mt-3 text-xs text-gray-400">
          Pagamento recorrente via Stripe. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
