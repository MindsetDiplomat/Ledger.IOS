import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboard, updateProfile } from "@/lib/assessment.functions";
import { INDUSTRIES } from "@/lib/questions";
import { cn } from "@/lib/utils";

const MAX_INDUSTRIES = 2;

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — AI Business Compass™" },
      { name: "description", content: "Manage your account details and industries." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const load = useServerFn(getDashboard);
  const save = useServerFn(updateProfile);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => load({}) });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!data?.profile || hydrated) return;
    setFullName(data.profile.full_name ?? "");
    setPhone(data.profile.phone ?? "");
    setCompany(data.profile.company ?? "");
    setIndustries(data.profile.industries ?? []);
    setHydrated(true);
  }, [data, hydrated]);

  const mutation = useMutation({
    mutationFn: async () =>
      save({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          company: company.trim(),
          industries,
        },
      }),
    onSuccess: () => {
      toast.success("Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save your changes."),
  });

  function toggleIndustry(value: string) {
    setIndustries((current) => {
      if (current.includes(value)) return current.filter((v) => v !== value);
      if (current.length >= MAX_INDUSTRIES) return current;
      return [...current, value];
    });
  }

  if (isLoading || !hydrated) {
    return (
      <AppShell isAdmin={data?.isAdmin}>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin={data?.isAdmin}>
      <div className="mx-auto max-w-2xl px-5 py-14">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Profile & Settings</h1>
        <p className="mt-2 text-muted-foreground">Keep your account details up to date.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-10 space-y-8 rounded-3xl border border-border/70 bg-card p-8 shadow-soft"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={data?.profile?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your email is tied to your account sign-in and can't be changed here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jordan Smith"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Advisory"
              maxLength={100}
            />
          </div>

          <div className="space-y-3">
            <Label>Industries</Label>
            <p className="text-xs text-muted-foreground">
              Select up to {MAX_INDUSTRIES} · {industries.length} selected
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {INDUSTRIES.map((option) => {
                const active = industries.includes(option);
                const disabled = !active && industries.length >= MAX_INDUSTRIES;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleIndustry(option)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40 hover:bg-secondary",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span>{option}</span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
