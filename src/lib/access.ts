// Subscription / trial access helpers — no Edge Functions, pure DB-driven.
// Source of truth: stores.subscription_status (enum) + stores.trial_ends_at.

export type AccessType = "trial" | "active" | "expired" | null;

export function storeHasAccess(
  store: { subscription_status?: string | null; trial_ends_at?: string | null } | null | undefined,
): boolean {
  if (!store) return false;
  const s = store.subscription_status;
  if (s === "active" || s === "past_due") return true;
  if (
    s === "trialing" &&
    store.trial_ends_at &&
    new Date(store.trial_ends_at).getTime() > Date.now()
  ) return true;
  // Failsafe: any store still inside trial window has access regardless of drift.
  if (store.trial_ends_at && new Date(store.trial_ends_at).getTime() > Date.now()) return true;
  return false;
}

export function accessTypeOf(
  store: { subscription_status?: string | null; trial_ends_at?: string | null } | null | undefined,
): AccessType {
  if (!store) return null;
  const s = store.subscription_status;
  if (s === "active" || s === "past_due") return "active";
  const inTrial =
    !!store.trial_ends_at && new Date(store.trial_ends_at).getTime() > Date.now();
  if (inTrial) return "trial";
  return "expired";
}

export function trialDaysRemaining(trial_ends_at: string | null | undefined): number {
  if (!trial_ends_at) return 0;
  const diff = new Date(trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function trialHoursRemaining(trial_ends_at: string | null | undefined): number {
  if (!trial_ends_at) return 0;
  const diff = new Date(trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
}
