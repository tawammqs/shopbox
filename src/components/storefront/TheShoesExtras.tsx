import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStorefront } from "./StoreContext";
import { supabase } from "@/integrations/supabase/client";

const VIP_GROUP_URL = "https://chat.whatsapp.com/CZ5lQvBM0kt9j1QRq7bU3r";

function formatWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function TheShoesVipBanner({ renderTrigger }: { renderTrigger?: (open: () => void) => React.ReactNode } = {}) {
  const { store } = useStorefront();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (store.slug !== "the-shoes") return null;

  const close = () => {
    setOpen(false);
    setInvalid(false);
  };

  const onSubmit = async () => {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setInvalid(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("vip_group_leads" as any).insert({
        store_id: store.id,
        whatsapp: digits,
        source: "achadinhos_modal",
      });
      if (error) throw error;
      toast.success("Redirecionando para o grupo VIP! 🎉");
      window.open(VIP_GROUP_URL, "_blank", "noopener,noreferrer");
      setValue("");
      close();
    } catch {
      toast.error("Não foi possível concluir. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes shopbox-modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shopbox-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="my-6 flex w-full cursor-pointer items-center justify-center gap-3 border-0 text-white"
        style={{ background: "#25D366", padding: "20px 24px" }}
      >
        <span style={{ fontSize: 20 }}>🔒</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          Achadinhos da The Shoes — Clique para desbloquear as ofertas VIP
        </span>
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "40px 32px",
              maxWidth: 420,
              width: "100%",
              textAlign: "center",
              position: "relative",
              animation: "shopbox-modalIn 0.2s ease forwards",
            }}
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={close}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 20,
                color: "#aaa",
                cursor: "pointer",
              }}
            >
              ×
            </button>
            <span style={{ fontSize: 48, marginBottom: 16, display: "block" }}>🔒</span>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", marginBottom: 12 }}>
              Achadinhos da The Shoes
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
              Digite seu WhatsApp e tenha acesso às ofertas mais incríveis da The Shoes. Exclusivo para clientes VIPs 😉
            </p>
            <input
              type="tel"
              inputMode="numeric"
              value={value}
              onChange={(e) => {
                setValue(formatWhatsapp(e.target.value));
                if (invalid) setInvalid(false);
              }}
              placeholder={invalid ? "Digite um WhatsApp válido" : "(DDD + XXXXX-XXXX)"}
              style={{
                width: "100%",
                height: 52,
                border: `1.5px solid ${invalid ? "#e53935" : "#e0e0e0"}`,
                borderRadius: 10,
                padding: "0 16px",
                fontSize: 16,
                color: "#1a1a1a",
                textAlign: "center",
                marginBottom: 12,
                outline: "none",
                animation: shake ? "shopbox-shake 0.4s ease" : undefined,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                height: 52,
                background: "#25D366",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Enviando..." : "Desbloquear e ver ofertas"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
