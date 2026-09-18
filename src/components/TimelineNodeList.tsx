/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plan, TimelineItem, TimelineItemType } from '../types';
import { 
  formatCurrency, 
  CATEGORY_METADATA, 
  computePlanSummary 
} from '../lib/calculations';
import { 
  Plus, 
  Clock, 
  MapPin, 
  Edit3, 
  Trash2, 
  Calendar, 
  FileText, 
  UserCheck, 
  Sparkles,
  DollarSign,
  Maximize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ItemDetailModal } from './ItemDetailModal';

interface TimelineNodeListProps {
  plans: Plan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  timelineItems: TimelineItem[];
  onOpenAddItem: (planId: string, defaultDate?: string) => void;
  onOpenEditItem: (item: TimelineItem) => void;
  onDeleteItem: (itemId: string) => void;
  currency: string;
  onOpenAddPlan?: () => void;
}

export const TimelineNodeList: React.FC<TimelineNodeListProps> = ({
  plans,
  activePlanId,
  onSelectPlan,
  timelineItems,
  onOpenAddItem,
  onOpenEditItem,
  onDeleteItem,
  currency,
  onOpenAddPlan,
}) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<TimelineItemType | 'all'>('all');
  const [detailItem, setDetailItem] = useState<TimelineItem | null>(null);

  const activePlan = plans.find((p) => p.id === activePlanId) || plans[0];
  if (!activePlan) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs my-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Calendar className="w-7 h-7" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-base sm:text-lg">
            {t('timeline.noActivePlanTitle')}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {t('timeline.noActivePlanDesc')}
          </p>
        </div>
        {onOpenAddPlan && (
          <div className="pt-2">
            <button
              id="timeline-empty-add-plan-btn"
              onClick={onOpenAddPlan}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('comparer.addPlanBtn')}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Filter items for the active plan
  const planItems = timelineItems
    .filter((i) => i.plan_id === activePlan.id)
    .filter((i) => selectedCategory === 'all' || i.type === selectedCategory);

  // Compute plan summary
  const summary = computePlanSummary(activePlan, timelineItems);

  // Group items by date
  const groupedByDate: Record<string, TimelineItem[]> = {};
  planItems.forEach((item) => {
    const d = item.date || 'Unscheduled';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(item);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 w-full overflow-x-hidden">
      {/* Plan Selector Header Tabs */}
      <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-6 border border-stone-200/80 shadow-wabi space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Scrollable Plan Tabs on Mobile */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {plans.map((p, idx) => {
              const isActive = p.id === activePlan.id;
              const pSummary = computePlanSummary(p, timelineItems);
              return (
                <button
                  key={p.id}
                  id={`select-plan-tab-${p.id}`}
                  onClick={() => onSelectPlan(p.id)}
                  className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#5B7065] text-white shadow-xs font-semibold'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  <span>{String.fromCharCode(65 + idx)}. {p.plan_name.split(':')[0]}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                    isActive ? 'bg-[#4D5F56] text-stone-100' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {formatCurrency(pSummary.totalCost, currency)}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            id="add-item-primary-btn"
            onClick={() => onOpenAddItem(activePlan.id, activePlan.start_date)}
            className="min-h-[42px] w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs sm:text-sm font-medium shadow-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('timeline.addNode')}</span>
          </button>
        </div>

        {/* Plan Snapshot Sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200/60 text-xs text-stone-600">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="font-semibold text-stone-800 text-xs sm:text-sm truncate">
              {activePlan.plan_name}
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center space-x-1 text-stone-500 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{activePlan.start_date} ~ {activePlan.end_date}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-[#5B7065] shrink-0" />
              <span>{t('common.total')}: <strong className="text-stone-800 font-semibold">{formatCurrency(summary.totalCost, currency)}</strong></span>
            </span>
            <span className="text-stone-300">•</span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{summary.daysCount} {t('common.days')} ({formatCurrency(summary.costPerDay, currency)}{t('common.perDay')})</span>
            </span>
          </div>
        </div>

        {/* Category Filters (Mobile Touch Pill Bar) */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-stone-800 text-white font-semibold'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/70'
            }`}
          >
            {t('timeline.allItems')} ({timelineItems.filter((i) => i.plan_id === activePlan.id).length})
          </button>

          {(['flight', 'hotel', 'spot', 'transport', 'food', 'activity'] as const).map((cat) => {
            const meta = CATEGORY_METADATA[cat];
            const count = timelineItems.filter((i) => i.plan_id === activePlan.id && i.type === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-stone-800 text-white font-semibold shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/70'
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{t(`categories.${cat}`, { defaultValue: meta.label.split('&')[0].trim() })}</span>
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Day Groupings */}
      {sortedDates.length === 0 ? (
        <div className="bg-white/90 rounded-2xl border-2 border-dashed border-stone-300 p-8 sm:p-12 text-center space-y-4 shadow-wabi">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-[#5B7065] flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-800 text-base">{t('timeline.noItemsTitle')}</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {t('timeline.noItemsDesc')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onOpenAddItem(activePlan.id, activePlan.start_date)}
              className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('timeline.addFirstItem')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr, dayIdx) => {
            const dayItems = groupedByDate[dateStr] || [];
            const dayCost = dayItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

            // Format friendly day date
            let formattedDate = dateStr;
            try {
              const dObj = new Date(dateStr);
              formattedDate = dObj.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
            } catch (e) {
              console.log(e);
            }

            return (
              <div key={dateStr} className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-full bg-stone-200/80 text-stone-800 text-xs font-semibold flex items-center justify-center">
                      D{dayIdx + 1}
                    </span>
                    <h3 className="font-semibold text-stone-800 text-xs sm:text-sm tracking-wide">
                      {formattedDate}
                    </h3>
                    <span className="text-xs text-stone-400">
                      ({dayItems.length} {t('common.items')})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-stone-700 bg-stone-100/90 border border-stone-200/60 px-2.5 py-1 rounded-md">
                      {t('common.subtotal')}: {formatCurrency(dayCost, currency)}
                    </span>
                    <button
                      onClick={() => onOpenAddItem(activePlan.id, dateStr)}
                      className="min-h-[36px] px-2 text-[#5B7065] hover:bg-[#5B7065]/10 rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                      title={t('common.add')}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('common.add')}</span>
                    </button>
                  </div>
                </div>

                {/* Day Cards List */}
                <div className="space-y-2.5">
                  {dayItems.map((item) => {
                    const meta = CATEGORY_METADATA[item.type] || CATEGORY_METADATA.other;

                    return (
                      <div
                        key={item.id}
                        id={`timeline-item-${item.id}`}
                        onClick={() => setDetailItem(item)}
                        className="group bg-white rounded-xl p-3.5 sm:p-4 border border-stone-200/80 shadow-wabi hover:shadow-wabi-hover hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3 min-w-0">
                          {/* Category Badge Icon */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${meta.bgLight}`}
                          >
                            <span>{meta.emoji}</span>
                          </div>

                          {/* Node info */}
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide border ${meta.bgLight} ${meta.textDark}`}
                              >
                                {t(`categories.${item.type}`, { defaultValue: meta.label.split('&')[0].trim() })}
                              </span>

                              {item.time && (
                                <span className="inline-flex items-center text-xs text-stone-500 font-normal">
                                  <Clock className="w-3 h-3 mr-1 text-stone-400" />
                                  {item.time}
                                </span>
                              )}

                              {item.location && (
                                <span className="inline-flex items-center text-xs text-stone-500 truncate max-w-[160px] sm:max-w-xs">
                                  <MapPin className="w-3 h-3 mr-1 text-stone-400 shrink-0" />
                                  <span className="truncate">{item.location}</span>
                                </span>
                              )}
                            </div>

                            <h4 className="font-semibold text-stone-800 text-sm leading-snug">
                              {item.title}
                            </h4>

                            {item.notes && (
                              <p className="text-xs text-stone-500 flex items-start space-x-1 pt-0.5">
                                <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{item.notes}</span>
                              </p>
                            )}

                            {/* Collaboration Stamp */}
                            <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-stone-400">
                              <UserCheck className="w-3 h-3 text-[#5B7065] shrink-0" />
                              <span>{t('timeline.addedBy')}</span>
                              <span className="font-medium text-stone-600">
                                {item.added_by_name || 'Team member'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cost & Actions */}
                        <div 
                          className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100 gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-left sm:text-right">
                            <div className="text-base font-semibold text-stone-800">
                              {formatCurrency(Number(item.cost) || 0, item.currency || currency)}
                            </div>
                            <span className="text-[10px] text-stone-400 block uppercase font-medium tracking-wider">
                              {t('comparer.estimatedBudget')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 sm:mt-1">
                            <button
                              onClick={() => setDetailItem(item)}
                              className="min-h-[42px] min-w-[42px] p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center sm:hidden"
                              title={t('timeline.tapToEnlarge')}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`edit-item-btn-${item.id}`}
                              onClick={() => onOpenEditItem(item)}
                              className="min-h-[42px] min-w-[42px] p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                              title={t('common.edit')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-item-btn-${item.id}`}
                              onClick={() => {
                                if (confirm(`Remove "${item.title}"?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="min-h-[42px] min-w-[42px] p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail Lightbox Modal */}
      <ItemDetailModal
        item={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        onEdit={(it) => {
          setDetailItem(null);
          onOpenEditItem(it);
        }}
        onDelete={(id) => {
          setDetailItem(null);
          onDeleteItem(id);
        }}
        currency={currency}
      />
    </div>
  );
};
