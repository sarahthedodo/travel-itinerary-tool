/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plan } from '../types';
import { X, Calendar, Plus, Sparkles, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlan: (planData: Omit<Plan, 'id' | 'votes' | 'trip_id'>) => void;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export const AddPlanModal: React.FC<AddPlanModalProps> = ({
  isOpen,
  onClose,
  onAddPlan,
  defaultStartDate,
  defaultEndDate,
}) => {
  const { t } = useTranslation();
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(defaultStartDate || '2026-09-12');
  const [endDate, setEndDate] = useState(defaultEndDate || '2026-09-16');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    onAddPlan({
      plan_name: planName.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate,
    });

    setPlanName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="add-plan-modal"
        className="w-full sm:max-w-md bg-[#FAF8F5] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh] font-sans"
      >
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-white/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B7065]/15 text-[#5B7065] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-base tracking-wide">{t('modals.addPlan.title')}</h3>
              <p className="text-xs text-stone-500">{t('modals.addPlan.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.addPlan.planTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={t('modals.addPlan.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                {t('modals.addPlan.startDate')}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                {t('modals.addPlan.endDate')}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.addPlan.description')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('modals.addPlan.descPlaceholder')}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200/70">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-medium text-white bg-[#5B7065] hover:bg-[#4D5F56] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('modals.addPlan.submitBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
