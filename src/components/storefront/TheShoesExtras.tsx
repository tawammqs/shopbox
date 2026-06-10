import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStorefront } from "./StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const VIP_GROUP_URL = "https://chat.whatsapp.com/CZ5lQvBM0kt9j1QRq7bU3r";

function gradientForCategory(name: string): string {
  const n = name.trim().toLowerCase();
  if (n.includes("menina")) return "linear-gradient(135deg, #fce7f3, #f9a8d4)";
  if (n.includes("menino")) return "linear-gradient(135deg, #dbeafe, #93c5fd)";
  if (n.includes("bebê") || n.includes("bebe")) return "linear-gradient(135deg, #d1fae5, #a7f3d0)";
  if (n.includes("outlet")) return "linear-gradient(135deg, #fef3c7, #fcd34d)";
  if (n.includes("lança") || n.includes("lanca")) return "linear-gradient(135deg, #e0e7ff, #c7d2fe)";
  if (n.includes("oferta")) return "linear-gradient(135deg, #fde8ff, #f5d0fe)";
  return "linear-gradient(135deg, #f3f4f6, #e5e7eb)";
}

function formatWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function TheShoesCategoryGrid() {
  const { store, categories } = useStorefront();
  if (store.slug !== "the-shoes") return null;

  const tops = categories.filter((c) => !c.parent_id);
  if (tops.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-[22px] font-extrabold tracking-tight text-[#1a1a1a]">
        Compre por categoria
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:overflow-visible md:pb-0">
        {tops.map((c) => {
          const bg = c.image_url
            ? `url(${c.image_url}) center/cover no-repeat`
            : gradientForCategory(c.name);
          return (
            <Link
              key={c.id}
              to="/loja/$slug/categoria/$categorySlug"
              params={{ slug: store.slug, categorySlug: c.slug }}
              className="group relative block h-[130px] min-w-[130px] flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition-transform duration-200 hover:scale-[1.03] md:h-[180px] md:min-w-0"
              style={{ background: bg }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}
              />
              <span
                className="absolute bottom-3 left-3 text-[15px] font-bold text-white"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
              >
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function TheShoesVipBanner() {
  const { store } = useStorefront();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (store.slug !== "the-shoes") return null;

  const onSubmit = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Digite um WhatsApp válido");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("vip_group_leads" as any).insert({
        store_id: store.id,
        whatsapp: digits,
        source: "achadinhos_banner",
      });
      if (error) throw error;
      toast.success("Redirecionando para o grupo! 🎉");
      window.open(VIP_GROUP_URL, "_blank", "noopener,noreferrer");
      setValue("");
    } catch (e: any) {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="my-6 flex flex-wrap items-center justify-between gap-6 px-6 py-8 md:px-20 md:py-10"
      style={{ background: "#25D366" }}
    >
      <div className="w-full text-center md:flex-1 md:text-left">
        <span
          className="inline-block rounded text-[11px] font-bold uppercase text-white"
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "3px 10px",
            letterSpacing: "0.08em",
          }}
        >
          EXCLUSIVO
        </span>
        <h2
          className="mt-3 text-[22px] font-black leading-[1.1] text-white md:text-[28px]"
          style={{ letterSpacing: "-0.5px" }}
        >
          Achadinhos da The Shoes 🔥
        </h2>
        <p
          className="mt-2 text-[15px] leading-[1.6]"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Entre para o nosso grupo VIP e receba ofertas exclusivas, lançamentos em primeira mão e preços especiais.
        </p>
      </div>

      <div
        className="w-full min-w-[300px] rounded-xl md:w-auto md:flex-1 md:max-w-md"
        style={{ background: "rgba(255,255,255,0.15)", padding: "20px 24px" }}
      >
        <label
          className="mb-[10px] block text-[13px] font-semibold"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          Digite seu WhatsApp para entrar:
        </label>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(formatWhatsapp(e.target.value))}
          placeholder="(00) 00000-0000"
          className="block h-12 w-full rounded-lg border-0 px-4 text-[15px] text-[#1a1a1a] outline-none"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="mt-[10px] flex h-12 w-full items-center justify-center gap-2 rounded-lg border-0 text-[15px] font-bold disabled:opacity-70"
          style={{ background: "#fff", color: "#25D366" }}
        >
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          {submitting ? "Enviando..." : "Entrar no grupo VIP"}
        </button>
        <p
          className="mt-2 text-center text-[11px]"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Seus dados são protegidos. Não enviamos spam.
        </p>
      </div>
    </section>
  );
}
