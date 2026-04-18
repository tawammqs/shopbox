import { ShoppingBag, Star, MessageCircle } from "lucide-react";

export function HeroMockup() {
  return (
    <div className="relative">
      {/* Desktop frame */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-[#e5e7eb] bg-[#f7f8fa] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <div className="ml-3 flex-1 truncate rounded bg-white px-3 py-1 text-[11px] text-gray-400">
            shopbox.app/loja/sua-loja
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#f7f8fa] to-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-sm font-bold text-[#111827]">Sua Loja</div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <ShoppingBag className="h-3 w-3" /> 2 itens
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { c: "from-pink-200 to-rose-300", p: "R$ 89" },
              { c: "from-amber-200 to-orange-300", p: "R$ 129" },
              { c: "from-sky-200 to-cyan-300", p: "R$ 59" },
              { c: "from-emerald-200 to-teal-300", p: "R$ 199" },
              { c: "from-violet-200 to-purple-300", p: "R$ 149" },
              { c: "from-fuchsia-200 to-pink-300", p: "R$ 79" },
            ].map((it, i) => (
              <div key={i} className="rounded-lg bg-white p-2 shadow-sm">
                <div className={`aspect-square rounded-md bg-gradient-to-br ${it.c}`} />
                <div className="mt-1.5 text-[9px] font-medium text-gray-700">Produto</div>
                <div className="text-[10px] font-bold text-[#111827]">{it.p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating WhatsApp badge */}
      <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-[#e5e7eb] sm:-bottom-6 sm:-left-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]">
          <MessageCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-500">🟢 WhatsApp</div>
          <div className="text-xs font-bold text-[#111827]">Compra finalizada!</div>
        </div>
      </div>

      {/* Floating rating badge */}
      <div className="absolute -top-4 -right-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] shadow-xl ring-1 ring-[#e5e7eb] sm:-top-6 sm:-right-6">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        4.9 lojistas
      </div>
    </div>
  );
}
