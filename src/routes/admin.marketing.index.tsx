import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/marketing/")({
  component: Redir,
});

function Redir() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/marketing/video-commerce" as any, replace: true });
  }, [navigate]);
  return null;
}
