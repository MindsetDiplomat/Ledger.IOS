// Server-only: Whop checkout + webhook handling for the $9.99 Growth Roadmap unlock.
import { unwrapWebhook } from "@whop/sdk";

export async function createCheckoutUrl(opts: {
  assessmentId: string;
  userId: string;
  redirectUrl: string;
}): Promise<string> {
  const apiKey = process.env.WHOP_API_KEY;
  const accountId = process.env.WHOP_ACCOUNT_ID;
  const planId = process.env.WHOP_PLAN_ID;
  if (!apiKey || !accountId || !planId) {
    throw new Error("Whop checkout is not configured on this server yet.");
  }

  const { WhopClient } = await import("@whop/sdk");
  const client = new WhopClient({ token: apiKey });

  const config = await client.checkoutConfigurations.create({
    account_id: accountId,
    plan_id: planId,
    metadata: { assessment_id: opts.assessmentId, user_id: opts.userId },
    redirect_url: opts.redirectUrl,
  });

  if (!config.purchase_url) throw new Error("Whop did not return a checkout URL.");
  return config.purchase_url;
}

export async function handleWhopWebhook(request: Request): Promise<Response> {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[whop] WHOP_WEBHOOK_SECRET is not set; rejecting webhook");
    return new Response("Webhook not configured", { status: 500 });
  }

  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: { type?: string; data?: { metadata?: Record<string, unknown> | null } };
  try {
    event = unwrapWebhook(body, { headers, key: secret });
  } catch (error) {
    console.error("[whop] webhook signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "payment.succeeded") {
    const assessmentId = event.data?.metadata?.assessment_id;
    if (typeof assessmentId === "string" && assessmentId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("reports")
        .update({ has_premium: true })
        .eq("assessment_id", assessmentId);
      if (error) {
        console.error("[whop] failed to unlock report", assessmentId, error);
        return new Response("Failed to apply unlock", { status: 500 });
      }
    } else {
      console.error("[whop] payment.succeeded webhook missing metadata.assessment_id");
    }
  }

  return new Response("ok", { status: 200 });
}
