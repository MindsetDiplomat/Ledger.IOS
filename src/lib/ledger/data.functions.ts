import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRatesForDate, getRatesForDates, rateFor } from "./fx";

export type LedgerTransaction = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  occurred_on: string;
  category: string;
  kind: "income" | "expense";
  account: string | null;
  receipt_path: string | null;
  receipt_captured_at: string | null;
  is_refund: boolean;
  duplicate_status: "unique" | "duplicate" | "false_positive";
  duplicate_of_transaction_id: string | null;
  fx_rate: number | null;
  created_at: string;
  updated_at: string;
};

export type LedgerInvestment = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  value: number;
  currency: string;
  cost_basis: number | null;
  entry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LedgerSubscription = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  next_billing_date: string | null;
  category: string;
  created_at: string;
  updated_at: string;
};

export type LedgerPeriod = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  color: string;
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionInput = {
  id?: string;
  description: string;
  amount: number;
  currency: string;
  occurred_on: string;
  category: string;
  kind: "income" | "expense";
  account?: string | null;
  receipt_path?: string | null;
  is_refund?: boolean;
  duplicate_status?: "unique" | "duplicate" | "false_positive";
  duplicate_of_transaction_id?: string | null;
};

const PAGE_SIZE_DEFAULT = 30;

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 400);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

// ---- Transactions ----

export const listTransactionsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { page?: number; pageSize?: number; month?: string } | undefined) => input ?? {},
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const page = data.page && data.page > 0 ? data.page : 1;
    const pageSize = data.pageSize ?? PAGE_SIZE_DEFAULT;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("ledger_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.month) {
      const [y, m] = data.month.split("-").map(Number);
      const start = `${data.month}-01`;
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      query = query.gte("occurred_on", start).lte("occurred_on", end);
    }

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);

    const rates = await getRatesForDates((rows ?? []).map((r) => r.occurred_on));
    return {
      rows: (rows ?? []) as LedgerTransaction[],
      total: count ?? 0,
      page,
      pageSize,
      rates,
    };
  });

export const listTransactionsInRange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { start: string; end: string }) => {
    if (!input?.start || !input?.end) throw new Error("Missing date range");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("ledger_transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("occurred_on", data.start)
      .lte("occurred_on", data.end)
      .order("occurred_on", { ascending: true });
    if (error) throw new Error(error.message);

    const rates = await getRatesForDates((rows ?? []).map((r) => r.occurred_on));
    return { rows: (rows ?? []) as LedgerTransaction[], rates };
  });

export const upsertTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TransactionInput) => {
    if (
      !input?.description ||
      typeof input.amount !== "number" ||
      !input.occurred_on ||
      !input.kind
    ) {
      throw new Error("Invalid transaction payload");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const currency = (data.currency ?? "USD").toUpperCase();
    const rates = await getRatesForDate(data.occurred_on);
    const fx_rate = rateFor(rates, currency);

    const payload = {
      user_id: userId,
      description: data.description,
      amount: data.amount,
      currency,
      occurred_on: data.occurred_on,
      category: data.category ?? "Other",
      kind: data.kind,
      account: data.account ?? null,
      receipt_path: data.receipt_path ?? null,
      receipt_captured_at: data.receipt_path ? new Date().toISOString() : null,
      is_refund: data.is_refund ?? false,
      duplicate_status: data.duplicate_status ?? "unique",
      duplicate_of_transaction_id: data.duplicate_of_transaction_id ?? null,
      fx_rate,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("ledger_transactions")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row as LedgerTransaction;
    }

    const { data: row, error } = await supabase
      .from("ledger_transactions")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LedgerTransaction;
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ledger_transactions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markDuplicateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "unique" | "duplicate" | "false_positive" }) => {
    if (!input?.id || !input?.status) throw new Error("Invalid payload");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ledger_transactions")
      .update({ duplicate_status: data.status })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Investments ----

export const listInvestments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("ledger_investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as LedgerInvestment[];
  });

