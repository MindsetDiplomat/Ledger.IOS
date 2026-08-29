import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("profiles").select("theme").eq("id", userId).maybeSingle();
    return { theme: data?.theme ?? null };
  });

export const updateMyTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { theme: "dark" | "light" }) => {
    if (input?.theme !== "dark" && input?.theme !== "light") throw new Error("Invalid theme");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ theme: data.theme })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
