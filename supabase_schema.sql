-- ==============================================================================
-- TripSync Database Schema (Supabase PostgreSQL + Realtime)
-- ==============================================================================
-- Run this script in your Supabase project's SQL Editor (Dashboard -> SQL Editor)
-- This creates all required tables, Row Level Security (RLS) policies,
-- and enables Realtime change broadcast for live multi-user collaboration.
-- ==============================================================================

-- 1. Create Profiles Table (Simplified user info without requiring auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    color TEXT DEFAULT '#3B82F6',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Trips Table (Big travel theme, e.g., "September USA Fall Vacation")
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    destination TEXT DEFAULT '',
    currency TEXT DEFAULT 'USD' NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Plans Table (Alternative candidate itineraries, e.g., Plan A, Plan B)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL, -- e.g. "Plan A: NYC Deep Dive"
    description TEXT DEFAULT '',
    start_date DATE,
    end_date DATE,
    created_by UUID,
    votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Timeline_Items Table (Flight, hotel, spots, transit nodes)
CREATE TABLE IF NOT EXISTS public.timeline_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'flight' | 'hotel' | 'spot' | 'transport' | 'food' | 'activity' | 'other'
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

-- 5. Create Plan_Votes Table (Collaborative voting records)
CREATE TABLE IF NOT EXISTS public.plan_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, user_id)
);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- For a lightweight frictionless travel collaboration app, we enable RLS
-- with open read/insert/update/delete policies via anon key.
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_votes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public full access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Trips Policies
CREATE POLICY "Public full access to trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);

-- Plans Policies
CREATE POLICY "Public full access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);

-- Timeline Items Policies
CREATE POLICY "Public full access to timeline_items" ON public.timeline_items FOR ALL USING (true) WITH CHECK (true);

-- Plan Votes Policies
CREATE POLICY "Public full access to plan_votes" ON public.plan_votes FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Enable Realtime Broadcast for all collaborative tables
-- ==============================================================================
-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plan_votes;

-- Ensure full replica identity for realtime update payloads
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.plans REPLICA IDENTITY FULL;
ALTER TABLE public.timeline_items REPLICA IDENTITY FULL;
ALTER TABLE public.plan_votes REPLICA IDENTITY FULL;

-- ==============================================================================
-- Initial Demo Trip Seed Data (Optional, but great for instant testing)
-- ==============================================================================
INSERT INTO public.trips (id, title, destination, currency, invite_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'September US East Coast Adventure', 'United States', 'USD', 'TRIP-USA-2026')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans (id, trip_id, plan_name, description, start_date, end_date, votes)
VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Plan A: New York City 5-Day Urban Deep Dive', 'Focus on Manhattan, Brooklyn, Broadway shows, and Michelin dining', '2026-09-12', '2026-09-17', 3),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Plan B: Boston Historic & Coastal Discovery', 'Harvard, Freedom Trail, Cape Cod day trip & fresh seafood', '2026-09-12', '2026-09-17', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.timeline_items (id, plan_id, type, title, cost, currency, date, time, location, added_by_name, notes)
VALUES
('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'flight', 'Roundtrip Flight to JFK Airport', 680.00, 'USD', '2026-09-12', '08:30', 'JFK Terminal 4', 'Sarah (London)', 'British Airways flight direct. Group booking discount available.'),
('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'hotel', 'The Standard High Line (4 Nights)', 920.00, 'USD', '2026-09-12', '15:00', 'Meatpacking District, NY', 'Sarah (London)', 'River view 2-bed suite, includes rooftop terrace access.'),
('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'spot', 'Broadway Show: Wicked Musical', 145.00, 'USD', '2026-09-13', '19:30', 'Gershwin Theatre', 'Leo (Paris)', 'Orchestra row F seats reserved.'),
('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'spot', 'Metropolitan Museum of Art + Rooftop', 30.00, 'USD', '2026-09-14', '10:00', '1000 5th Ave', 'Alex (Berlin)', 'Skip-the-line group ticket.'),
('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', 'transport', '7-Day Unlimited NYC MetroCard', 34.00, 'USD', '2026-09-12', '12:00', 'NYC Subway', 'Leo (Paris)', 'Unlimited subway and local bus rides.'),

('44444444-4444-4444-4444-444444444401', '22222222-2222-2222-2222-222222222222', 'flight', 'Roundtrip Flight to Boston Logan (BOS)', 560.00, 'USD', '2026-09-12', '09:15', 'Boston Logan Airport', 'Leo (Paris)', 'Air France connection to Boston Logan.'),
('44444444-4444-4444-4444-444444444402', '22222222-2222-2222-2222-222222222222', 'hotel', 'The Liberty Hotel Boston (4 Nights)', 780.00, 'USD', '2026-09-12', '14:30', 'Beacon Hill, Boston', 'Sarah (London)', 'Converted historic building near Charles River.'),
('44444444-4444-4444-4444-444444444403', '22222222-2222-2222-2222-222222222222', 'spot', 'Harvard & MIT Guided Academic Tour', 25.00, 'USD', '2026-09-13', '11:00', 'Cambridge, MA', 'Alex (Berlin)', 'Student-led walking tour around Harvard Yard.'),
('44444444-4444-4444-4444-444444444404', '22222222-2222-2222-2222-222222222222', 'food', 'Boston Harbor Lobster Feast Dinner', 85.00, 'USD', '2026-09-14', '18:30', 'Seaport District', 'Sarah (London)', 'Fresh New England clam chowder & Maine lobster.')
ON CONFLICT (id) DO NOTHING;
