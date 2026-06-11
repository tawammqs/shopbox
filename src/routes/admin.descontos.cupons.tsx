import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/descontos/cupons")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/descontos" });
  },
});
