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
  SyncStatus,
  TimelineItemType
} from '../types';
import { getSupabase, getSavedConfig } from '../lib/supabase';
import { 
  INITIAL_USER, 
  INITIAL_TEAM, 
  INITIAL_TRIP, 
  INITIAL_PLANS, 
  INITIAL_TIMELINE_ITEMS 
} from '../lib/sampleData';

const LOCAL_STORAGE_KEY_TRIP = 'tripsync_active_trip';
const LOCAL_STORAGE_KEY_PLANS = 'tripsync_active_plans';
const LOCAL_STORAGE_KEY_ITEMS = 'tripsync_active_items';
const LOCAL_STORAGE_KEY_USER = 'tripsync_active_user';
const LOCAL_STORAGE_KEY_TEAM = 'tripsync_active_team';
const LOCAL_STORAGE_KEY_VOTES = 'tripsync_active_votes';

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
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return INITIAL_USER;
  });

  // 2. Active Trip
  const [trip, setTrip] = useState<Trip>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRIP);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return INITIAL_TRIP;
  });

  // 3. Plans
  const [plans, setPlans] = useState<Plan[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PLANS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return INITIAL_PLANS;
  });

  // 4. Timeline items
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return INITIAL_TIMELINE_ITEMS;
  });

  // 5. User votes (Map of plan_id -> voted boolean by current user)
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_VOTES);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return { '11111111-1111-1111-1111-111111111111': true };
  });

  // 6. Online team members
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TEAM);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.warn(e); }
      }
    }
    return INITIAL_TEAM;
  });

  // 7. Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('demo');
  const [recentNotification, setRecentNotification] = useState<RealtimeActionNotification | null>(null);

  // Cross-tab broadcast channel for instant multi-tab sync in local/demo mode
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Save current user to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Persist local state for demo fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRIP, JSON.stringify(trip));
      localStorage.setItem(LOCAL_STORAGE_KEY_PLANS, JSON.stringify(plans));
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(timelineItems));
      localStorage.setItem(LOCAL_STORAGE_KEY_VOTES, JSON.stringify(userVotes));
      localStorage.setItem(LOCAL_STORAGE_KEY_TEAM, JSON.stringify(teamMembers));
    }
  }, [trip, plans, timelineItems, userVotes, teamMembers]);

  // Notification auto-dismiss
  useEffect(() => {
    if (recentNotification) {
      const timer = setTimeout(() => {
        setRecentNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentNotification]);

  // Notify helper
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

        if (type === 'TIMELINE_ITEM_UPSERT') {
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
              p.id === payload.planId ? { ...p, votes: p.votes + (payload.delta || 1) } : p
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
        // 1. Fetch current trip
        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .eq('id', trip.id)
          .single();

        if (isMounted && tripData) {
          setTrip(tripData);
        }

        // 2. Fetch plans for this trip
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('trip_id', trip.id)
          .order('created_at', { ascending: true });

        if (isMounted && plansData && plansData.length > 0) {
          setPlans(plansData);
        }

        // 3. Fetch all timeline items for this trip's plans
        const { data: itemsData } = await supabase
          .from('timeline_items')
          .select('*')
          .order('date', { ascending: true })
          .order('order_index', { ascending: true });

        if (isMounted && itemsData && itemsData.length > 0) {
          setTimelineItems(itemsData);
        }

        // 4. Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .limit(20);

        if (isMounted && profilesData && profilesData.length > 0) {
          setTeamMembers(profilesData);
        }

        if (isMounted) {
          setSyncStatus('connected');
        }
      } catch (err) {
        console.error('Error fetching Supabase data:', err);
        if (isMounted) setSyncStatus('error');
      }
    }

    fetchInitialData();

    // Register profile presence
    supabase.from('profiles').upsert({
      id: currentUser.id,
      name: currentUser.name,
      avatar_url: currentUser.avatar_url,
      color: currentUser.color,
      updated_at: new Date().toISOString(),
    }).then();

    // Setup Supabase Realtime Subscriptions
    const channelName = `trip-room-${trip.id.substring(0, 8)}`;
    const channel = supabase.channel(channelName);

    // 1. Listen to timeline_items changes
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

    // 2. Listen to plans changes
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
            return [...prev, newPlan];
          });
          triggerNotification('Collaborator', `created plan "${newPlan.plan_name}"`);
        } else if (eventType === 'UPDATE') {
          setPlans((prev) =>
            prev.map((p) => (p.id === newPlan.id ? newPlan : p))
          );
        } else if (eventType === 'DELETE') {
          setPlans((prev) => prev.filter((p) => p.id !== oldPlan.id));
          setTimelineItems((prev) => prev.filter((i) => i.plan_id !== oldPlan.id));
          triggerNotification('Collaborator', 'removed an itinerary plan');
        }
      }
    );

    // 3. Listen to trips changes
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'trips' },
      (payload) => {
        if (!isMounted) return;
        const updatedTrip = payload.new as Trip;
        if (updatedTrip.id === trip.id) {
          setTrip(updatedTrip);
        }
      }
    );

    // 4. Listen to profiles changes
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
  }, [trip.id, currentUser, triggerNotification]);

  // MUTATION: Add or Edit Timeline Item
  const upsertTimelineItem = useCallback(async (itemData: Omit<TimelineItem, 'id'> & { id?: string }) => {
    const supabase = getSupabase();
    const itemId = itemData.id || `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const fullItem: TimelineItem = {
      ...itemData,
      id: itemId,
      currency: itemData.currency || trip.currency,
      added_by: itemData.added_by || currentUser.id,
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

    // Broadcast across tabs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TIMELINE_ITEM_UPSERT',
        payload: fullItem,
        sender: currentUser.id,
      });
    }

    // Sync to Supabase if available
    if (supabase) {
      try {
        await supabase.from('timeline_items').upsert(fullItem);
      } catch (err) {
        console.error('Failed to sync item to Supabase:', err);
      }
    }
  }, [currentUser, trip.currency]);

  // MUTATION: Delete Timeline Item
  const deleteTimelineItem = useCallback(async (itemId: string) => {
    const supabase = getSupabase();

    // Optimistic local state update
    setTimelineItems((prev) => prev.filter((i) => i.id !== itemId));

    // Broadcast across tabs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'TIMELINE_ITEM_DELETE',
        payload: { id: itemId },
        sender: currentUser.id,
      });
    }

    // Sync to Supabase
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
    const supabase = getSupabase();
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newPlan: Plan = {
      ...planData,
      id: planId,
      trip_id: trip.id,
      votes: 0,
      created_by: currentUser.id,
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
        await supabase.from('plans').insert(newPlan);
      } catch (err) {
        console.error('Failed to add plan to Supabase:', err);
      }
    }

    return newPlan;
  }, [currentUser.id, trip.id]);

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

    // Broadcast across tabs
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PLAN_VOTE',
        payload: { planId, delta },
        sender: currentUser.id,
      });
    }

    // Sync to Supabase
    if (supabase) {
      try {
        const targetPlan = plans.find((p) => p.id === planId);
        const newVotes = Math.max(0, (targetPlan?.votes || 0) + delta);
        await supabase.from('plans').update({ votes: newVotes }).eq('id', planId);
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

  // MUTATION: Update Trip Meta
  const updateTrip = useCallback(async (updatedTrip: Trip) => {
    setTrip(updatedTrip);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trips').upsert(updatedTrip);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Reset to default sample trip
  const resetToSampleData = useCallback(() => {
    setTrip(INITIAL_TRIP);
    setPlans(INITIAL_PLANS);
    setTimelineItems(INITIAL_TIMELINE_ITEMS);
    setTeamMembers(INITIAL_TEAM);
    setUserVotes({ '11111111-1111-1111-1111-111111111111': true });
  }, []);

  return {
    currentUser,
    trip,
    plans,
    timelineItems,
    teamMembers,
    userVotes,
    syncStatus,
    recentNotification,
    upsertTimelineItem,
    deleteTimelineItem,
    addPlan,
    deletePlan,
    toggleVote,
    updateProfile,
    updateTrip,
    resetToSampleData,
  };
}
