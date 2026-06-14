import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyStore } from "@/hooks/useMyStore";
import { useAddonStatus } from "@/lib/addons";
import { AddonPaywall } from "@/components/admin/marketing/AddonPaywall";

export const Route = createFileRoute("/admin/marketing/perguntas-avaliacoes")({
  head: () => ({ meta: [{ title: "Perguntas e Avaliações — ShopBox" }] }),
  component: Page,
});

function Page() {
  const { data: store } = useMyStore();
  const { data: status, isLoading } = useAddonStatus(store?.id, "perguntas_avaliacoes");
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("addon_success") === "true") {
      toast.success("Add-on ativado!");
      qc.invalidateQueries({ queryKey: ["store_addon"] });
    }
  }, [qc]);

  useEffect(() => {
    if (status?.isActive) {
      navigate({ to: "/admin/perguntas", replace: true });
    }
  }, [status?.isActive, navigate]);

  if (isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
  if (!status?.isActive) return <AddonPaywall addonKey="perguntas_avaliacoes" />;
  return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-gray-400" />;
}
