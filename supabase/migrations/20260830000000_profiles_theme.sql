ALTER TABLE public.profiles
  ADD COLUMN theme text CHECK (theme IN ('light', 'dark'));
