import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnswerValue } from "./scoring";

export type AdminRow = {
  assessmentId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industries: string[];
  overall: number | null;
  submittedAt: string | null;
  hasPremium: boolean;
};

export const adminListAssessments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: AdminRow[] }> => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: assessments, error } = await supabase
      .from("assessments")
      .select("id, user_id, status, completed_at, started_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (assessments ?? []).map((a) => a.id);
    const userIds = Array.from(new Set((assessments ?? []).map((a) => a.user_id)));

    const [{ data: reports }, { data: profiles }, { data: responses }] = await Promise.all([
      supabase.from("reports").select("assessment_id, scores, has_premium").in("assessment_id", ids),
      supabase.from("profiles").select("*").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("assessment_responses").select("assessment_id, question_key, value").in("assessment_id", ids),
    ]);

    const reportMap = new Map((reports ?? []).map((r) => [r.assessment_id, r]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const answersByAssessment = new Map<string, Record<string, AnswerValue>>();
    for (const r of responses ?? []) {
      const bucket = answersByAssessment.get(r.assessment_id) ?? {};
      bucket[r.question_key] = r.value as AnswerValue;
      answersByAssessment.set(r.assessment_id, bucket);
    }

    const rows: AdminRow[] = (assessments ?? []).map((a) => {
      const profile = profileMap.get(a.user_id);
      const answers = answersByAssessment.get(a.id) ?? {};
      const report = reportMap.get(a.id);
      const scores = (report?.scores ?? {}) as { overall?: number };
      const industries = Array.isArray(answers.industries)
        ? (answers.industries as string[])
        : (profile?.industries ?? []);
      return {
        assessmentId: a.id,
        userId: a.user_id,
        name: (answers.full_name as string) || profile?.full_name || "Unknown",
        email: (answers.email as string) || profile?.email || "",
        phone: (answers.phone as string) || profile?.phone || "",
        company: (answers.company as string) || profile?.company || "",
        industries,
        overall: typeof scores.overall === "number" ? scores.overall : null,
        submittedAt: a.completed_at,
        hasPremium: Boolean(report?.has_premium),
      };
    });

    return { rows };
  });

export const adminGetAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string }) => {
    if (!input?.assessmentId) throw new Error("Missing assessment");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: assessment, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", data.assessmentId)
      .single();
    if (error) throw new Error(error.message);

    const [{ data: responses }, { data: report }, { data: profile }] = await Promise.all([
      supabase.from("assessment_responses").select("question_key, value").eq("assessment_id", data.assessmentId),
      supabase.from("reports").select("*").eq("assessment_id", data.assessmentId).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", assessment.user_id).maybeSingle(),
    ]);

    const answers: Record<string, AnswerValue> = {};
    for (const r of responses ?? []) answers[r.question_key] = r.value as AnswerValue;

    return { assessment, answers, report, profile };
  });