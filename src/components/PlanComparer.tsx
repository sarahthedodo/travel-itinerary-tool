/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plan, TimelineItem, PlanCostSummary } from '../types';
import { 
  computePlanSummary, 
  formatCurrency, 
  CATEGORY_METADATA 
} from '../lib/calculations';
import { 
  Calendar, 
  ThumbsUp, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Flame, 
  Coins, 
  Layers,
  Trash2,
  Clock,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

interface PlanComparerProps {
  plans: Plan[];
  timelineItems: TimelineItem[];
  userVotes: Record<string, boolean>;
  onToggleVote: (planId: string) => void;
  onSelectPlanForEdit: (planId: string) => void;
  onOpenAddPlan: () => void;
  onDeletePlan: (planId: string) => void;
  currency: string;
}

export const PlanComparer: React.FC<PlanComparerProps> = ({
  plans,
  timelineItems,
  userVotes,
  onToggleVote,
  onSelectPlanForEdit,
  onOpenAddPlan,
  onDeletePlan,
  currency,
}) => {
  const { t } = useTranslation();
  // Mobile active plan filter (or 'all')
  const [mobileActivePlanId, setMobileActivePlanId] = useState<string>(plans[0]?.id || '');

  // Compute summaries for each plan
  const planSummaries: Record<string, PlanCostSummary> = {};
  plans.forEach((p) => {
    planSummaries[p.id] = computePlanSummary(p, timelineItems);
  });

  // Determine lowest cost plan
  let lowestCostPlanId = '';
  let minCost = Infinity;
  plans.forEach((p) => {
    const summary = planSummaries[p.id];
    if (summary && summary.totalCost > 0 && summary.totalCost < minCost) {
      minCost = summary.totalCost;
      lowestCostPlanId = p.id;
    }
  });

  // Determine most voted plan
  let topVotedPlanId = '';
  let maxVotes = -1;
  plans.forEach((p) => {
    if (p.votes > maxVotes && p.votes > 0) {
      maxVotes = p.votes;
      topVotedPlanId = p.id;
    }
  });

  const handleVoteWithConfetti = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    const willVote = !userVotes[planId];
    if (willVote) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        console.log(err);
      }
    }
    onToggleVote(planId);
  };

  // Filter plans displayed on mobile if user chooses a specific plan
  const displayedPlans = plans;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full overflow-x-hidden">
      {/* Top Banner with Key Highlights */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('comparer.decisionMatrix')}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {t('comparer.title')}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t('comparer.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="add-new-plan-top-btn"
              onClick={onOpenAddPlan}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{t('comparer.addPlanBtn')}</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block">{t('comparer.candidatePlans')}</span>
            <span className="text-base sm:text-xl font-bold text-white mt-0.5 block">
              {plans.length} {t('common.items')}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block">{t('comparer.lowestTotal')}</span>
            <span className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5 block truncate">
              {minCost !== Infinity ? formatCurrency(minCost, currency) : '--'}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block">{t('comparer.totalNodes')}</span>
            <span className="text-base sm:text-xl font-bold text-sky-400 mt-0.5 block">
              {timelineItems.length} {t('common.nodes')}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 block">{t('comparer.leadingPlan')}</span>
            <span className="text-base sm:text-xl font-bold text-amber-300 truncate block mt-0.5">
              {plans.find(p => p.id === topVotedPlanId)?.plan_name.split(':')[0] || t('comparer.tied')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Plan Selector (Quick Segment Switcher) */}
      <div className="lg:hidden space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block px-1">
          {t('comparer.mobilePlanSelector')}
        </span>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setMobileActivePlanId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition-all cursor-pointer ${
              mobileActivePlanId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {t('timeline.allItems')} ({plans.length})
          </button>
          {plans.map((p, idx) => {
            const isSelected = mobileActivePlanId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setMobileActivePlanId(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap min-h-[44px] transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span>{String.fromCharCode(65 + idx)}. {p.plan_name.split(':')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards Grid: Desktop Multi-column, Mobile Adaptive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {displayedPlans
          .filter((plan) => mobileActivePlanId === 'all' || mobileActivePlanId === '' || plan.id === mobileActivePlanId || window.innerWidth >= 1024)
          .map((plan, index) => {
          const summary = planSummaries[plan.id] || {
            totalCost: 0,
            currency: currency,
            itemCount: 0,
            daysCount: 1,
            costPerDay: 0,
            byType: { flight: 0, hotel: 0, spot: 0, transport: 0, food: 0, activity: 0, other: 0 }
          };

          const isLowestCost = plan.id === lowestCostPlanId;
          const isTopVoted = plan.id === topVotedPlanId && maxVotes > 0;
          const hasVoted = Boolean(userVotes[plan.id]);
          const totalCostSafe = summary.totalCost || 1;

          return (
            <div
              key={plan.id}
              id={`plan-card-${plan.id}`}
              className={`flex flex-col bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                isTopVoted 
                  ? 'border-amber-400 ring-2 ring-amber-400/20' 
                  : isLowestCost
                  ? 'border-emerald-400'
                  : 'border-slate-200'
              }`}
            >
              {/* Header Bar with Tags */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 text-slate-800">
                    {t('comparer.option')} {String.fromCharCode(65 + index)}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {isLowestCost && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Coins className="w-3 h-3" />
                        <span>{t('comparer.bestBudget')}</span>
                      </span>
                    )}
                    {isTopVoted && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Flame className="w-3 h-3 text-amber-600" />
                        <span>{t('comparer.teamFavorite')}</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
                  {plan.plan_name}
                </h3>
                {plan.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Dates & Duration */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs text-slate-600 font-medium">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plan.start_date} ~ {plan.end_date}</span>
                  </div>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{summary.daysCount} {t('common.days')}</span>
                  </div>
                </div>
              </div>

              {/* Cost Metrics Block */}
              <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 flex-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                      {t('comparer.estimatedBudget')}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                      {formatCurrency(summary.totalCost, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block">
                      {t('comparer.dailyVelocity')}
                    </span>
                    <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                      {formatCurrency(summary.costPerDay, currency)} {t('common.perDay')}
                    </div>
                  </div>
                </div>

                {/* Stacked Cost Category Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{t('comparer.categoryBreakdown')}</span>
                    <span>{summary.itemCount} {t('common.nodes')}</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    {(['flight', 'hotel', 'spot', 'food', 'transport', 'activity', 'other'] as const).map((type) => {
                      const cost = summary.byType[type] || 0;
                      if (cost <= 0) return null;
                      const pct = (cost / totalCostSafe) * 100;
                      return (
                        <div
                          key={type}
                          title={`${t(`categories.${type}`, { defaultValue: CATEGORY_METADATA[type].label })}: ${formatCurrency(cost, currency)} (${Math.round(pct)}%)`}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CATEGORY_METADATA[type].color,
                          }}
                          className="h-full transition-all duration-300 hover:opacity-80"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Key Categories Sub-Totals */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-sky-50/70 border border-sky-100">
                    <span className="flex items-center space-x-1.5 text-sky-800 font-medium">
                      <span>✈️</span>
                      <span>{t('comparer.flights')}</span>
                    </span>
                    <span className="font-bold text-sky-900">
                      {formatCurrency(summary.byType.flight || 0, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                    <span className="flex items-center space-x-1.5 text-amber-800 font-medium">
                      <span>🏨</span>
                      <span>{t('comparer.hotels')}</span>
                    </span>
                    <span className="font-bold text-amber-900">
                      {formatCurrency(summary.byType.hotel || 0, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                    <span className="flex items-center space-x-1.5 text-purple-800 font-medium">
                      <span>🎟️</span>
                      <span>{t('comparer.attractions')}</span>
                    </span>
                    <span className="font-bold text-purple-900">
                      {formatCurrency((summary.byType.spot || 0) + (summary.byType.activity || 0), currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <span className="flex items-center space-x-1.5 text-rose-800 font-medium">
                      <span>🍜</span>
                      <span>{t('comparer.diningTransit')}</span>
                    </span>
                    <span className="font-bold text-rose-900">
                      {formatCurrency((summary.byType.food || 0) + (summary.byType.transport || 0), currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Voting */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2.5">
                {/* Vote Button */}
                <button
                  id={`vote-btn-${plan.id}`}
                  onClick={(e) => handleVoteWithConfetti(e, plan.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    hasVoted
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={hasVoted ? t('common.voted') : t('common.vote')}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                  <span>{plan.votes} {t('common.votes')}</span>
                  {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                {/* Edit Timeline & Delete */}
                <div className="flex items-center space-x-1.5">
                  {plans.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(t('comparer.deleteConfirm'))) {
                          onDeletePlan(plan.id);
                        }
                      }}
                      className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    id={`view-timeline-btn-${plan.id}`}
                    onClick={() => onSelectPlanForEdit(plan.id)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>{t('comparer.viewTimeline')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Plan Card */}
        <div 
          onClick={onOpenAddPlan}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] sm:min-h-[320px] group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-blue-600 text-slate-400 group-hover:text-white shadow-xs border border-slate-200 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
            {t('comparer.draftTitle')}
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
            {t('comparer.draftDesc')}
          </p>
          <span className="mt-4 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 group-hover:border-blue-300 group-hover:text-blue-600 shadow-2xs min-h-[38px] inline-flex items-center">
            {t('comparer.newBranch')}
          </span>
        </div>
      </div>
    </div>
  );
};
