'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  defaultExpanded?: boolean;
  storageKey?: string; // For persisting state
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'card';
}

export function CollapsibleSection({
  title,
  icon,
  count,
  defaultExpanded = true,
  storageKey,
  children,
  headerActions,
  className,
  variant = 'default',
}: CollapsibleSectionProps) {
  const { theme } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Load state from localStorage if storageKey provided
  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        setIsExpanded(stored === 'true');
      }
    }
  }, [storageKey]);

  // Save state to localStorage
  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(newState));
    }
  };

  if (variant === 'card') {
    return (
      <div className={clsx(
        'rounded-xl border overflow-hidden',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border'
          : 'bg-white border-gray-200',
        className
      )}>
        <button
          onClick={handleToggle}
          className={clsx(
            'w-full flex items-center gap-3 p-4 text-left transition-colors',
            theme === 'dark' ? 'hover:bg-omnifocus-bg/50' : 'hover:bg-gray-50'
          )}
        >
          <div className={clsx(
            'transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}>
            <ChevronRight size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          </div>
          {icon}
          <span className={clsx(
            'flex-1 font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {title}
          </span>
          {count !== undefined && (
            <span className={clsx(
              'text-sm',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {count}
            </span>
          )}
          {headerActions && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
        </button>

        <div className={clsx(
          'transition-all duration-200 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}>
          <div className={clsx(
            'border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          onClick={handleToggle}
          className={clsx(
            'flex items-center gap-2 py-1 text-left transition-colors',
            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          )}
        >
          <div className={clsx(
            'transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}>
            <ChevronRight size={14} />
          </div>
          <span className="text-sm font-medium">{title}</span>
          {count !== undefined && (
            <span className="text-xs">({count})</span>
          )}
        </button>

        <div className={clsx(
          'transition-all duration-200 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        )}>
          {children}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleToggle}
          className={clsx(
            'flex items-center gap-2 transition-colors',
            theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
          )}
        >
          <ChevronDown
            size={18}
            className={clsx(
              'transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
          {icon}
          <span className="font-semibold">{title}</span>
        </button>
        {count !== undefined && (
          <span className={clsx(
            'text-sm px-2 py-0.5 rounded-full',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400'
              : 'bg-gray-100 text-gray-500'
          )}>
            {count}
          </span>
        )}
        {headerActions && (
          <div className="ml-auto">{headerActions}</div>
        )}
      </div>

      <div className={clsx(
        'transition-all duration-200 ease-in-out overflow-hidden',
        isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        {children}
      </div>
    </div>
  );
}

// Accordion - only one section expanded at a time
interface AccordionProps {
  children: React.ReactNode;
  defaultExpanded?: string;
  className?: string;
}

interface AccordionItemProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function Accordion({ children, defaultExpanded, className }: AccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpanded || null);

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {Array.isArray(children) ? children.map((child: any) => {
        if (child?.type?.displayName === 'AccordionItem') {
          return {
            ...child,
            props: {
              ...child.props,
              isExpanded: expandedId === child.props.id,
              onToggle: () => handleToggle(child.props.id),
            },
          };
        }
        return child;
      }) : children}
    </div>
  );
}

export function AccordionItem({
  id,
  title,
  icon,
  count,
  children,
  isExpanded = false,
  onToggle,
}: AccordionItemProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      <button
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center gap-3 p-4 text-left transition-colors',
          theme === 'dark' ? 'hover:bg-omnifocus-bg/50' : 'hover:bg-gray-50'
        )}
      >
        <div className={clsx(
          'transition-transform duration-200',
          isExpanded && 'rotate-90'
        )}>
          <ChevronRight size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
        </div>
        {icon}
        <span className={clsx(
          'flex-1 font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {title}
        </span>
        {count !== undefined && (
          <span className={clsx(
            'text-sm',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {count}
          </span>
        )}
      </button>

      <div className={clsx(
        'transition-all duration-200 ease-in-out overflow-hidden',
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className={clsx(
          'p-4 border-t',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

AccordionItem.displayName = 'AccordionItem';

// Expandable text for long content
interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({ text, maxLines = 3, className }: ExpandableTextProps) {
  const { theme } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  return (
    <div className={className}>
      <p
        className={clsx(
          'transition-all duration-200',
          !isExpanded && `line-clamp-${maxLines}`,
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        )}
        style={!isExpanded ? {
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : undefined}
        ref={(el) => {
          if (el) {
            setNeedsExpansion(el.scrollHeight > el.clientHeight);
          }
        }}
      >
        {text}
      </p>
      {(needsExpansion || isExpanded) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={clsx(
            'text-sm mt-1',
            theme === 'dark' ? 'text-omnifocus-purple' : 'text-omnifocus-purple'
          )}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
