'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Filter,
  Save,
  Trash2,
  ChevronDown,
  Plus,
  Check,
  Star,
  StarOff,
} from 'lucide-react';
import clsx from 'clsx';

export interface FilterConfig {
  status?: ('active' | 'completed' | 'on_hold' | 'dropped')[];
  flagged?: boolean;
  projectIds?: string[];
  tagIds?: string[];
  hasDueDate?: boolean;
  isOverdue?: boolean;
  dueDateRange?: {
    start?: string;
    end?: string;
  };
  searchQuery?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'name' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

interface FilterPreset {
  id: string;
  name: string;
  config: FilterConfig;
  isFavorite: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'omnifocus-filter-presets';

// Default presets
const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'default-active',
    name: 'Active Tasks',
    config: { status: ['active'] },
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-flagged',
    name: 'Flagged Only',
    config: { status: ['active'], flagged: true },
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-due-soon',
    name: 'Due This Week',
    config: {
      status: ['active'],
      hasDueDate: true,
      dueDateRange: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-overdue',
    name: 'Overdue',
    config: { status: ['active'], isOverdue: true },
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
];

interface FilterPresetsProps {
  currentFilter: FilterConfig;
  onFilterChange: (filter: FilterConfig) => void;
  className?: string;
}

export function FilterPresets({
  currentFilter,
  onFilterChange,
  className,
}: FilterPresetsProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Load presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback((newPresets: FilterPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
  }, []);

  const handleSelectPreset = (preset: FilterPreset) => {
    onFilterChange(preset.config);
    setActivePresetId(preset.id);
    setIsOpen(false);
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPresetName.trim(),
      config: currentFilter,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    savePresets([...presets, newPreset]);
    setNewPresetName('');
    setIsCreating(false);
    setActivePresetId(newPreset.id);
  };

  const handleDeletePreset = (id: string) => {
    savePresets(presets.filter(p => p.id !== id));
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    savePresets(presets.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const handleClearFilter = () => {
    onFilterChange({});
    setActivePresetId(null);
    setIsOpen(false);
  };

  const favoritePresets = presets.filter(p => p.isFavorite);
  const regularPresets = presets.filter(p => !p.isFavorite);
  const activePreset = presets.find(p => p.id === activePresetId);

  const hasActiveFilter = Object.keys(currentFilter).length > 0;

  return (
    <div className={clsx('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
          hasActiveFilter
            ? theme === 'dark'
              ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
              : 'bg-omnifocus-purple/10 text-omnifocus-purple'
            : theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
        )}
      >
        <Filter size={14} />
        <span>{activePreset?.name || (hasActiveFilter ? 'Custom Filter' : 'Filter')}</span>
        <ChevronDown size={14} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 w-64 rounded-xl shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="p-2 max-h-80 overflow-y-auto">
            {/* Clear filter */}
            {hasActiveFilter && (
              <>
                <button
                  onClick={handleClearFilter}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors mb-1',
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-omnifocus-surface hover:text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  Clear filter
                </button>
                <div className={clsx(
                  'my-2 border-t',
                  theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
                )} />
              </>
            )}

            {/* Favorites */}
            {favoritePresets.length > 0 && (
              <>
                <p className={clsx(
                  'px-3 py-1 text-xs font-medium uppercase',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  Favorites
                </p>
                {favoritePresets.map(preset => (
                  <PresetItem
                    key={preset.id}
                    preset={preset}
                    isActive={activePresetId === preset.id}
                    onSelect={() => handleSelectPreset(preset)}
                    onDelete={() => handleDeletePreset(preset.id)}
                    onToggleFavorite={() => handleToggleFavorite(preset.id)}
                    theme={theme}
                  />
                ))}
                <div className={clsx(
                  'my-2 border-t',
                  theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
                )} />
              </>
            )}

            {/* All presets */}
            <p className={clsx(
              'px-3 py-1 text-xs font-medium uppercase',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Presets
            </p>
            {regularPresets.map(preset => (
              <PresetItem
                key={preset.id}
                preset={preset}
                isActive={activePresetId === preset.id}
                onSelect={() => handleSelectPreset(preset)}
                onDelete={preset.id.startsWith('default-') ? undefined : () => handleDeletePreset(preset.id)}
                onToggleFavorite={() => handleToggleFavorite(preset.id)}
                theme={theme}
              />
            ))}
          </div>

          {/* Create new preset */}
          <div className={clsx(
            'p-2 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            {isCreating ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePreset();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                  placeholder="Preset name..."
                  autoFocus
                  className={clsx(
                    'flex-1 px-2 py-1.5 rounded border text-sm outline-none',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white placeholder-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  )}
                />
                <button
                  onClick={handleSavePreset}
                  disabled={!newPresetName.trim()}
                  className="px-2 py-1.5 rounded bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 disabled:opacity-50"
                >
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                disabled={!hasActiveFilter}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors',
                  hasActiveFilter
                    ? theme === 'dark'
                      ? 'text-omnifocus-purple hover:bg-omnifocus-surface'
                      : 'text-omnifocus-purple hover:bg-gray-100'
                    : 'opacity-50 cursor-not-allowed',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                <Plus size={14} />
                Save current filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual preset item
interface PresetItemProps {
  preset: FilterPreset;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onToggleFavorite: () => void;
  theme: 'light' | 'dark';
}

function PresetItem({
  preset,
  isActive,
  onSelect,
  onDelete,
  onToggleFavorite,
  theme,
}: PresetItemProps) {
  return (
    <div className={clsx(
      'group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
      isActive
        ? theme === 'dark'
          ? 'bg-omnifocus-purple/20'
          : 'bg-omnifocus-purple/10'
        : theme === 'dark'
          ? 'hover:bg-omnifocus-surface'
          : 'hover:bg-gray-100'
    )}>
      <button
        onClick={onSelect}
        className={clsx(
          'flex-1 text-sm text-left',
          isActive
            ? 'text-omnifocus-purple font-medium'
            : theme === 'dark'
              ? 'text-gray-300'
              : 'text-gray-700'
        )}
      >
        {preset.name}
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={clsx(
            'p-1 rounded transition-colors',
            preset.isFavorite
              ? 'text-yellow-500'
              : theme === 'dark'
                ? 'text-gray-500 hover:text-yellow-500'
                : 'text-gray-400 hover:text-yellow-500'
          )}
        >
          {preset.isFavorite ? <Star size={14} /> : <StarOff size={14} />}
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'text-gray-500 hover:text-red-500'
                : 'text-gray-400 hover:text-red-500'
            )}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {isActive && (
        <Check size={14} className="text-omnifocus-purple shrink-0" />
      )}
    </div>
  );
}

// Quick filter buttons for common filters
interface QuickFiltersProps {
  currentFilter: FilterConfig;
  onFilterChange: (filter: FilterConfig) => void;
  className?: string;
}

export function QuickFilters({ currentFilter, onFilterChange, className }: QuickFiltersProps) {
  const { theme } = useAppStore();

  const quickFilters = [
    { label: 'All', filter: { status: ['active' as const] } },
    { label: 'Flagged', filter: { status: ['active' as const], flagged: true } },
    { label: 'Due Soon', filter: { status: ['active' as const], hasDueDate: true } },
    { label: 'Overdue', filter: { status: ['active' as const], isOverdue: true } },
  ];

  const isFilterActive = (filter: FilterConfig) => {
    return JSON.stringify(currentFilter) === JSON.stringify(filter);
  };

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {quickFilters.map((qf, i) => (
        <button
          key={i}
          onClick={() => onFilterChange(qf.filter)}
          className={clsx(
            'px-3 py-1 rounded-full text-xs font-medium transition-colors',
            isFilterActive(qf.filter)
              ? 'bg-omnifocus-purple text-white'
              : theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900'
          )}
        >
          {qf.label}
        </button>
      ))}
    </div>
  );
}
