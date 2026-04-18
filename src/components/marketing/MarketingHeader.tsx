import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight text-[#111827]">
          ShopBox
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-[#374151] md:flex">
          <Link to="/funcionalidades" className="hover:text-[#111827]">Funcionalidades</Link>
          <Link to="/temas" className="hover:text-[#111827]">Temas</Link>
          <Link to="/precos" className="hover:text-[#111827]">Preços</Link>
          <a href="#" className="hover:text-[#111827]">Blog</a>
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/login" className="text-sm font-medium text-[#374151] hover:text-[#111827]">
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe57]"
          >
            Testar grátis por 7 dias
          </Link>
        </div>
        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6 text-[#111827]" /> : <Menu className="h-6 w-6 text-[#111827]" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[#e5e7eb] bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/funcionalidades" onClick={() => setOpen(false)} className="text-sm font-medium text-[#374151]">Funcionalidades</Link>
            <Link to="/temas" onClick={() => setOpen(false)} className="text-sm font-medium text-[#374151]">Temas</Link>
            <Link to="/precos" onClick={() => setOpen(false)} className="text-sm font-medium text-[#374151]">Preços</Link>
            <a href="#" onClick={() => setOpen(false)} className="text-sm font-medium text-[#374151]">Blog</a>
            <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-[#374151]">Entrar</Link>
            <Link
              to="/cadastro"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#25D366] px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Testar grátis por 7 dias
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
