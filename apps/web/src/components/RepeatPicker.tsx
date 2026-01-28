'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore, RecurrenceRule } from '@/stores/app.store';
import {
  Repeat,
  ChevronDown,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import clsx from 'clsx';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const PRESETS: { label: string; rule: RecurrenceRule }[] = [
  { label: 'Every day', rule: { frequency: 'daily', interval: 1 } },
  { label: 'Every weekday', rule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] } },
  { label: 'Every week', rule: { frequency: 'weekly', interval: 1 } },
  { label: 'Every 2 weeks', rule: { frequency: 'weekly', interval: 2 } },
  { label: 'Every month', rule: { frequency: 'monthly', interval: 1 } },
  { label: 'Every year', rule: { frequency: 'yearly', interval: 1 } },
];

interface RepeatPickerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule | undefined) => void;
  className?: string;
}

export function RepeatPicker({ value, onChange, className }: RepeatPickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customRule, setCustomRule] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
  });
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

  const formatRule = (rule: RecurrenceRule): string => {
    const { frequency, interval, daysOfWeek } = rule;

    if (frequency === 'daily') {
      return interval === 1 ? 'Every day' : `Every ${interval} days`;
    }

    if (frequency === 'weekly') {
      if (daysOfWeek && daysOfWeek.length > 0 && daysOfWeek.length < 7) {
        if (daysOfWeek.length === 5 &&
            daysOfWeek.includes(1) && daysOfWeek.includes(2) &&
            daysOfWeek.includes(3) && daysOfWeek.includes(4) &&
            daysOfWeek.includes(5)) {
          return 'Every weekday';
        }
        const dayNames = daysOfWeek.map(d => DAY_OPTIONS[d].label).join(', ');
        return interval === 1 ? `Weekly on ${dayNames}` : `Every ${interval} weeks on ${dayNames}`;
      }
      return interval === 1 ? 'Every week' : `Every ${interval} weeks`;
    }

    if (frequency === 'monthly') {
      return interval === 1 ? 'Every month' : `Every ${interval} months`;
    }

    if (frequency === 'yearly') {
      return interval === 1 ? 'Every year' : `Every ${interval} years`;
    }

    return 'Repeating';
  };

  const handlePresetSelect = (rule: RecurrenceRule) => {
    onChange(rule);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  const handleCustomSave = () => {
    onChange(customRule);
    setShowCustom(false);
    setIsOpen(false);
  };

  const toggleDayOfWeek = (day: number) => {
    const current = customRule.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setCustomRule({ ...customRule, daysOfWeek: updated.length > 0 ? updated : undefined });
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
          value
            ? theme === 'dark'
              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
              : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            : theme === 'dark'
              ? 'text-gray-500 hover:text-gray-400 hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
        )}
      >
        <Repeat size={14} />
        {value ? formatRule(value) : 'Repeat'}
        <ChevronDown size={12} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          {showCustom ? (
            // Custom repeat editor
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className={clsx(
                  'text-sm font-medium',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Custom Repeat
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

              {/* Frequency and Interval */}
              <div className="flex items-center gap-2 mb-3">
                <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  Every
                </span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={customRule.interval}
                  onChange={(e) => setCustomRule({ ...customRule, interval: parseInt(e.target.value) || 1 })}
                  className={clsx(
                    'w-14 px-2 py-1 rounded border text-sm text-center',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  )}
                />
                <select
                  value={customRule.frequency}
                  onChange={(e) => setCustomRule({
                    ...customRule,
                    frequency: e.target.value as RecurrenceRule['frequency'],
                    daysOfWeek: e.target.value !== 'weekly' ? undefined : customRule.daysOfWeek
                  })}
                  className={clsx(
                    'flex-1 px-2 py-1 rounded border text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  )}
                >
                  {FREQUENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label.toLowerCase()}{customRule.interval > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Days of week (for weekly) */}
              {customRule.frequency === 'weekly' && (
                <div className="mb-3">
                  <p className={clsx(
                    'text-xs mb-2',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    On these days:
                  </p>
                  <div className="flex gap-1">
                    {DAY_OPTIONS.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={clsx(
                          'w-8 h-8 rounded text-xs font-medium transition-colors',
                          customRule.daysOfWeek?.includes(day.value)
                            ? 'bg-omnifocus-purple text-white'
                            : theme === 'dark'
                              ? 'bg-omnifocus-bg text-gray-400 hover:bg-omnifocus-border'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleCustomSave}
                className="w-full px-3 py-2 rounded-lg bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90"
              >
                Save
              </button>
            </div>
          ) : (
            // Preset options
            <div className="p-2">
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
                  No repeat
                </button>
              )}

              {PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => handlePresetSelect(preset.rule)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-left transition-colors',
                    value && formatRule(value) === preset.label
                      ? theme === 'dark'
                        ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                        : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-surface'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span>{preset.label}</span>
                  {value && formatRule(value) === preset.label && <Check size={14} />}
                </button>
              ))}

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
                Custom...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Inline repeat badge
export function RepeatBadge({ rule }: { rule: RecurrenceRule }) {
  const { theme } = useAppStore();

  const formatShort = (r: RecurrenceRule): string => {
    if (r.frequency === 'daily') return r.interval === 1 ? 'Daily' : `${r.interval}d`;
    if (r.frequency === 'weekly') return r.interval === 1 ? 'Weekly' : `${r.interval}w`;
    if (r.frequency === 'monthly') return r.interval === 1 ? 'Monthly' : `${r.interval}mo`;
    if (r.frequency === 'yearly') return r.interval === 1 ? 'Yearly' : `${r.interval}y`;
    return 'Repeat';
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
      theme === 'dark'
        ? 'bg-purple-500/20 text-purple-400'
        : 'bg-purple-100 text-purple-600'
    )}>
      <Repeat size={10} />
      {formatShort(rule)}
    </span>
  );
}
