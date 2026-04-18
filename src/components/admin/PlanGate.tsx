import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { planAllows, FEATURE_MIN_PLAN, PLAN_LABELS, type Feature, type PlanSlug } from "@/lib/plans";
import { ReactNode } from "react";

export function PlanGate({
  plan,
  feature,
  children,
  fallback,
  inline = false,
}: {
  plan: PlanSlug | null | undefined;
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  inline?: boolean;
}) {
  if (planAllows(plan, feature)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" /> {PLAN_LABELS[FEATURE_MIN_PLAN[feature]]}+
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">Recurso do plano {PLAN_LABELS[FEATURE_MIN_PLAN[feature]]}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Faça upgrade para desbloquear este recurso.
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link to="/admin/plano">Ver planos</Link>
      </Button>
    </div>
  );
}

export function LockedButton({
  plan,
  feature,
  children,
  ...props
}: {
  plan: PlanSlug | null | undefined;
  feature: Feature;
  children: ReactNode;
} & React.ComponentProps<typeof Button>) {
  const allowed = planAllows(plan, feature);
  if (!allowed) {
    return (
      <Button {...props} disabled title={`Disponível no plano ${PLAN_LABELS[FEATURE_MIN_PLAN[feature]]}`}>
        <Lock className="mr-1 h-3.5 w-3.5" /> {children}
      </Button>
    );
  }
  return <Button {...props}>{children}</Button>;
}
