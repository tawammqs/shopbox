import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/marketing/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/marketing/video-commerce" });
  },
});
