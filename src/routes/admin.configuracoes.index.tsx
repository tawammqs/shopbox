import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/configuracoes/pagamentos" });
  },
});
