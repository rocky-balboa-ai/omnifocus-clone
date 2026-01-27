'use client';

import { useAppStore } from '@/stores/app.store';
import { Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'pill' | 'dropdown';
  className?: string;
}

export function ThemeToggle({
  showLabel = false,
  size = 'md',
  variant = 'icon',
  className,
}: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode, toggleTheme } = useAppStore();

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={clsx(
          'rounded-lg transition-colors',
          sizeClasses[size],
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
          className
        )}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={iconSizes[size]} />
        ) : (
          <Moon size={iconSizes[size]} />
        )}
        {showLabel && (
          <span className="ml-2 text-sm">
            {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </span>
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    const modes: Array<{ value: 'light' | 'dark' | 'auto'; icon: typeof Sun; label: string }> = [
      { value: 'light', icon: Sun, label: 'Light' },
      { value: 'dark', icon: Moon, label: 'Dark' },
      { value: 'auto', icon: Monitor, label: 'Auto' },
    ];

    return (
      <div className={clsx(
        'inline-flex p-1 rounded-lg',
        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
        className
      )}>
        {modes.map(mode => {
          const Icon = mode.icon;
          const isActive = themeMode === mode.value;

          return (
            <button
              key={mode.value}
              onClick={() => setThemeMode(mode.value)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                isActive
                  ? theme === 'dark'
                    ? 'bg-omnifocus-bg text-white shadow'
                    : 'bg-white text-gray-900 shadow'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {showLabel && <span>{mode.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={clsx('relative', className)}>
      <ThemeModeSelector />
    </div>
  );
}

// Standalone theme mode selector
export function ThemeModeSelector() {
  const { theme, themeMode, setThemeMode } = useAppStore();

  const modes: Array<{
    value: 'light' | 'dark' | 'auto';
    icon: typeof Sun;
    label: string;
    description: string;
  }> = [
    { value: 'light', icon: Sun, label: 'Light', description: 'Always use light theme' },
    { value: 'dark', icon: Moon, label: 'Dark', description: 'Always use dark theme' },
    { value: 'auto', icon: Monitor, label: 'System', description: 'Match system preference' },
  ];

  return (
    <div className="space-y-1">
      {modes.map(mode => {
        const Icon = mode.icon;
        const isActive = themeMode === mode.value;

        return (
          <button
            key={mode.value}
            onClick={() => setThemeMode(mode.value)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              isActive
                ? theme === 'dark'
                  ? 'bg-omnifocus-surface'
                  : 'bg-gray-100'
                : theme === 'dark'
                  ? 'hover:bg-omnifocus-surface'
                  : 'hover:bg-gray-50'
            )}
          >
            <div className={clsx(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isActive
                ? 'bg-omnifocus-purple text-white'
                : theme === 'dark'
                  ? 'bg-omnifocus-bg text-gray-400'
                  : 'bg-gray-200 text-gray-500'
            )}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className={clsx(
                'text-sm font-medium',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {mode.label}
              </p>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {mode.description}
              </p>
            </div>
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-omnifocus-purple" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Simple theme icon for headers
export function ThemeIcon({ size = 20, className }: { size?: number; className?: string }) {
  const { theme } = useAppStore();

  return (
    <span className={className}>
      {theme === 'dark' ? <Moon size={size} /> : <Sun size={size} />}
    </span>
  );
}
