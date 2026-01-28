'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Clock, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

const DURATION_PRESETS = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 90, label: '1.5 hours' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
];

interface DurationPickerProps {
  value?: number; // minutes
  onChange: (minutes: number | undefined) => void;
  className?: string;
}

export function DurationPicker({ value, onChange, className }: DurationPickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handlePresetClick = (minutes: number) => {
    onChange(minutes);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customValue);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed);
      setCustomValue('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
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
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            : theme === 'dark'
              ? 'text-gray-500 hover:text-gray-400 hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
        )}
      >
        <Clock size={14} />
        {value ? formatDuration(value) : 'Duration'}
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
          {/* Presets */}
          <div className="p-2 max-h-48 overflow-y-auto">
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
                Clear duration
              </button>
            )}

            {DURATION_PRESETS.map(preset => (
              <button
                key={preset.minutes}
                onClick={() => handlePresetClick(preset.minutes)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-left transition-colors',
                  value === preset.minutes
                    ? theme === 'dark'
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span>{preset.label}</span>
                {value === preset.minutes && <Check size={14} />}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className={clsx(
            'p-2 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                }}
                placeholder="Custom (min)"
                className={clsx(
                  'flex-1 px-2 py-1 rounded border text-sm outline-none',
                  theme === 'dark'
                    ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500 focus:border-omnifocus-purple'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-omnifocus-purple'
                )}
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customValue || isNaN(parseInt(customValue))}
                className="px-2 py-1 rounded bg-omnifocus-purple text-white text-xs hover:bg-omnifocus-purple/90 disabled:opacity-50"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline duration display
export function DurationBadge({ minutes }: { minutes: number }) {
  const { theme } = useAppStore();

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${hours}h`;
    return `${hours}h ${m}m`;
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
      theme === 'dark'
        ? 'bg-blue-500/20 text-blue-400'
        : 'bg-blue-100 text-blue-600'
    )}>
      <Clock size={10} />
      {formatDuration(minutes)}
    </span>
  );
}
