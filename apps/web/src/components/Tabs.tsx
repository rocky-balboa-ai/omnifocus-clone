'use client';

import { useState, createContext, useContext } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

// Context for tab state
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  variant: 'default' | 'pills' | 'underline' | 'enclosed';
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

// Main Tabs container
interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  children,
  className,
}: TabsProps) {
  const { theme } = useAppStore();
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeTab = value ?? internalValue;
  const setActiveTab = (tab: string) => {
    setInternalValue(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, theme, variant }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tab list (container for triggers)
interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabList({ children, className }: TabListProps) {
  const { theme, variant } = useTabsContext();

  const variantClasses = {
    default: clsx(
      'flex items-center gap-1 p-1 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
    ),
    pills: 'flex items-center gap-2',
    underline: clsx(
      'flex items-center border-b',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
    ),
    enclosed: clsx(
      'flex items-center border-b',
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
    ),
  };

  return (
    <div role="tablist" className={clsx(variantClasses[variant], className)}>
      {children}
    </div>
  );
}

// Individual tab trigger
interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
  className?: string;
}

export function TabTrigger({
  value,
  children,
  icon,
  badge,
  disabled,
  className,
}: TabTriggerProps) {
  const { activeTab, setActiveTab, theme, variant } = useTabsContext();
  const isActive = activeTab === value;

  const baseClasses = 'flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none';

  const variantClasses = {
    default: clsx(
      'px-3 py-1.5 rounded-md',
      isActive
        ? theme === 'dark'
          ? 'bg-omnifocus-bg text-white shadow'
          : 'bg-white text-gray-900 shadow'
        : theme === 'dark'
          ? 'text-gray-400 hover:text-white'
          : 'text-gray-500 hover:text-gray-900'
    ),
    pills: clsx(
      'px-4 py-2 rounded-full',
      isActive
        ? 'bg-omnifocus-purple text-white'
        : theme === 'dark'
          ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    ),
    underline: clsx(
      'px-4 py-3 border-b-2 -mb-px',
      isActive
        ? 'border-omnifocus-purple text-omnifocus-purple'
        : clsx(
            'border-transparent',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:border-gray-600'
              : 'text-gray-500 hover:text-gray-900 hover:border-gray-300'
          )
    ),
    enclosed: clsx(
      'px-4 py-2 rounded-t-lg border border-b-0 -mb-px',
      isActive
        ? theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border text-white'
          : 'bg-white border-gray-200 text-gray-900'
        : clsx(
            'border-transparent',
            theme === 'dark'
              ? 'text-gray-400 hover:text-white'
              : 'text-gray-500 hover:text-gray-900'
          )
    ),
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span className={clsx(
          'px-1.5 py-0.5 rounded-full text-xs',
          isActive
            ? variant === 'pills'
              ? 'bg-white/20 text-white'
              : 'bg-omnifocus-purple/20 text-omnifocus-purple'
            : theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400'
              : 'bg-gray-200 text-gray-500'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Tab content panel
interface TabContentProps {
  value: string;
  children: React.ReactNode;
  forceMount?: boolean;
  className?: string;
}

export function TabContent({
  value,
  children,
  forceMount = false,
  className,
}: TabContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={clsx(
        'focus:outline-none',
        !isActive && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

// Simple tabs (all-in-one component)
interface SimpleTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number | string;
    content: React.ReactNode;
  }>;
  defaultValue?: string;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  className?: string;
}

export function SimpleTabs({
  tabs,
  defaultValue,
  variant = 'default',
  className,
}: SimpleTabsProps) {
  return (
    <Tabs defaultValue={defaultValue || tabs[0]?.value} variant={variant} className={className}>
      <TabList>
        {tabs.map(tab => (
          <TabTrigger
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            badge={tab.badge}
          >
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>
      {tabs.map(tab => (
        <TabContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
}

// Vertical tabs
interface VerticalTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }>;
  defaultValue?: string;
  className?: string;
}

export function VerticalTabs({
  tabs,
  defaultValue,
  className,
}: VerticalTabsProps) {
  const { theme } = useAppStore();
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0]?.value);

  return (
    <div className={clsx('flex gap-6', className)}>
      {/* Tab list */}
      <div className="w-48 shrink-0">
        <div className="space-y-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                  isActive
                    ? theme === 'dark'
                      ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {tabs.map(tab => (
          activeTab === tab.value && (
            <div key={tab.value}>
              {tab.content}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
