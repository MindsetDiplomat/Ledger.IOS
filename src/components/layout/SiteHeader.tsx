import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-9" />
          <span className="hidden text-sm font-medium tracking-tight sm:block">
            AI Business Compass<span className="text-primary">™</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {signedIn ? (
            <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/auth" })}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}>
                Start free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 text-center">
        <Logo className="h-8 opacity-80" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Mind Management Academy · Ad Infinitum Tempus
        </p>
        <p className="max-w-xl text-xs text-muted-foreground/70">
          AI Business Compass™ is a diagnostic tool. It identifies bottlenecks and revenue leakage — it does
          not provide implementation. Results are estimates based on the information you provide.
        </p>
      </div>
    </footer>
  );
}