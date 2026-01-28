'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Flag,
  Type,
  Star,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

export type SortField =
  | 'dueDate'
  | 'createdAt'
  | 'name'
  | 'priority'
  | 'flagged'
  | 'completedAt'
  | 'project';

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

interface SortPickerProps {
  value: SortConfig;
  onChange: (config: SortConfig) => void;
  availableFields?: SortField[];
  className?: string;
}

const SORT_OPTIONS: Record<SortField, {
  label: string;
  icon: typeof ArrowUpDown;
  defaultOrder: SortOrder;
}> = {
  dueDate: { label: 'Due Date', icon: Calendar, defaultOrder: 'asc' },
  createdAt: { label: 'Created', icon: Clock, defaultOrder: 'desc' },
  name: { label: 'Name', icon: Type, defaultOrder: 'asc' },
  priority: { label: 'Priority', icon: Star, defaultOrder: 'desc' },
  flagged: { label: 'Flagged', icon: Flag, defaultOrder: 'desc' },
  completedAt: { label: 'Completed', icon: CheckCircle2, defaultOrder: 'desc' },
  project: { label: 'Project', icon: Type, defaultOrder: 'asc' },
};

export function SortPicker({
  value,
  onChange,
  availableFields = ['dueDate', 'createdAt', 'name', 'flagged'],
  className,
}: SortPickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelectField = (field: SortField) => {
    if (field === value.field) {
      // Toggle order
      onChange({ field, order: value.order === 'asc' ? 'desc' : 'asc' });
    } else {
      // New field with default order
      onChange({ field, order: SORT_OPTIONS[field].defaultOrder });
    }
  };

  const currentOption = SORT_OPTIONS[value.field];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
            : 'bg-gray-100 text-gray-500 hover:text-gray-900'
        )}
      >
        <ArrowUpDown size={14} />
        <span>{currentOption.label}</span>
        {value.order === 'asc' ? (
          <ArrowUp size={12} />
        ) : (
          <ArrowDown size={12} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full right-0 mt-1 w-48 rounded-xl shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="p-2">
            {availableFields.map(field => {
              const option = SORT_OPTIONS[field];
              const Icon = option.icon;
              const isSelected = value.field === field;

              return (
                <button
                  key={field}
                  onClick={() => handleSelectField(field)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                        : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-surface'
                        : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={16} />
                  <span className="flex-1">{option.label}</span>
                  {isSelected && (
                    value.order === 'asc' ? (
                      <ArrowUp size={14} />
                    ) : (
                      <ArrowDown size={14} />
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline sort buttons
interface SortButtonsProps {
  value: SortConfig;
  onChange: (config: SortConfig) => void;
  fields: SortField[];
  className?: string;
}

export function SortButtons({ value, onChange, fields, className }: SortButtonsProps) {
  const { theme } = useAppStore();

  const handleClick = (field: SortField) => {
    if (field === value.field) {
      onChange({ field, order: value.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onChange({ field, order: SORT_OPTIONS[field].defaultOrder });
    }
  };

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {fields.map(field => {
        const option = SORT_OPTIONS[field];
        const isSelected = value.field === field;

        return (
          <button
            key={field}
            onClick={() => handleClick(field)}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
              isSelected
                ? 'bg-omnifocus-purple text-white'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            {option.label}
            {isSelected && (
              value.order === 'asc' ? (
                <ArrowUp size={12} />
              ) : (
                <ArrowDown size={12} />
              )
            )}
          </button>
        );
      })}
    </div>
  );
}

// Sort indicator for table headers
interface SortIndicatorProps {
  field: SortField;
  currentSort: SortConfig;
  onSort: (config: SortConfig) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortIndicator({
  field,
  currentSort,
  onSort,
  children,
  className,
}: SortIndicatorProps) {
  const { theme } = useAppStore();
  const isActive = currentSort.field === field;

  const handleClick = () => {
    if (isActive) {
      onSort({ field, order: currentSort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ field, order: SORT_OPTIONS[field].defaultOrder });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'flex items-center gap-1 transition-colors',
        isActive
          ? 'text-omnifocus-purple'
          : theme === 'dark'
            ? 'text-gray-400 hover:text-white'
            : 'text-gray-500 hover:text-gray-900',
        className
      )}
    >
      {children}
      {isActive ? (
        currentSort.order === 'asc' ? (
          <ArrowUp size={14} />
        ) : (
          <ArrowDown size={14} />
        )
      ) : (
        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50" />
      )}
    </button>
  );
}

// Hook for sorting data
export function useSorting<T>(
  data: T[],
  config: SortConfig,
  getters: Record<SortField, (item: T) => any>
) {
  const sortedData = [...data].sort((a, b) => {
    const getter = getters[config.field];
    if (!getter) return 0;

    const aVal = getter(a);
    const bVal = getter(b);

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Compare
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime();
    } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0);
    } else {
      comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }

    return config.order === 'asc' ? comparison : -comparison;
  });

  return sortedData;
}
