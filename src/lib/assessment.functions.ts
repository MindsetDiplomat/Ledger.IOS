import { createServerFn } from "@tanstack/react-start";
import type { AnswerValue } from "./scoring";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getActiveAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let assessment = existing;
    if (!assessment) {
      const { data, error } = await supabase
        .from("assessments")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      assessment = data;
    }

    const { data: responses } = await supabase
      .from("assessment_responses")
      .select("question_key, value")
      .eq("assessment_id", assessment.id);

    const answers: Record<string, AnswerValue> = {};
    for (const r of responses ?? []) answers[r.question_key] = r.value as AnswerValue;

    return { assessment, answers };
  });

export const saveResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string; questionKey: string; value: AnswerValue; index: number }) => {
    if (!input?.assessmentId || !input?.questionKey) throw new Error("Invalid response payload");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.from("assessment_responses").upsert(
      {
        assessment_id: data.assessmentId,
        user_id: userId,
        question_key: data.questionKey,
        value: data.value as never,
      },
      { onConflict: "assessment_id,question_key" },
    );
    if (error) throw new Error(error.message);

    await supabase
      .from("assessments")
      .update({ current_index: data.index })
      .eq("id", data.assessmentId)
      .eq("user_id", userId);

    return { ok: true };
  });

export const completeAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string }) => {
    if (!input?.assessmentId) throw new Error("Missing assessment");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { computeScores, computeLeakage, primaryBottleneckFallback } = await import("./scoring");
    const { runDiagnostic } = await import("./ai.server");

    const { data: responses, error: respError } = await supabase
      .from("assessment_responses")
      .select("question_key, value")
      .eq("assessment_id", data.assessmentId);
    if (respError) throw new Error(respError.message);

    const answers: Record<string, AnswerValue> = {};
    for (const r of responses ?? []) answers[r.question_key] = r.value as AnswerValue;

    const scores = computeScores(answers);
    const leakage = computeLeakage(answers, scores);
    const bottleneck = primaryBottleneckFallback(scores);
    const ai = await runDiagnostic(answers, scores, leakage, bottleneck);

    const industries = Array.isArray(answers.industries) ? (answers.industries as string[]) : [];
    await supabase
      .from("profiles")
      .update({
        full_name: (answers.full_name as string) ?? null,
        phone: (answers.phone as string) ?? null,
        company: (answers.company as string) ?? null,
        industries,
        monthly_revenue: (answers.monthly_revenue as string) ?? null,
      })
      .eq("id", userId);

    const { data: report, error } = await supabase
      .from("reports")
      .upsert(
        {
          assessment_id: data.assessmentId,
          user_id: userId,
          scores: scores as never,
          leakage: leakage as never,
          ai_output: ai as never,
        },
        { onConflict: "assessment_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("assessments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.assessmentId)
      .eq("user_id", userId);

    return { reportId: report.id, assessmentId: data.assessmentId };
  });

export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string }) => {
    if (!input?.assessmentId) throw new Error("Missing assessment");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("assessment_id", data.assessmentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return report;
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: reports }, { data: inProgress }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("assessments")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    return {
      profile,
      reports: reports ?? [],
      inProgress,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { full_name?: string; phone?: string; company?: string; industries?: string[] }) => {
      if (input?.industries && input.industries.length > 2) {
        throw new Error("You can select a maximum of 2 industries.");
      }
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createWhopCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string; origin: string }) => {
    if (!input?.assessmentId) throw new Error("Missing report.");
    if (!input?.origin) throw new Error("Missing origin.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { createCheckoutUrl } = await import("./whop.server");
    const url = await createCheckoutUrl({
      assessmentId: data.assessmentId,
      userId,
      redirectUrl: `${data.origin}/results/${data.assessmentId}?unlocked=1`,
    });
    return { url };
  });

export const redeemAccessCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { assessmentId: string; code: string }) => {
    if (!input?.code || input.code.trim().length < 4) throw new Error("Enter a valid access code.");
    if (!input?.assessmentId) throw new Error("Missing report.");
    return { assessmentId: input.assessmentId, code: input.code.trim().toUpperCase() };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("access_codes")
      .select("*")
      .eq("code", data.code)
      .maybeSingle();

    if (!existing) throw new Error("That access code was not recognized.");
    if (existing.redeemed_by && existing.redeemed_by !== userId) {
      throw new Error("That access code has already been used.");
    }

    await supabaseAdmin
      .from("access_codes")
      .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
      .eq("id", existing.id);

    const { error } = await supabase
      .from("reports")
      .update({ has_premium: true })
      .eq("assessment_id", data.assessmentId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });