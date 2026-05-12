-- ═══════════════════════════════════════════════════════════════════════════
-- Tower Defense · Supabase Schema
-- Run this SQL in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Player save data ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_saves (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coins          INTEGER     NOT NULL DEFAULT 0,
  level          INTEGER     NOT NULL DEFAULT 0,
  xp             INTEGER     NOT NULL DEFAULT 0,
  profile_image  TEXT,
  unlocked_towers TEXT[]     NOT NULL DEFAULT ARRAY['archer', 'cannon'],
  tower_levels   JSONB       NOT NULL DEFAULT '{"archer":1,"cannon":1,"mage":1,"ice":1,"lightning":1}',
  completed_levels TEXT[]    NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Row Level Security (each user sees only their own row) ────────────────
ALTER TABLE public.player_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_saves: select own"
  ON public.player_saves FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "player_saves: insert own"
  ON public.player_saves FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "player_saves: update own"
  ON public.player_saves FOR UPDATE
  USING (auth.uid() = id);

-- ── 3. Auto-create a row on sign-up via trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.player_saves (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
