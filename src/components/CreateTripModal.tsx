/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Globe, DollarSign, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (data: { title: string; destination: string; currency: string }) => void;
}

const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan (CNY)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar (HKD)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD)' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won (KRW)' },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [currency, setCurrency] = useState('USD');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTrip({
      title: title.trim(),
      destination: destination.trim(),
      currency,
    });
    setTitle('');
    setDestination('');
    setCurrency('USD');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="create-trip-modal"
        className="w-full sm:max-w-md bg-[#FAF8F5] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[90vh] font-sans"
      >
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/70 bg-white/80 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B7065]/15 text-[#5B7065] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800 text-base tracking-wide">{t('modals.createTrip.title')}</h3>
              <p className="text-xs text-stone-500">{t('modals.createTrip.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.createTrip.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modals.createTrip.namePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.createTrip.destination')}
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t('modals.createTrip.destPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              {t('modals.createTrip.currency')}
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 pointer-events-none" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200/90 bg-white text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#5B7065]/30 focus:border-[#5B7065] text-sm min-h-[44px]"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
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
              <PlusCircle className="w-4 h-4" />
              <span>{t('modals.createTrip.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
