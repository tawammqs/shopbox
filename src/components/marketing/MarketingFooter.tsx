import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, MessageCircle } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-[#111827] py-16 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="font-display text-2xl font-extrabold">ShopBox</div>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              A plataforma de loja online para quem vende pelo WhatsApp.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2 transition hover:bg-[#25D366] hover:text-white"><Instagram className="h-4 w-4" /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="rounded-full bg-white/10 p-2 transition hover:bg-[#25D366] hover:text-white"><Youtube className="h-4 w-4" /></a>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full bg-white/10 p-2 transition hover:bg-[#25D366] hover:text-white"><MessageCircle className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Produto</div>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li><Link to="/funcionalidades" className="hover:text-white">Funcionalidades</Link></li>
              <li><Link to="/temas" className="hover:text-white">Temas</Link></li>
              <li><Link to="/precos" className="hover:text-white">Preços</Link></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Conta</div>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
              <li><Link to="/cadastro" className="hover:text-white">Criar loja</Link></li>
              <li><Link to="/recuperar-senha" className="hover:text-white">Recuperar senha</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold">Legal</div>
            <ul className="mt-4 space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-white">Termos de uso</a></li>
              <li><a href="#" className="hover:text-white">Privacidade</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} ShopBox. Feito para quem vende pelo WhatsApp.
        </div>
      </div>
    </footer>
  );
}
