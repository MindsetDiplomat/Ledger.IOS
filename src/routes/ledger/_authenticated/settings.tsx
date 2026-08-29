import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { LedgerShell } from "@/components/ledger/LedgerShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ledger/_authenticated/settings")({
  head: () => ({
    meta: [{ title: "Settings — Ledger" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl">Settings</h1>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Theme</p>
            <Button variant="outline" onClick={toggle}>
              {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "dark" ? "Dark" : "Light"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="mt-1 font-medium">{email ?? "…"}</p>
          </CardContent>
        </Card>
      </div>
    </LedgerShell>
  );
}
