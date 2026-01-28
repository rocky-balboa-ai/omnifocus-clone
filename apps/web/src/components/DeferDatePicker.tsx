'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  PauseCircle,
  ChevronDown,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  nextMonday,
  isBefore,
  isToday,
} from 'date-fns';
import clsx from 'clsx';

const PRESETS = [
  { label: 'Later Today', getValue: () => new Date() }, // Will use current date, UI shows "later"
  { label: 'Tomorrow', getValue: () => addDays(startOfDay(new Date()), 1) },
  { label: 'In 2 Days', getValue: () => addDays(startOfDay(new Date()), 2) },
  { label: 'This Weekend', getValue: () => {
    const today = startOfDay(new Date());
    const dayOfWeek = today.getDay();
    // Saturday is 6, Sunday is 0
    const daysUntilSaturday = dayOfWeek === 0 ? 6 : (6 - dayOfWeek);
    return addDays(today, daysUntilSaturday);
  }},
  { label: 'Next Week', getValue: () => nextMonday(startOfDay(new Date())) },
  { label: 'In 2 Weeks', getValue: () => addWeeks(startOfDay(new Date()), 2) },
  { label: 'Next Month', getValue: () => addMonths(startOfDay(new Date()), 1) },
  { label: 'In 3 Months', getValue: () => addMonths(startOfDay(new Date()), 3) },
];

interface DeferDatePickerProps {
  value?: string; // ISO date string
  onChange: (date: string | undefined) => void;
  className?: string;
}

export function DeferDatePicker({ value, onChange, className }: DeferDatePickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustom(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePresetSelect = (date: Date) => {
    onChange(date.toISOString());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (customDate) {
      const date = new Date(customDate);
      onChange(startOfDay(date).toISOString());
      setCustomDate('');
      setShowCustom(false);
      setIsOpen(false);
    }
  };

  const formatDeferDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = startOfDay(new Date());

    if (isBefore(date, today)) {
      return 'Available';
    }
    if (isToday(date)) {
      return 'Later today';
    }
    return format(date, 'MMM d');
  };

  const isDeferred = value && isBefore(startOfDay(new Date()), new Date(value));

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
          isDeferred
            ? theme === 'dark'
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : value
              ? theme === 'dark'
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
              : theme === 'dark'
                ? 'text-gray-500 hover:text-gray-400 hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
        )}
      >
        <PauseCircle size={14} />
        {value ? formatDeferDate(value) : 'Defer'}
        <ChevronDown size={12} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 w-48 rounded-lg shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          {showCustom ? (
            // Custom date picker
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className={clsx(
                  'text-sm font-medium',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Custom Date
                </h4>
                <button
                  onClick={() => setShowCustom(false)}
                  className={clsx(
                    'p-1 rounded',
                    theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={clsx(
                  'w-full px-3 py-2 rounded-lg border text-sm mb-3',
                  theme === 'dark'
                    ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                )}
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customDate}
                className="w-full px-3 py-2 rounded-lg bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 disabled:opacity-50"
              >
                Set Date
              </button>
            </div>
          ) : (
            // Preset options
            <div className="p-2 max-h-64 overflow-y-auto">
              {/* Clear option */}
              {value && (
                <button
                  onClick={handleClear}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors mb-1',
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-omnifocus-surface'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <X size={14} />
                  Clear defer date
                </button>
              )}

              {PRESETS.map((preset, i) => {
                const presetDate = preset.getValue();
                const isSelected = value && format(new Date(value), 'yyyy-MM-dd') === format(presetDate, 'yyyy-MM-dd');

                return (
                  <button
                    key={i}
                    onClick={() => handlePresetSelect(presetDate)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-left transition-colors',
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                          : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-surface'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span>{preset.label}</span>
                    <span className={clsx(
                      'text-xs',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {format(presetDate, 'MMM d')}
                    </span>
                  </button>
                );
              })}

              {/* Custom option */}
              <button
                onClick={() => setShowCustom(true)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors mt-1 border-t',
                  theme === 'dark'
                    ? 'text-omnifocus-purple hover:bg-omnifocus-surface border-omnifocus-border'
                    : 'text-omnifocus-purple hover:bg-gray-100 border-gray-200'
                )}
              >
                <Calendar size={14} />
                Pick a date...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Defer status badge
export function DeferBadge({ deferDate }: { deferDate: string }) {
  const { theme } = useAppStore();
  const date = new Date(deferDate);
  const today = startOfDay(new Date());

  if (isBefore(date, today) || isToday(date)) {
    return null; // Available now, no badge needed
  }

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
      theme === 'dark'
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-yellow-100 text-yellow-700'
    )}>
      <PauseCircle size={10} />
      {format(date, 'MMM d')}
    </span>
  );
}
