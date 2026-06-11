import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

export function PremiumLock({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none select-none blur-[5px]" aria-hidden>
        {children ?? <DefaultMock />}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366]/10">
            <Lock className="h-7 w-7 text-[#25d366]" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title ?? "Recurso exclusivo do Plano Premium"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {description ??
              "Faça upgrade para Premium e desbloqueie estatísticas avançadas, métricas detalhadas e muito mais."}
          </p>
          <Link
            to="/admin/plano"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#25d366] px-6 text-sm font-semibold text-white transition hover:bg-[#1fb959]"
          >
            Fazer upgrade →
          </Link>
        </div>
      </div>
    </div>
  );
}

function DefaultMock() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-24 rounded bg-gray-300" />
            <div className="mt-4 h-10 w-full rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="h-64 rounded-xl border border-gray-200 bg-white p-6">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="mt-6 h-40 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
