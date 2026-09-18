/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TimelineItemType = 
  | 'flight' 
  | 'hotel' 
  | 'spot' 
  | 'transport' 
  | 'food' 
  | 'activity' 
  | 'other';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  color: string;
  last_active?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  currency: string;
  invite_code: string;
  created_at: string;
}

export interface Plan {
  id: string;
  trip_id: string;
  plan_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  created_by?: string;
  votes: number;
  created_at?: string;
}

export interface TimelineItem {
  id: string;
  plan_id: string;
  type: TimelineItemType;
  title: string;
  cost: number;
  currency: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  added_by?: string;
  added_by_name?: string;
  order_index?: number;
  created_at?: string;
}

export interface PlanVote {
  id: string;
  plan_id: string;
  user_id: string;
  created_at: string;
}

export interface PlanCostSummary {
  planId: string;
  totalCost: number;
  currency: string;
  itemCount: number;
  daysCount: number;
  costPerDay: number;
  byType: Record<TimelineItemType, number>;
}

export type SyncStatus = 'connected' | 'connecting' | 'demo' | 'error';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}
