import { createFileRoute, useSearch, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: (search.session_id as string) || "",
  }),
  head: () => ({ meta: [{ title: "Pagamento — ShopBox" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = useSearch({ from: "/checkout/return" });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h1 className="font-display text-3xl font-bold">Pagamento confirmado!</h1>
        <p className="mt-3 text-muted-foreground">
          Sua assinatura está ativa. Vamos para o painel da sua loja.
        </p>
        {session_id && (
          <p className="mt-2 text-xs text-muted-foreground">Sessão: {session_id.slice(0, 20)}...</p>
        )}
        <Link
          to="/painel"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Acessar meu painel →
        </Link>
      </div>
    </div>
  );
}
