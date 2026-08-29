import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyTheme, updateMyTheme } from "@/lib/theme.functions";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const loadRemoteTheme = useServerFn(getMyTheme);
  const saveRemoteTheme = useServerFn(updateMyTheme);
  const syncedForUser = useRef<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("abc-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("abc-theme", theme);
  }, [theme]);

  // Once signed in, the account's saved preference (if any) wins over the local one.
  useEffect(() => {
    let cancelled = false;

    async function syncFromAccount(userId: string) {
      if (syncedForUser.current === userId) return;
      syncedForUser.current = userId;
      try {
        const res = await loadRemoteTheme({});
        if (!cancelled && (res.theme === "light" || res.theme === "dark")) setTheme(res.theme);
      } catch {
        // Not fatal — keep using the local preference.
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void syncFromAccount(data.session.user.id);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void syncFromAccount(session.user.id);
      else syncedForUser.current = null;
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) void saveRemoteTheme({ data: { theme: next } }).catch(() => {});
      });
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
