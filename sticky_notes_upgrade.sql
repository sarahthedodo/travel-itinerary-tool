-- Run this once in the Supabase SQL Editor for an existing TripSync database.
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

ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to sticky_notes" ON public.sticky_notes;
CREATE POLICY "Public full access to sticky_notes"
ON public.sticky_notes FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sticky_notes REPLICA IDENTITY FULL;