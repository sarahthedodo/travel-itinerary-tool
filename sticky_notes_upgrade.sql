-- STICKY NOTES ONLY - migration for an existing TripSync database.
-- Run this file by itself in Supabase SQL Editor.
-- It does not recreate or modify profiles, trips, plans, timeline_items, or plan_votes.
-- The reference to public.trips only links each memo to an existing trip.

-- 1. Add the memo table.
CREATE TABLE IF NOT EXISTS public.sticky_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color TEXT DEFAULT 'oat' NOT NULL,
    author_id TEXT DEFAULT '',
    author_name TEXT DEFAULT 'Anonymous' NOT NULL,
    author_color TEXT DEFAULT '#5B7065' NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    rotation NUMERIC(5, 2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Allow the app's existing anonymous Supabase client to read and write memos.
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to sticky_notes" ON public.sticky_notes;
CREATE POLICY "Public full access to sticky_notes"
ON public.sticky_notes FOR ALL USING (true) WITH CHECK (true);

-- 3. Add only this table to Realtime. Re-running this block is safe.
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Include complete old rows in Realtime delete/update events.
ALTER TABLE public.sticky_notes REPLICA IDENTITY FULL;