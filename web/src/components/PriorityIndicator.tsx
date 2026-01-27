'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  AlertCircle,
  ArrowUp,
  Minus,
  ArrowDown,
  ChevronDown,
  Check
} from 'lucide-react';
import clsx from 'clsx';

export type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

const PRIORITIES: { value: Priority; label: string; icon: typeof AlertCircle; color: string; bgColor: string }[] = [
  { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/20' },
  { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  { value: 'medium', label: 'Medium', icon: Minus, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-blue-400', bgColor: 'bg-blue-400/20' },
  { value: 'none', label: 'None', icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-400/20' },
];

interface PrioritySelectorProps {
  value?: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
  compact?: boolean;
}

export function PrioritySelector({ value = 'none', onChange, className, compact = false }: PrioritySelectorProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPriority = PRIORITIES.find(p => p.value === value) || PRIORITIES[4];
  const Icon = currentPriority.icon;

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

  const handleSelect = (priority: Priority) => {
    onChange(priority);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
          value !== 'none'
            ? `${currentPriority.bgColor} ${currentPriority.color}`
            : theme === 'dark'
              ? 'text-gray-500 hover:text-gray-400 hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
        )}
      >
        <Icon size={14} />
        {!compact && <span>{currentPriority.label}</span>}
        <ChevronDown size={12} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 w-36 rounded-lg shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="p-1">
            {PRIORITIES.map(priority => {
              const PriorityIcon = priority.icon;
              const isSelected = value === priority.value;

              return (
                <button
                  key={priority.value}
                  onClick={() => handleSelect(priority.value)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors',
                    isSelected
                      ? `${priority.bgColor} ${priority.color}`
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-surface'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <PriorityIcon size={14} className={priority.color} />
                  <span className="flex-1">{priority.label}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline priority badge
interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const priorityData = PRIORITIES.find(p => p.value === priority);
  if (!priorityData || priority === 'none') return null;

  const Icon = priorityData.icon;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded',
      priorityData.bgColor,
      priorityData.color,
      size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
    )}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {size === 'md' && priorityData.label}
    </span>
  );
}

// Priority indicator dot
export function PriorityDot({ priority }: { priority: Priority }) {
  const priorityData = PRIORITIES.find(p => p.value === priority);
  if (!priorityData || priority === 'none') return null;

  return (
    <span className={clsx(
      'inline-block w-2 h-2 rounded-full',
      priorityData.color.replace('text-', 'bg-')
    )} />
  );
}
