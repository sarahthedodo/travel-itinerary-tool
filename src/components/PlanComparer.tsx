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
      {/* Top Banner with Key Highlights - Japanese Minimalist Wabi-Sabi */}
      <div className="bg-[#FAF8F5] border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-wabi relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#5B7065]/10 border border-[#5B7065]/20 text-[#5B7065] text-xs font-medium tracking-wide">
              <Layers className="w-3.5 h-3.5" />
              <span>{t('comparer.decisionMatrix')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-800 leading-snug">
              {t('comparer.title')}
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {t('comparer.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="add-new-plan-top-btn"
              onClick={onOpenAddPlan}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs sm:text-sm font-medium shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{t('comparer.addPlanBtn')}</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-6 pt-5 border-t border-stone-200/60 text-xs">
          <div className="bg-white/80 rounded-xl p-3.5 border border-stone-200/70 shadow-2xs">
            <span className="text-stone-500 block">{t('comparer.candidatePlans')}</span>
            <span className="text-base sm:text-lg font-semibold text-stone-800 mt-0.5 block">
              {plans.length} {t('common.items')}
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-3.5 border border-stone-200/70 shadow-2xs">
            <span className="text-stone-500 block">{t('comparer.lowestTotal')}</span>
            <span className="text-base sm:text-lg font-semibold text-[#5B7065] mt-0.5 block truncate">
              {minCost !== Infinity ? formatCurrency(minCost, currency) : '--'}
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-3.5 border border-stone-200/70 shadow-2xs">
            <span className="text-stone-500 block">{t('comparer.totalNodes')}</span>
            <span className="text-base sm:text-lg font-semibold text-[#8C7A6B] mt-0.5 block">
              {timelineItems.length} {t('common.nodes')}
            </span>
          </div>
          <div className="bg-white/80 rounded-xl p-3.5 border border-stone-200/70 shadow-2xs">
            <span className="text-stone-500 block">{t('comparer.leadingPlan')}</span>
            <span className="text-base sm:text-lg font-semibold text-stone-700 truncate block mt-0.5">
              {plans.find(p => p.id === topVotedPlanId)?.plan_name.split(':')[0] || t('comparer.tied')}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Plan Selector (Quick Segment Switcher) */}
      <div className="lg:hidden space-y-2">
        <span className="text-xs font-medium text-stone-500 tracking-wide block px-1">
          {t('comparer.mobilePlanSelector')}
        </span>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setMobileActivePlanId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap min-h-[44px] transition-all cursor-pointer ${
              mobileActivePlanId === 'all'
                ? 'bg-stone-800 text-white shadow-xs font-semibold'
                : 'bg-white text-stone-700 border border-stone-200'
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
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap min-h-[44px] transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#5B7065] text-white shadow-xs font-semibold'
                    : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                <span>{String.fromCharCode(65 + idx)}. {p.plan_name.split(':')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards Grid: Desktop Multi-column, Mobile Adaptive */}
      {plans.length === 0 ? (
        <div className="bg-white/90 rounded-2xl border-2 border-dashed border-stone-300 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-wabi">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-[#5B7065] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-semibold text-stone-800 text-base sm:text-lg">
              {t('comparer.emptyPlansTitle')}
            </h4>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {t('comparer.emptyPlansDesc')}
            </p>
          </div>
          <div className="pt-2">
            <button
              id="empty-state-add-plan-btn"
              onClick={onOpenAddPlan}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('comparer.addPlanBtn')}</span>
            </button>
          </div>
        </div>
      ) : (
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
              className={`flex flex-col bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-wabi hover:shadow-wabi-hover ${
                isTopVoted 
                  ? 'border-[#8C7A6B]/80 ring-1 ring-[#8C7A6B]/30' 
                  : isLowestCost
                  ? 'border-[#5B7065]/80 ring-1 ring-[#5B7065]/30'
                  : 'border-stone-200/80'
              }`}
            >
              {/* Header Bar with Tags */}
              <div className="p-5 sm:p-6 border-b border-stone-100 bg-[#FAF8F5]/70">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-200/70 text-stone-800">
                    {t('comparer.option')} {String.fromCharCode(65 + index)}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {isLowestCost && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F6F3] text-[#45574D] border border-[#DCE5DF]">
                        <Coins className="w-3 h-3" />
                        <span>{t('comparer.bestBudget')}</span>
                      </span>
                    )}
                    {isTopVoted && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF6EC] text-[#6B5744] border border-[#EDE4D0]">
                        <Flame className="w-3 h-3 text-[#8C7A6B]" />
                        <span>{t('comparer.teamFavorite')}</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-stone-800 text-base sm:text-lg leading-snug">
                  {plan.plan_name}
                </h3>
                {plan.description && (
                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Dates & Duration */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs text-stone-600 font-normal">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{plan.start_date} ~ {plan.end_date}</span>
                  </div>
                  <span className="text-stone-300 hidden sm:inline">•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{summary.daysCount} {t('common.days')}</span>
                  </div>
                </div>
              </div>

              {/* Cost Metrics Block */}
              <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 flex-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400 block">
                      {t('comparer.estimatedBudget')}
                    </span>
                    <div className="text-2xl sm:text-3xl font-semibold text-stone-800 tracking-tight mt-0.5">
                      {formatCurrency(summary.totalCost, currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400 block">
                      {t('comparer.dailyVelocity')}
                    </span>
                    <div className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
                      {formatCurrency(summary.costPerDay, currency)} {t('common.perDay')}
                    </div>
                  </div>
                </div>

                {/* Stacked Cost Category Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{t('comparer.categoryBreakdown')}</span>
                    <span>{summary.itemCount} {t('common.nodes')}</span>
                  </div>
                  <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-2xs">
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
                          className="h-full transition-all duration-300 hover:opacity-85"
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Key Categories Sub-Totals */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F0F4F8] border border-[#D6DFE6]">
                    <span className="flex items-center space-x-1.5 text-[#2F4050] font-medium">
                      <span>✈️</span>
                      <span>{t('comparer.flights')}</span>
                    </span>
                    <span className="font-semibold text-[#2F4050]">
                      {formatCurrency(summary.byType.flight || 0, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F9F6F0] border border-[#E8DFC8]">
                    <span className="flex items-center space-x-1.5 text-[#6B5744] font-medium">
                      <span>🏨</span>
                      <span>{t('comparer.hotels')}</span>
                    </span>
                    <span className="font-semibold text-[#6B5744]">
                      {formatCurrency(summary.byType.hotel || 0, currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#F2F6F3] border border-[#DCE5DF]">
                    <span className="flex items-center space-x-1.5 text-[#45574D] font-medium">
                      <span>🎟️</span>
                      <span>{t('comparer.attractions')}</span>
                    </span>
                    <span className="font-semibold text-[#45574D]">
                      {formatCurrency((summary.byType.spot || 0) + (summary.byType.activity || 0), currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#FAF2F0] border border-[#EED9D6]">
                    <span className="flex items-center space-x-1.5 text-[#823F38] font-medium">
                      <span>🍜</span>
                      <span>{t('comparer.diningTransit')}</span>
                    </span>
                    <span className="font-semibold text-[#823F38]">
                      {formatCurrency((summary.byType.food || 0) + (summary.byType.transport || 0), currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Voting */}
              <div className="p-4 bg-[#FAF8F5]/80 border-t border-stone-100 flex items-center justify-between gap-2.5">
                {/* Vote Button */}
                <button
                  id={`vote-btn-${plan.id}`}
                  onClick={(e) => handleVoteWithConfetti(e, plan.id)}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                    hasVoted
                      ? 'bg-[#8C7A6B] text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
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
                      className="min-h-[42px] min-w-[42px] p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    id={`view-timeline-btn-${plan.id}`}
                    onClick={() => onSelectPlanForEdit(plan.id)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#5B7065] hover:bg-[#4D5F56] text-white text-xs font-medium shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
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
          className="border-2 border-dashed border-stone-300 hover:border-[#5B7065] bg-[#FAF8F5]/60 hover:bg-[#F2F6F3]/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] sm:min-h-[320px] group shadow-2xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-[#5B7065] text-stone-400 group-hover:text-white shadow-2xs border border-stone-200 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h4 className="font-semibold text-stone-800 group-hover:text-[#5B7065] transition-colors text-sm sm:text-base">
            {t('comparer.draftTitle')}
          </h4>
          <p className="text-xs text-stone-500 max-w-xs mt-1 leading-relaxed">
            {t('comparer.draftDesc')}
          </p>
          <span className="mt-4 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-600 group-hover:border-[#5B7065]/50 group-hover:text-[#5B7065] shadow-2xs min-h-[38px] inline-flex items-center">
            {t('comparer.newBranch')}
          </span>
        </div>
      </div>
      )}
    </div>
  );
};
