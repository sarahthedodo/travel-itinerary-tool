/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plan, TimelineItem, PlanCostSummary, TimelineItemType } from '../types';

export const CATEGORY_METADATA: Record<
  TimelineItemType,
  { label: string; iconName: string; color: string; bgLight: string; textDark: string; emoji: string }
> = {
  flight: {
    label: 'Flight & Airfare',
    iconName: 'Plane',
    color: '#0284C7',
    bgLight: 'bg-sky-50 border-sky-200',
    textDark: 'text-sky-700',
    emoji: '✈️',
  },
  hotel: {
    label: 'Hotel & Stay',
    iconName: 'Building2',
    color: '#D97706',
    bgLight: 'bg-amber-50 border-amber-200',
    textDark: 'text-amber-800',
    emoji: '🏨',
  },
  spot: {
    label: 'Sightseeing & Tickets',
    iconName: 'Ticket',
    color: '#7C3AED',
    bgLight: 'bg-purple-50 border-purple-200',
    textDark: 'text-purple-700',
    emoji: '🎟️',
  },
  transport: {
    label: 'Local Transit',
    iconName: 'Train',
    color: '#0D9488',
    bgLight: 'bg-teal-50 border-teal-200',
    textDark: 'text-teal-700',
    emoji: '🚆',
  },
  food: {
    label: 'Food & Dining',
    iconName: 'UtensilsCrossed',
    color: '#E11D48',
    bgLight: 'bg-rose-50 border-rose-200',
    textDark: 'text-rose-700',
    emoji: '🍜',
  },
  activity: {
    label: 'Tours & Activities',
    iconName: 'Compass',
    color: '#2563EB',
    bgLight: 'bg-blue-50 border-blue-200',
    textDark: 'text-blue-700',
    emoji: '⛵',
  },
  other: {
    label: 'Other & Sundries',
    iconName: 'MoreHorizontal',
    color: '#64748B',
    bgLight: 'bg-slate-50 border-slate-200',
    textDark: 'text-slate-700',
    emoji: '📦',
  },
};

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function calculateDaysDifference(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of both days
  return Math.max(1, diffDays);
}

export function computePlanSummary(plan: Plan, items: TimelineItem[]): PlanCostSummary {
  const planItems = items.filter((i) => i.plan_id === plan.id);
  const byType: Record<TimelineItemType, number> = {
    flight: 0,
    hotel: 0,
    spot: 0,
    transport: 0,
    food: 0,
    activity: 0,
    other: 0,
  };

  let totalCost = 0;
  let currency = 'USD';

  for (const item of planItems) {
    const costNum = Number(item.cost) || 0;
    totalCost += costNum;
    if (byType[item.type] !== undefined) {
      byType[item.type] += costNum;
    } else {
      byType.other += costNum;
    }
    if (item.currency) {
      currency = item.currency;
    }
  }

  const daysCount = calculateDaysDifference(plan.start_date, plan.end_date);
  const costPerDay = daysCount > 0 ? Math.round(totalCost / daysCount) : totalCost;

  return {
    planId: plan.id,
    totalCost,
    currency,
    itemCount: planItems.length,
    daysCount,
    costPerDay,
    byType,
  };
}
