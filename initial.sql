-- ==============================================================================
-- TripSync Database Schema (Supabase PostgreSQL + Realtime)
-- Run this in your Supabase SQL Editor to enable cross-device live collaboration
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    destination TEXT DEFAULT '',
    currency TEXT DEFAULT 'USD' NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    created_by UUID,
    votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.timeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    cost NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    date DATE NOT NULL,
    time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    added_by UUID,
    added_by_name TEXT DEFAULT 'Anonymous',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plan_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to timeline_items" ON public.timeline_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to plan_votes" ON public.plan_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to sticky_notes" ON public.sticky_notes FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_votes;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.plans REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_items REPLICA IDENTITY FULL;
ALTER TABLE public.plan_votes REPLICA IDENTITY FULL;