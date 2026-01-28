'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Circle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';

export type ActionStatus = 'active' | 'completed' | 'on_hold' | 'dropped';

const STATUS_OPTIONS: {
  value: ActionStatus;
  label: string;
  icon: typeof Circle;
  color: string;
  description: string;
}[] = [
  {
    value: 'active',
    label: 'Active',
    icon: Circle,
    color: 'text-blue-500',
    description: 'Available to work on',
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-500',
    description: 'Finished',
  },
  {
    value: 'on_hold',
    label: 'On Hold',
    icon: PauseCircle,
    color: 'text-yellow-500',
    description: 'Temporarily paused',
  },
  {
    value: 'dropped',
    label: 'Dropped',
    icon: XCircle,
    color: 'text-gray-400',
    description: 'No longer needed',
  },
];

interface StatusPickerProps {
  value: ActionStatus;
  onChange: (status: ActionStatus) => void;
  className?: string;
  compact?: boolean;
}

export function StatusPicker({ value, onChange, className, compact = false }: StatusPickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];
  const Icon = currentStatus.icon;

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

  const handleSelect = (status: ActionStatus) => {
    onChange(status);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
          theme === 'dark'
            ? 'hover:bg-omnifocus-surface'
            : 'hover:bg-gray-100'
        )}
      >
        <Icon size={16} className={currentStatus.color} />
        {!compact && (
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
            {currentStatus.label}
          </span>
        )}
        <ChevronDown size={12} className={clsx(
          isOpen && 'rotate-180',
          'transition-transform',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )} />
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
          <div className="p-1">
            {STATUS_OPTIONS.map(option => {
              const StatusIcon = option.icon;
              const isSelected = value === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-omnifocus-surface'
                        : 'bg-gray-100'
                      : theme === 'dark'
                        ? 'hover:bg-omnifocus-surface'
                        : 'hover:bg-gray-50'
                  )}
                >
                  <StatusIcon size={18} className={clsx(option.color, 'shrink-0 mt-0.5')} />
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'text-sm font-medium',
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                      {option.label}
                    </p>
                    <p className={clsx(
                      'text-xs',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Status badge for display
export function ActionStatusBadge({ status, size = 'sm' }: { status: ActionStatus; size?: 'sm' | 'md' }) {
  const statusData = STATUS_OPTIONS.find(s => s.value === status);
  if (!statusData) return null;

  const Icon = statusData.icon;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1',
      statusData.color,
      size === 'sm' ? 'text-xs' : 'text-sm'
    )}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {statusData.label}
    </span>
  );
}

// Circular status indicator
export function StatusDot({ status }: { status: ActionStatus }) {
  const statusData = STATUS_OPTIONS.find(s => s.value === status);
  if (!statusData) return null;

  return (
    <span className={clsx(
      'inline-block w-2 h-2 rounded-full',
      statusData.color.replace('text-', 'bg-')
    )} />
  );
}
