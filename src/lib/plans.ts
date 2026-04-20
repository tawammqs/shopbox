// Centralized plan tier helpers + feature gating
export type PlanSlug = "inicial" | "profissional" | "premium";

export const PLAN_HIERARCHY: Record<PlanSlug, number> = {
  inicial: 1,
  profissional: 2,
  premium: 3,
};

export const PLAN_LABELS: Record<PlanSlug, string> = {
  inicial: "Inicial",
  profissional: "Profissional",
  premium: "Premium",
};

export const PLAN_PRICES_CENTS: Record<PlanSlug, number> = {
  inicial: 4700,
  profissional: 9700,
  premium: 19700,
};

export const PLAN_LIMITS: Record<PlanSlug, { maxProducts: number }> = {
  inicial: { maxProducts: 50 },
  profissional: { maxProducts: 500 },
  premium: { maxProducts: 5000 },
};

export type Feature =
  | "bulk_actions"
  | "discounts"
  | "video_testimonials"
  | "custom_domain"
  | "seo_per_product"
  | "analytics"
  | "welcome_popup"
  | "customers";

export const FEATURE_MIN_PLAN: Record<Feature, PlanSlug> = {
  bulk_actions: "profissional",
  discounts: "profissional",
  video_testimonials: "profissional",
  welcome_popup: "profissional",
  customers: "profissional",
  custom_domain: "premium",
  seo_per_product: "premium",
  analytics: "premium",
};

export function planAllows(plan: PlanSlug | null | undefined, feature: Feature) {
  if (!plan) return false;
  return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[FEATURE_MIN_PLAN[feature]];
}

export function planLabel(plan: PlanSlug | null | undefined) {
  return plan ? PLAN_LABELS[plan] : "—";
}

// Subscription gating — keep in sync with the subscription_status enum
export type StoreAccessStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid"
  | "inactive";

/**
 * Whether the store owner can access the admin panel.
 * Grants access during trial, active, and past_due (grace period).
 * Blocks: incomplete (payment not finished), canceled, unpaid, inactive.
 */
export function hasStoreAccess(store: { subscription_status?: string | null } | null | undefined): boolean {
  if (!store) return false;
  const s = store.subscription_status as StoreAccessStatus | undefined;
  return s === "trialing" || s === "active" || s === "past_due";
}
