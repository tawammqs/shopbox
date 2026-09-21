import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitBlogLead } from "@/lib/blog.functions";

export function BlogLeadCapture({ source = "blog", compact = false }: { source?: string; compact?: boolean }) {
  const send = useServerFn(submitBlogLead);
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await send({ data: { whatsapp, source } });
      setDone(true);
      setWhatsapp("");
      toast.success("Pronto! Você vai receber nossas dicas no WhatsApp.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar seu WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] text-center ${compact ? "my-8 p-8" : "mb-12 p-10"}`}>
      <p className="text-xs font-semibold uppercase tracking-[2px] text-[#25d366]">Dicas exclusivas</p>
      <h3 className={`mt-3 font-semibold text-[#1a1a1a] ${compact ? "text-xl" : "text-2xl"}`}>
        Receba dicas de vendas pelo WhatsApp {compact ? "" : "toda semana"}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#555]">
        Estratégias práticas para vender mais, direto no seu WhatsApp. Sem spam, cancele quando quiser.
      </p>
      {done ? (
        <p className="mt-6 text-sm font-semibold text-[#15803d]">WhatsApp cadastrado com sucesso.</p>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-6 flex max-w-[420px] flex-col gap-2 rounded-xl border border-[#bbf7d0] bg-white p-1 pl-4 sm:flex-row sm:items-center">
          <span className="hidden self-center text-base sm:block">🇧🇷</span>
          <input
            type="tel"
            required
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="Seu WhatsApp com DDD"
            className="flex-1 border-none bg-transparent px-2 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#25d366] px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Quero receber →
          </button>
        </form>
      )}
      <p className="mt-3 text-xs text-[#9ca3af]">Ao assinar, você concorda com nossa política de privacidade.</p>
    </div>
  );
}
