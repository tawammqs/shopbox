import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/vendas")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/pedidos" });
  },
});
