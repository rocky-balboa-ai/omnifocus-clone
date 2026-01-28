'use client';

import { useAppStore } from '@/stores/app.store';
import {
  List,
  LayoutGrid,
  Columns3,
  Calendar,
  Table,
} from 'lucide-react';
import clsx from 'clsx';

export type ViewMode = 'list' | 'grid' | 'kanban' | 'calendar' | 'table';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

const VIEW_OPTIONS: Record<ViewMode, {
  label: string;
  icon: typeof List;
  description: string;
}> = {
  list: {
    label: 'List',
    icon: List,
    description: 'Compact list view',
  },
  grid: {
    label: 'Grid',
    icon: LayoutGrid,
    description: 'Card-based grid',
  },
  kanban: {
    label: 'Kanban',
    icon: Columns3,
    description: 'Column-based board',
  },
  calendar: {
    label: 'Calendar',
    icon: Calendar,
    description: 'Calendar view',
  },
  table: {
    label: 'Table',
    icon: Table,
    description: 'Spreadsheet view',
  },
};

export function ViewToggle({
  value,
  onChange,
  availableModes = ['list', 'grid', 'kanban'],
  className,
}: ViewToggleProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'inline-flex items-center rounded-lg p-1',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {availableModes.map(mode => {
        const option = VIEW_OPTIONS[mode];
        const Icon = option.icon;
        const isActive = value === mode;

        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            title={option.description}
            className={clsx(
              'p-1.5 rounded transition-colors',
              isActive
                ? theme === 'dark'
                  ? 'bg-omnifocus-bg text-white'
                  : 'bg-white text-gray-900 shadow-sm'
                : theme === 'dark'
                  ? 'text-gray-500 hover:text-white'
                  : 'text-gray-400 hover:text-gray-900'
            )}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

// Larger view toggle with labels
interface ViewToggleWithLabelsProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

export function ViewToggleWithLabels({
  value,
  onChange,
  availableModes = ['list', 'grid', 'kanban'],
  className,
}: ViewToggleWithLabelsProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'inline-flex items-center rounded-xl p-1',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {availableModes.map(mode => {
        const option = VIEW_OPTIONS[mode];
        const Icon = option.icon;
        const isActive = value === mode;

        return (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? theme === 'dark'
                  ? 'bg-omnifocus-bg text-white'
                  : 'bg-white text-gray-900 shadow-sm'
                : theme === 'dark'
                  ? 'text-gray-500 hover:text-white'
                  : 'text-gray-400 hover:text-gray-900'
            )}
          >
            <Icon size={16} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Dropdown view selector
interface ViewDropdownProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

export function ViewDropdown({
  value,
  onChange,
  availableModes = ['list', 'grid', 'kanban', 'calendar'],
  className,
}: ViewDropdownProps) {
  const { theme } = useAppStore();
  const currentOption = VIEW_OPTIONS[value];
  const CurrentIcon = currentOption.icon;

  return (
    <div className={clsx('relative group', className)}>
      <button className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
        theme === 'dark'
          ? 'bg-omnifocus-surface text-gray-300 hover:text-white'
          : 'bg-gray-100 text-gray-600 hover:text-gray-900'
      )}>
        <CurrentIcon size={16} />
        <span>{currentOption.label}</span>
      </button>

      {/* Dropdown */}
      <div className={clsx(
        'absolute top-full right-0 mt-1 w-48 rounded-xl shadow-xl border overflow-hidden z-50',
        'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}>
        <div className="p-2">
          {availableModes.map(mode => {
            const option = VIEW_OPTIONS[mode];
            const Icon = option.icon;
            const isActive = value === mode;

            return (
              <button
                key={mode}
                onClick={() => onChange(mode)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon size={18} />
                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
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
    </div>
  );
}

// Simple icon-only toggle for specific views
interface DualViewToggleProps {
  isGridView: boolean;
  onChange: (isGrid: boolean) => void;
  className?: string;
}

export function DualViewToggle({ isGridView, onChange, className }: DualViewToggleProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'inline-flex items-center rounded-lg p-0.5',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <button
        onClick={() => onChange(false)}
        className={clsx(
          'p-1.5 rounded transition-colors',
          !isGridView
            ? theme === 'dark'
              ? 'bg-omnifocus-bg text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : theme === 'dark'
              ? 'text-gray-500 hover:text-white'
              : 'text-gray-400 hover:text-gray-900'
        )}
        title="List view"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => onChange(true)}
        className={clsx(
          'p-1.5 rounded transition-colors',
          isGridView
            ? theme === 'dark'
              ? 'bg-omnifocus-bg text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : theme === 'dark'
              ? 'text-gray-500 hover:text-white'
              : 'text-gray-400 hover:text-gray-900'
        )}
        title="Grid view"
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  );
}
