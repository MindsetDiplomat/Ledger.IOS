-- LEDGER: transactions
CREATE TABLE public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  occurred_on date NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  kind text NOT NULL CHECK (kind IN ('income', 'expense')),
  account text,
  receipt_path text,
  receipt_captured_at timestamptz,
  is_refund boolean NOT NULL DEFAULT false,
  duplicate_status text NOT NULL DEFAULT 'unique' CHECK (duplicate_status IN ('unique', 'duplicate', 'false_positive')),
  duplicate_of_transaction_id uuid REFERENCES public.ledger_transactions(id) ON DELETE SET NULL,
  fx_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledger_transactions_occurred_on_idx ON public.ledger_transactions (occurred_on);
CREATE INDEX ledger_transactions_user_occurred_amount_idx ON public.ledger_transactions (user_id, occurred_on, amount);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_transactions TO authenticated;
GRANT ALL ON public.ledger_transactions TO service_role;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ledger transactions" ON public.ledger_transactions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ledger_transactions_touch BEFORE UPDATE ON public.ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEDGER: investments
CREATE TABLE public.ledger_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Other',
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  cost_basis numeric,
  entry_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_investments TO authenticated;
GRANT ALL ON public.ledger_investments TO service_role;
ALTER TABLE public.ledger_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ledger investments" ON public.ledger_investments
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ledger_investments_touch BEFORE UPDATE ON public.ledger_investments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEDGER: subscriptions
CREATE TABLE public.ledger_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_billing_date date,
  category text NOT NULL DEFAULT 'Software',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_subscriptions TO authenticated;
GRANT ALL ON public.ledger_subscriptions TO service_role;
ALTER TABLE public.ledger_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ledger subscriptions" ON public.ledger_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ledger_subscriptions_touch BEFORE UPDATE ON public.ledger_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEDGER: financial periods
CREATE TABLE public.ledger_financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  color text NOT NULL DEFAULT '#b67b22',
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_financial_periods TO authenticated;
GRANT ALL ON public.ledger_financial_periods TO service_role;
ALTER TABLE public.ledger_financial_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ledger periods" ON public.ledger_financial_periods
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ledger_financial_periods_touch BEFORE UPDATE ON public.ledger_financial_periods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEDGER: private storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ledger-receipts', 'ledger-receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own ledger receipts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ledger-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own ledger receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ledger-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own ledger receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ledger-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
