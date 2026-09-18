/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TimelineItem, TimelineItemType, UserProfile } from '../types';
import { CATEGORY_METADATA } from '../lib/calculations';
import { X, Calendar, Clock, MapPin, DollarSign, FileText, Sparkles, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  defaultDate?: string;
  itemToEdit?: TimelineItem | null;
  onSave: (item: Omit<TimelineItem, 'id'> & { id?: string }) => void;
  currentUser: UserProfile;
  currency: string;
}

const CATEGORIES: TimelineItemType[] = [
  'flight',
  'hotel',
  'spot',
  'transport',
  'food',
  'activity',
  'other',
];

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  isOpen,
  onClose,
  planId,
  defaultDate,
  itemToEdit,
  onSave,
  currentUser,
  currency,
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState<TimelineItemType>('spot');
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState<string>('0');
  const [itemCurrency, setItemCurrency] = useState(currency || 'USD');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setType(itemToEdit.type);
      setTitle(itemToEdit.title);
      setCost(itemToEdit.cost.toString());
      setItemCurrency(itemToEdit.currency || currency || 'USD');
      setDate(itemToEdit.date);
      setTime(itemToEdit.time || '');
      setLocation(itemToEdit.location || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setType('spot');
      setTitle('');
      setCost('0');
      setItemCurrency(currency || 'USD');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('');
      setLocation('');
      setNotes('');
    }
  }, [itemToEdit, defaultDate, currency, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const costNum = Math.max(0, parseFloat(cost) || 0);

    const payload: Omit<TimelineItem, 'id'> & { id?: string } = {
      ...(itemToEdit ? { id: itemToEdit.id } : {}),
      plan_id: planId,
      type,
      title: title.trim(),
      cost: costNum,
      currency: itemCurrency,
      date,
      time: time.trim(),
      location: location.trim(),
      notes: notes.trim(),
      added_by: currentUser.id,
      added_by_name: currentUser.name,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="add-edit-item-modal"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-base">
              {itemToEdit ? t('modals.addEdit.editTitle') : t('modals.addEdit.addTitle')}
            </h3>
            <p className="text-xs text-slate-500">{t('modals.addEdit.subtitle')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {t('modals.addEdit.categoryType')}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {CATEGORIES.map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const isSelected = type === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setType(cat)}
                    className={`min-h-[44px] p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    <span className="text-lg">{meta.emoji}</span>
                    <span className="text-[10px] font-semibold mt-1 truncate max-w-full">
                      {t(`categories.${cat}`, { defaultValue: meta.label.split('&')[0].trim() })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('modals.addEdit.itemTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modals.addEdit.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
            />
          </div>

          {/* Cost & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('modals.addEdit.cost')} ({itemCurrency}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('modals.addEdit.date')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Time & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('modals.addEdit.time')}
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('modals.addEdit.location')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('modals.addEdit.locationPlaceholder')}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              {t('modals.addEdit.notes')}
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('modals.addEdit.notesPlaceholder')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Stamp Info */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {t('modals.addEdit.attribution')}: <strong className="text-slate-700">{currentUser.name}</strong>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{itemToEdit ? t('modals.addEdit.submitEdit') : t('modals.addEdit.submitAdd')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
