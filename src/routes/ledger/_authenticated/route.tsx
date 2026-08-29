import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { markTabSession, sessionShouldExpire } from "@/lib/ledger/session";

export const Route = createFileRoute("/ledger/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (sessionShouldExpire()) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { mode: "signin", redirect: "/ledger/dashboard" } });
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { mode: "signin", redirect: "/ledger/dashboard" } });
    }
    markTabSession();
    return { user: data.user };
  },
  component: () => <Outlet />,
});
