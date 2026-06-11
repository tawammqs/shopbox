import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/clientes/avaliacoes")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/perguntas" });
  },
});
