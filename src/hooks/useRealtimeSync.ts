/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trip, 
  Plan, 
  TimelineItem, 
  UserProfile, 
  SyncStatus
} from '../types';
import { getSupabase, getSavedConfig } from '../lib/supabase';
import { createDefaultUser } from '../lib/sampleData';
import { generateUUID, ensureUUID, isValidUUID } from '../lib/uuid';

const LOCAL_STORAGE_KEY_USER = 'tripsync_active_user';
const LOCAL_STORAGE_KEY_TRIPS = 'tripsync_all_trips';
const LOCAL_STORAGE_KEY_ACTIVE_TRIP_ID = 'tripsync_active_trip_id';
const LOCAL_STORAGE_KEY_PLANS = 'tripsync_active_plans';
const LOCAL_STORAGE_KEY_ITEMS = 'tripsync_active_items';
const LOCAL_STORAGE_KEY_VOTES = 'tripsync_active_votes';
const LOCAL_STORAGE_KEY_TEAM = 'tripsync_active_team';

interface RealtimeActionNotification {
  id: string;
  userName: string;
  actionText: string;
  timestamp: number;
}

export function useRealtimeSync() {
  // 1. Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (saved) {
        try { 
          const parsed = JSON.parse(saved); 
          if (parsed && typeof parsed === 'object') {
            if (!isValidUUID(parsed.id)) {
              parsed.id = generateUUID();
              localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(parsed));
            }
            return parsed;
          }
        } catch (e) { console.warn(e); }
      }
    }
    const def = createDefaultUser();
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(def));
    }
    return def;
  });

  // 2. Trips collection & active trip ID
  const [trips, setTrips] = useState<Trip[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRIPS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return [];
  });

  const [activeTripId, setActiveTripId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_TRIP_ID);
      if (savedId) return savedId;
    }
    return null;
  });

  // 3. Plans for the active trip
  const [plans, setPlans] = useState<Plan[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PLANS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return [];
  });

  // 4. Timeline items for the active trip's plans
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return [];
  });

  // 5. User votes (Map of plan_id -> voted boolean by current user)
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_VOTES);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return {};
  });

  // 6. Online team members
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([currentUser]);

  // 7. Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('demo');
  const [recentNotification, setRecentNotification] = useState<RealtimeActionNotification | null>(null);

  // Cross-tab broadcast channel for local mode
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Active Trip derived object
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || null;

  // Persist current user to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Persist local state for offline demo fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRIPS, JSON.stringify(trips));
      if (activeTripId) {
        localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_TRIP_ID, activeTripId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_TRIP_ID);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_PLANS, JSON.stringify(plans));
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(timelineItems));
      localStorage.setItem(LOCAL_STORAGE_KEY_VOTES, JSON.stringify(userVotes));
      localStorage.setItem(LOCAL_STORAGE_KEY_TEAM, JSON.stringify(teamMembers));
    }
  }, [trips, activeTripId, plans, timelineItems, userVotes, teamMembers]);

  // Notification auto-dismiss
  useEffect(() => {
    if (recentNotification) {
      const timer = setTimeout(() => {
        setRecentNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentNotification]);

  const triggerNotification = useCallback((userName: string, actionText: string) => {
    setRecentNotification({
      id: Math.random().toString(36).substring(2),
      userName,
      actionText,
      timestamp: Date.now(),
    });
  }, []);

  // Broadcast channel for multi-tab collaboration test
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('tripsync_realtime_collaboration');
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const { type, payload, sender } = event.data || {};
        if (sender === currentUser.id) return; // ignore self

        if (type === 'TRIP_UPSERT') {
          setTrips((prev) => {
            const idx = prev.findIndex((t) => t.id === payload.id);
            if (idx >= 0) {
              const clone = [...prev];
              clone[idx] = payload;
              return clone;
            }
            return [payload, ...prev];
          });
          triggerNotification('Collaborator', `updated trip "${payload.title}"`);
        } else if (type === 'TRIP_DELETE') {
          setTrips((prev) => prev.filter((t) => t.id !== payload.id));
          triggerNotification('Collaborator', 'deleted a trip');
        } else if (type === 'TIMELINE_ITEM_UPSERT') {
          setTimelineItems((prev) => {
            const index = prev.findIndex((i) => i.id === payload.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload;
              return updated;
            }
            return [...prev, payload];
          });
          triggerNotification(payload.added_by_name || 'Team member', `added "${payload.title}"`);
        } else if (type === 'TIMELINE_ITEM_DELETE') {
          setTimelineItems((prev) => prev.filter((i) => i.id !== payload.id));
          triggerNotification('Team member', 'removed an itinerary item');
        } else if (type === 'PLAN_UPSERT') {
          setPlans((prev) => {
            const index = prev.findIndex((p) => p.id === payload.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload;
              return updated;
            }
            return [...prev, payload];
          });
          triggerNotification('Team member', `updated plan "${payload.plan_name}"`);
        } else if (type === 'PLAN_DELETE') {
          setPlans((prev) => prev.filter((p) => p.id !== payload.id));
          setTimelineItems((prev) => prev.filter((i) => i.plan_id !== payload.id));
          triggerNotification('Team member', 'deleted a plan');
        } else if (type === 'PLAN_VOTE') {
          setPlans((prev) =>
            prev.map((p) =>
              p.id === payload.planId ? { ...p, votes: Math.max(0, p.votes + (payload.delta || 1)) } : p
            )
          );
          triggerNotification('Team member', 'voted on a plan');
        } else if (type === 'PROFILE_UPDATE') {
          setTeamMembers((prev) => {
            const existing = prev.findIndex((m) => m.id === payload.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = payload;
              return updated;
            }
            return [...prev, payload];
          });
        }
      };

      return () => {
        bc.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }, [currentUser.id, triggerNotification]);

  // Main Supabase Realtime Listener setup
  useEffect(() => {
    const config = getSavedConfig();
    const supabase = getSupabase();

    if (!config.isConfigured || !supabase) {
      setSyncStatus('demo');
      return;
    }

    setSyncStatus('connecting');
    let isMounted = true;

    async function fetchInitialData() {
      if (!supabase) return;
      try {
        // 1. Fetch all trips
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .order('created_at', { ascending: false });

        if (tripsError) throw tripsError;

        if (isMounted) {
          if (tripsData && tripsData.length > 0) {
            setTrips(tripsData);
            
            // Choose active trip ID
            const targetTripId = activeTripId && tripsData.some(t => t.id === activeTripId)
              ? activeTripId
              : tripsData[0].id;
            
            setActiveTripId(targetTripId);

            // 2. Fetch plans for active trip
            const { data: plansData } = await supabase
              .from('plans')
              .select('*')
              .eq('trip_id', targetTripId)
              .order('created_at', { ascending: true });

            if (isMounted && plansData) {
              setPlans(plansData);

              // 3. Fetch timeline items for this trip's plans
              if (plansData.length > 0) {
                const planIds = plansData.map(p => p.id);
                const { data: itemsData } = await supabase
                  .from('timeline_items')
                  .select('*')
                  .in('plan_id', planIds)
                  .order('date', { ascending: true })
                  .order('order_index', { ascending: true });

                if (isMounted && itemsData) {
                  setTimelineItems(itemsData);
                }
              } else {
                setTimelineItems([]);
              }
            }
          } else {
            // No trips exist in database yet (clean empty state)
            setTrips([]);
            setActiveTripId(null);
            setPlans([]);
            setTimelineItems([]);
          }

          // 4. Fetch profiles
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .limit(20);

          if (isMounted && profilesData && profilesData.length > 0) {
            setTeamMembers(profilesData);
          }

          // 5. Fetch user votes
          const { data: votesData } = await supabase
            .from('plan_votes')
            .select('plan_id')
            .eq('user_id', currentUser.id);

          if (isMounted && votesData) {
            const voteMap: Record<string, boolean> = {};
            votesData.forEach(v => { voteMap[v.plan_id] = true; });
            setUserVotes(voteMap);
          }

          setSyncStatus('connected');
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
        if (isMounted) setSyncStatus('error');
      }
    }

    fetchInitialData();

    // Register user profile
    supabase.from('profiles').upsert({
      id: currentUser.id,
      name: currentUser.name,
      avatar_url: currentUser.avatar_url,
      color: currentUser.color,
      updated_at: new Date().toISOString(),
    }).then();

    // Realtime channel
    const channel = supabase.channel('tripsync_global_realtime');

    // 1. Listen to trips table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trips' },
      (payload) => {
        if (!isMounted) return;
        const eventType = payload.eventType;
        const newTrip = payload.new as Trip;
        const oldTrip = payload.old as { id: string };

        if (eventType === 'INSERT') {
          setTrips((prev) => {
            if (prev.some((t) => t.id === newTrip.id)) return prev;
            return [newTrip, ...prev];
          });
          triggerNotification('Collaborator', `created trip "${newTrip.title}"`);
        } else if (eventType === 'UPDATE') {
          setTrips((prev) => prev.map((t) => (t.id === newTrip.id ? newTrip : t)));
        } else if (eventType === 'DELETE') {
          setTrips((prev) => prev.filter((t) => t.id !== oldTrip.id));
          setActiveTripId((prevId) => (prevId === oldTrip.id ? null : prevId));
        }
      }
    );

    // 2. Listen to plans table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'plans' },
      (payload) => {
        if (!isMounted) return;
        const eventType = payload.eventType;
        const newPlan = payload.new as Plan;
        const oldPlan = payload.old as { id: string };

        if (eventType === 'INSERT') {
          setPlans((prev) => {
            if (prev.some((p) => p.id === newPlan.id)) return prev;
            if (newPlan.trip_id === activeTripId) {
              return [...prev, newPlan];
            }
            return prev;
          });
          triggerNotification('Collaborator', `created plan "${newPlan.plan_name}"`);
        } else if (eventType === 'UPDATE') {
          setPlans((prev) => prev.map((p) => (p.id === newPlan.id ? newPlan : p)));
        } else if (eventType === 'DELETE') {
          setPlans((prev) => prev.filter((p) => p.id !== oldPlan.id));
          setTimelineItems((prev) => prev.filter((i) => i.plan_id !== oldPlan.id));
          triggerNotification('Collaborator', 'removed an itinerary plan');
        }
      }
    );

    // 3. Listen to timeline_items table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'timeline_items' },
      (payload) => {
        if (!isMounted) return;
        const eventType = payload.eventType;
        const newRecord = payload.new as TimelineItem;
        const oldRecord = payload.old as { id: string };

        if (eventType === 'INSERT') {
          setTimelineItems((prev) => {
            if (prev.some((i) => i.id === newRecord.id)) return prev;
            return [...prev, newRecord];
          });
          triggerNotification(newRecord.added_by_name || 'Collaborator', `added "${newRecord.title}"`);
        } else if (eventType === 'UPDATE') {
          setTimelineItems((prev) =>
            prev.map((i) => (i.id === newRecord.id ? newRecord : i))
          );
          triggerNotification(newRecord.added_by_name || 'Collaborator', `updated "${newRecord.title}"`);
        } else if (eventType === 'DELETE') {
          setTimelineItems((prev) => prev.filter((i) => i.id !== oldRecord.id));
          triggerNotification('Collaborator', 'deleted a timeline item');
        }
      }
    );

    // 4. Listen to profiles table
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      (payload) => {
        if (!isMounted) return;
        const profile = payload.new as UserProfile;
        if (profile && profile.id) {
          setTeamMembers((prev) => {
            const idx = prev.findIndex((m) => m.id === profile.id);
            if (idx >= 0) {
              const clone = [...prev];
              clone[idx] = profile;
              return clone;
            }
            return [...prev, profile];
          });
        }
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (isMounted) setSyncStatus('connected');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (isMounted) setSyncStatus('error');
      }
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeTripId, currentUser.id, triggerNotification]);

  // When activeTripId changes, fetch plans & items for the newly selected trip
  const switchTrip = useCallback(async (tripId: string) => {
    setActiveTripId(tripId);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: true });

        if (plansData) {
          setPlans(plansData);

          if (plansData.length > 0) {
            const planIds = plansData.map((p) => p.id);
            const { data: itemsData } = await supabase
              .from('timeline_items')
              .select('*')
              .in('plan_id', planIds)
              .order('date', { ascending: true })
              .order('order_index', { ascending: true });

            setTimelineItems(itemsData || []);
          } else {
            setTimelineItems([]);
          }
        }
      } catch (err) {
        console.error('Failed to load trip plans:', err);
      }
    }
  }, []);

  // MUTATION: Create a New Trip
  const createTrip = useCallback(async (data: { title: string; destination?: string; currency?: string }) => {
    const supabase = getSupabase();
    const tripId = ensureUUID();
    const inviteCode = `TRIP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newTrip: Trip = {
      id: tripId,
      title: data.title,
      destination: data.destination || '',
      currency: data.currency || 'USD',
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
    };

    // Update state
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(tripId);
    setPlans([]);
    setTimelineItems([]);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TRIP_UPSERT',
        payload: newTrip,
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        await supabase.from('trips').insert(newTrip);
      } catch (err) {
        console.error('Failed to insert trip to Supabase:', err);
      }
    }

    return newTrip;
  }, [currentUser.id]);

  // MUTATION: Update Trip Meta
  const updateTrip = useCallback(async (updatedTrip: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TRIP_UPSERT',
        payload: updatedTrip,
        sender: currentUser.id,
      });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trips').upsert(updatedTrip);
      } catch (e) {
        console.error('Failed to update trip in Supabase:', e);
      }
    }
  }, [currentUser.id]);

  // MUTATION: Delete Trip
  const deleteTrip = useCallback(async (tripId: string) => {
    setTrips((prev) => {
      const filtered = prev.filter((t) => t.id !== tripId);
      if (activeTripId === tripId) {
        setActiveTripId(filtered[0]?.id || null);
      }
      return filtered;
    });

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TRIP_DELETE',
        payload: { id: tripId },
        sender: currentUser.id,
      });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trips').delete().eq('id', tripId);
      } catch (e) {
        console.error('Failed to delete trip from Supabase:', e);
      }
    }
  }, [activeTripId, currentUser.id]);

  // MUTATION: Add or Edit Timeline Item
  const upsertTimelineItem = useCallback(async (itemData: Omit<TimelineItem, 'id'> & { id?: string }) => {
    const supabase = getSupabase();
    const itemId = ensureUUID(itemData.id);
    const safePlanId = ensureUUID(itemData.plan_id);
    const safeAddedBy = ensureUUID(itemData.added_by || currentUser.id);
    
    const fullItem: TimelineItem = {
      ...itemData,
      id: itemId,
      plan_id: safePlanId,
      currency: itemData.currency || activeTrip?.currency || 'USD',
      added_by: safeAddedBy,
      added_by_name: itemData.added_by_name || currentUser.name,
      created_at: itemData.created_at || new Date().toISOString(),
    };

    // Optimistic UI update
    setTimelineItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fullItem;
        return next;
      }
      return [...prev, fullItem];
    });

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TIMELINE_ITEM_UPSERT',
        payload: fullItem,
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('timeline_items').upsert(fullItem);
        if (error) {
          console.error('Supabase timeline item upsert error:', error);
        }
      } catch (err) {
        console.error('Failed to sync item to Supabase:', err);
      }
    }
  }, [currentUser, activeTrip]);

  // MUTATION: Delete Timeline Item
  const deleteTimelineItem = useCallback(async (itemId: string) => {
    const supabase = getSupabase();

    setTimelineItems((prev) => prev.filter((i) => i.id !== itemId));

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TIMELINE_ITEM_DELETE',
        payload: { id: itemId },
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        await supabase.from('timeline_items').delete().eq('id', itemId);
      } catch (err) {
        console.error('Failed to delete item from Supabase:', err);
      }
    }
  }, [currentUser.id]);

  // MUTATION: Add Plan
  const addPlan = useCallback(async (planData: Omit<Plan, 'id' | 'votes' | 'trip_id'>) => {
    if (!activeTrip) {
      throw new Error('No active trip to add plan to');
    }

    const supabase = getSupabase();
    const planId = ensureUUID();

    const newPlan: Plan = {
      ...planData,
      id: planId,
      trip_id: ensureUUID(activeTrip.id),
      votes: 0,
      created_by: ensureUUID(currentUser.id),
      created_at: new Date().toISOString(),
    };

    setPlans((prev) => [...prev, newPlan]);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PLAN_UPSERT',
        payload: newPlan,
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        const { error } = await supabase.from('plans').insert(newPlan);
        if (error) {
          console.error('Supabase plan insert error:', error);
        }
      } catch (err) {
        console.error('Failed to add plan to Supabase:', err);
      }
    }

    return newPlan;
  }, [currentUser.id, activeTrip]);

  // MUTATION: Delete Plan
  const deletePlan = useCallback(async (planId: string) => {
    const supabase = getSupabase();

    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setTimelineItems((prev) => prev.filter((i) => i.plan_id !== planId));

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PLAN_DELETE',
        payload: { id: planId },
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        await supabase.from('plans').delete().eq('id', planId);
      } catch (err) {
        console.error('Failed to delete plan in Supabase:', err);
      }
    }
  }, [currentUser.id]);

  // MUTATION: Vote for a plan
  const toggleVote = useCallback(async (planId: string) => {
    const supabase = getSupabase();
    const hasVoted = Boolean(userVotes[planId]);
    const delta = hasVoted ? -1 : 1;
    const safePlanId = ensureUUID(planId);
    const safeUserId = ensureUUID(currentUser.id);

    // Toggle local vote status
    setUserVotes((prev) => {
      const next = { ...prev };
      if (hasVoted) delete next[planId];
      else next[planId] = true;
      return next;
    });

    // Update vote count on plan
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, votes: Math.max(0, p.votes + delta) } : p))
    );

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PLAN_VOTE',
        payload: { planId, delta },
        sender: currentUser.id,
      });
    }

    if (supabase) {
      try {
        const targetPlan = plans.find((p) => p.id === planId);
        const newVotes = Math.max(0, (targetPlan?.votes || 0) + delta);
        await supabase.from('plans').update({ votes: newVotes }).eq('id', safePlanId);

        if (hasVoted) {
          await supabase.from('plan_votes').delete().eq('plan_id', safePlanId).eq('user_id', safeUserId);
        } else {
          await supabase.from('plan_votes').upsert({
            plan_id: safePlanId,
            user_id: safeUserId,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to update vote in Supabase:', err);
      }
    }
  }, [userVotes, plans, currentUser.id]);

  // MUTATION: Update User Profile
  const updateProfile = useCallback(async (newProfile: UserProfile) => {
    setCurrentUser(newProfile);

    setTeamMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === newProfile.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newProfile;
        return next;
      }
      return [...prev, newProfile];
    });

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PROFILE_UPDATE',
        payload: newProfile,
        sender: newProfile.id,
      });
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: newProfile.id,
          name: newProfile.name,
          avatar_url: newProfile.avatar_url,
          color: newProfile.color,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync profile to Supabase:', err);
      }
    }
  }, []);

  // Clear local storage data
  const clearLocalData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY_TRIPS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_TRIP_ID);
      localStorage.removeItem(LOCAL_STORAGE_KEY_PLANS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ITEMS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_VOTES);
    }
    setTrips([]);
    setActiveTripId(null);
    setPlans([]);
    setTimelineItems([]);
    setUserVotes({});
  }, []);

  return {
    currentUser,
    trips,
    activeTrip,
    activeTripId,
    plans,
    timelineItems,
    teamMembers,
    userVotes,
    syncStatus,
    recentNotification,
    switchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    upsertTimelineItem,
    deleteTimelineItem,
    addPlan,
    deletePlan,
    toggleVote,
    updateProfile,
    clearLocalData,
  };
}