export const upsertInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      input: Partial<LedgerInvestment> & {
        name: string;
        type: string;
        value: number;
        currency: string;
      },
    ) => {
      if (!input?.name || typeof input.value !== "number")
        throw new Error("Invalid investment payload");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      name: data.name,
      type: data.type ?? "Other",
      value: data.value,
      currency: (data.currency ?? "USD").toUpperCase(),
      cost_basis: data.cost_basis ?? null,
      entry_date: data.entry_date ?? null,
      notes: data.notes ?? null,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("ledger_investments")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row as LedgerInvestment;
    }
    const { data: row, error } = await supabase
      .from("ledger_investments")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LedgerInvestment;
  });

export const deleteInvestment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ledger_investments")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Subscriptions ----

export const listSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("ledger_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("next_billing_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as LedgerSubscription[];
  });

export const upsertSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<LedgerSubscription> & { name: string; amount: number }) => {
    if (!input?.name || typeof input.amount !== "number")
      throw new Error("Invalid subscription payload");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      name: data.name,
      amount: data.amount,
      currency: (data.currency ?? "USD").toUpperCase(),
      frequency: data.frequency ?? "monthly",
      next_billing_date: data.next_billing_date ?? null,
      category: data.category ?? "Software",
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("ledger_subscriptions")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row as LedgerSubscription;
    }
    const { data: row, error } = await supabase
      .from("ledger_subscriptions")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LedgerSubscription;
  });

export const deleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ledger_subscriptions")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Financial periods ----

export const listPeriods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("ledger_financial_periods")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as LedgerPeriod[];
  });

export const upsertPeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: Partial<LedgerPeriod> & { name: string; start_date: string; end_date: string }) => {
      if (!input?.name || !input.start_date || !input.end_date)
        throw new Error("Invalid period payload");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      name: data.name,
      description: data.description ?? null,
      start_date: data.start_date,
      end_date: data.end_date,
      color: data.color ?? "#b67b22",
      category: data.category ?? null,
    };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("ledger_financial_periods")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row as LedgerPeriod;
    }
    const { data: row, error } = await supabase
      .from("ledger_financial_periods")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as LedgerPeriod;
  });

export const deletePeriod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("ledger_financial_periods")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Dashboard bundle ----

export const getLedgerDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { start?: string; end?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const range = {
      start: data.start ?? defaultRange().start,
      end: data.end ?? defaultRange().end,
    };

    const [txResult, investmentsResult, subscriptionsResult, periodsResult, pageResult] =
      await Promise.all([
        supabase
          .from("ledger_transactions")
          .select("*")
          .eq("user_id", userId)
          .gte("occurred_on", range.start)
          .lte("occurred_on", range.end)
          .order("occurred_on", { ascending: true }),
        supabase
          .from("ledger_investments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("ledger_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("next_billing_date", { ascending: true }),
        supabase
          .from("ledger_financial_periods")
          .select("*")
          .eq("user_id", userId)
          .order("start_date", { ascending: false }),
        supabase
          .from("ledger_transactions")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .order("occurred_on", { ascending: false })
          .order("created_at", { ascending: false })
          .range(0, PAGE_SIZE_DEFAULT - 1),
      ]);

    if (txResult.error) throw new Error(txResult.error.message);
    if (pageResult.error) throw new Error(pageResult.error.message);

    const transactions = (txResult.data ?? []) as LedgerTransaction[];
    const recentRows = (pageResult.data ?? []) as LedgerTransaction[];
    const allDates = [
      ...transactions.map((t) => t.occurred_on),
      ...recentRows.map((t) => t.occurred_on),
    ];
    const rates = await getRatesForDates(allDates);

    return {
      range,
      transactions,
      investments: (investmentsResult.data ?? []) as LedgerInvestment[],
      subscriptions: (subscriptionsResult.data ?? []) as LedgerSubscription[],
      periods: (periodsResult.data ?? []) as LedgerPeriod[],
      recentPage: {
        rows: recentRows,
        total: pageResult.count ?? 0,
        page: 1,
        pageSize: PAGE_SIZE_DEFAULT,
      },
      rates,
    };
  });
