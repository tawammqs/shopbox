import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function BlogWhatsAppButton() {
  return (
    <a
      href="https://wa.me/5518981586111?text=Ol%C3%A1!%20Vim%20do%20blog%20da%20ShopBox%20e%20quero%20saber%20mais."
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-[100] inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,211,102,0.4)]"
    >
      <WhatsAppIcon className="h-5 w-5" />
      Falar com especialista
    </a>
  );
}
