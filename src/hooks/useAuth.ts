import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Listener fires immediately with INITIAL_SESSION on mount, so it's the
    // primary source of truth. We also call getSession() as a fallback for
    // edge cases (e.g. SSR hydration), and a hard timeout to guarantee the
    // loading state always resolves.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    // Safety net: never leave the UI hanging on auth check
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}
