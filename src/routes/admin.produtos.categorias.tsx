import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/produtos/categorias")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/categorias" });
  },
});
