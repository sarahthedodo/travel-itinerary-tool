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
    color: '#3A4D5F', // 蓝染 Aizome Indigo
    bgLight: 'bg-[#F0F4F8] border-[#D6DFE6]',
    textDark: 'text-[#2F4050]',
    emoji: '✈️',
  },
  hotel: {
    label: 'Hotel & Stay',
    iconName: 'Building2',
    color: '#8C7A6B', // 桧木 Hinoki / Warm Linen
    bgLight: 'bg-[#F9F6F0] border-[#E8DFC8]',
    textDark: 'text-[#6B5744]',
    emoji: '🏨',
  },
  spot: {
    label: 'Sightseeing & Tickets',
    iconName: 'Ticket',
    color: '#5B7065', // 苔色 Koke / Moss Green
    bgLight: 'bg-[#F2F6F3] border-[#DCE5DF]',
    textDark: 'text-[#45574D]',
    emoji: '🎟️',
  },
  transport: {
    label: 'Local Transit',
    iconName: 'Train',
    color: '#606F7B', // 灰青 River Stone Slate
    bgLight: 'bg-[#F4F5F7] border-[#DFE3E6]',
    textDark: 'text-[#414D56]',
    emoji: '🚆',
  },
  food: {
    label: 'Food & Dining',
    iconName: 'UtensilsCrossed',
    color: '#A85A52', // 茜色 Akane / Muted Persimmon
    bgLight: 'bg-[#FAF2F0] border-[#EED9D6]',
    textDark: 'text-[#823F38]',
    emoji: '🍜',
  },
  activity: {
    label: 'Tours & Activities',
    iconName: 'Compass',
    color: '#6B607A', // 藤色 Fuji / Muted Iris
    bgLight: 'bg-[#F5F2F7] border-[#DDD5E3]',
    textDark: 'text-[#524860]',
    emoji: '⛵',
  },
  other: {
    label: 'Other & Sundries',
    iconName: 'MoreHorizontal',
    color: '#78716C', // 浅麻 Warm Sand
    bgLight: 'bg-[#F7F6F3] border-[#E7E5E4]',
    textDark: 'text-[#57534E]',
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
