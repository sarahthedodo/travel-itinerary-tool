/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TimelineItem } from '../types';
import { CATEGORY_METADATA, formatCurrency } from '../lib/calculations';
import { 
  X, 
  Clock, 
  MapPin, 
  FileText, 
  UserCheck, 
  Calendar, 
  Edit3, 
  Trash2,
  DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ItemDetailModalProps {
  item: TimelineItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: TimelineItem) => void;
  onDelete: (itemId: string) => void;
  currency: string;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  currency,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !item) return null;

  const meta = CATEGORY_METADATA[item.type] || CATEGORY_METADATA.other;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="item-detail-modal"
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-250"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${meta.bgLight}`}>
              <span>{meta.emoji}</span>
            </div>
            <div className="min-w-0">
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${meta.bgLight} ${meta.textDark}`}>
                {t(`categories.${item.type}`, { defaultValue: meta.label })}
              </span>
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate mt-0.5">
                {t('timeline.detailModalTitle')}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Main Title & Cost Hero */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {item.title}
            </h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(Number(item.cost) || 0, item.currency || currency)}
              </span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {t('comparer.estimatedBudget')}
              </span>
            </div>
          </div>

          {/* Date, Time, Location Grid */}
          <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-slate-900">{t('modals.addEdit.date')}:</span>
              <span>{item.date}</span>
            </div>

            {item.time && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-900">{t('modals.addEdit.time')}:</span>
                <span>{item.time}</span>
              </div>
            )}

            {item.location && (
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">{t('modals.addEdit.location')}: </span>
                  <span className="break-words">{item.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('modals.addEdit.notes')}</span>
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                {item.notes}
              </div>
            </div>
          )}

          {/* Attribution Stamp */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('timeline.addedBy')}</span>
            </span>
            <span className="font-semibold text-emerald-950">
              {item.added_by_name || 'Team member'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50 shrink-0 gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${item.title}"?`)) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('common.delete')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{t('common.edit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
