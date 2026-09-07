import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, User, X } from "lucide-react";
import { fetchSalesTeam, salesTeamQueryKey, type SalesTeamMember } from "@/lib/sales-team";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function useSalesTeam(storeId: string, enabled = true) {
  return useQuery({
    queryKey: salesTeamQueryKey(storeId),
    queryFn: () => fetchSalesTeam(storeId),
    enabled: enabled && !!storeId,
    staleTime: 60_000,
  });
}

function openFor(number: string, message?: string | null) {
  window.open(buildWhatsAppUrl(number, message || undefined), "_blank");
}

type Props = {
  storeId: string;
  /** Full order message when opened from checkout; null for plain contact. */
  cartMessage?: string | null;
  /** Store's default WhatsApp, used when no team is registered. */
  fallbackNumber?: string | null;
  onClose: () => void;
};

/**
 * Sales-rep picker. With 0 or 1 active members it opens WhatsApp immediately
 * (legacy behavior preserved); with 2+ it shows the selection sheet.
 */
export function SalesTeamSelector({ storeId, cartMessage, fallbackNumber, onClose }: Props) {
  const { data: team, isLoading } = useSalesTeam(storeId);
  const handled = useRef(false);

  const message = cartMessage || "Olá! Vim pelo site e gostaria de mais informações.";

  useEffect(() => {
    if (isLoading || handled.current || !team) return;
    if (team.length === 0) {
      handled.current = true;
      if (fallbackNumber) openFor(fallbackNumber, message);
      onClose();
    } else if (team.length === 1) {
      handled.current = true;
      openFor(team[0]!.whatsapp, message);
      onClose();
    }
  }, [isLoading, team, fallbackNumber, message, onClose]);

  if (isLoading || !team || team.length < 2) return null;

  const select = (m: SalesTeamMember) => {
    openFor(m.whatsapp, message);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="mb-1 text-center text-base font-bold">
          {cartMessage ? "Escolha uma vendedora para finalizar" : "Fale com nossa equipe"}
        </h3>
        <p className="mb-5 text-center text-xs text-muted-foreground">Selecione com quem você quer conversar</p>

        <div className="space-y-3">
          {team.map((m) => (
            <button
              key={m.id}
              onClick={() => select(m)}
              className="flex w-full items-center gap-4 rounded-xl border border-border p-3 transition-all hover:border-[#25d366] hover:bg-[#25d366]/10"
            >
              {m.photo_url ? (
                <img
                  src={m.photo_url}
                  alt={m.name}
                  className="h-12 w-12 shrink-0 rounded-full border-2 border-[#25d366] object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25d366]/15">
                  <User className="h-6 w-6 text-[#25d366]" />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">Clique para conversar</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366]">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Convenience state hook for triggering the selector. */
export function useSalesTeamSelector() {
  const [pending, setPending] = useState<{ message: string | null } | null>(null);
  return {
    pending,
    open: (message: string | null = null) => setPending({ message }),
    close: () => setPending(null),
  };
}
