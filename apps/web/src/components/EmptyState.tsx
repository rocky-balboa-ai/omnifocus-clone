'use client';

import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  CheckCircle2,
  Search,
  Plus,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

type EmptyStateVariant =
  | 'inbox'
  | 'project'
  | 'tag'
  | 'search'
  | 'completed'
  | 'flagged'
  | 'forecast'
  | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, {
  icon: typeof Inbox;
  iconColor: string;
  title: string;
  description: string;
}> = {
  inbox: {
    icon: Inbox,
    iconColor: 'text-blue-500',
    title: 'Inbox is empty',
    description: 'New tasks will appear here. Press N to add your first task.',
  },
  project: {
    icon: FolderKanban,
    iconColor: 'text-purple-500',
    title: 'No tasks in this project',
    description: 'Add tasks to get started on this project.',
  },
  tag: {
    icon: Tags,
    iconColor: 'text-green-500',
    title: 'No tasks with this tag',
    description: 'Tasks tagged with this label will appear here.',
  },
  search: {
    icon: Search,
    iconColor: 'text-gray-400',
    title: 'No results found',
    description: 'Try a different search term or check your filters.',
  },
  completed: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    title: 'Nothing completed yet',
    description: 'Completed tasks will show up here.',
  },
  flagged: {
    icon: Flag,
    iconColor: 'text-omnifocus-orange',
    title: 'No flagged items',
    description: 'Flag important tasks to see them here.',
  },
  forecast: {
    icon: Calendar,
    iconColor: 'text-orange-500',
    title: 'No upcoming tasks',
    description: 'Tasks with due dates will appear in the forecast.',
  },
  generic: {
    icon: Sparkles,
    iconColor: 'text-omnifocus-purple',
    title: 'Nothing here yet',
    description: 'Get started by adding some content.',
  },
};

export function EmptyState({
  variant = 'generic',
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const { theme, setQuickEntryOpen } = useAppStore();
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {/* Icon */}
      <div className={clsx(
        'w-16 h-16 rounded-full flex items-center justify-center mb-4',
        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
      )}>
        {icon || <Icon size={32} className={config.iconColor} />}
      </div>

      {/* Title */}
      <h3 className={clsx(
        'text-lg font-semibold mb-2',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {displayTitle}
      </h3>

      {/* Description */}
      <p className={clsx(
        'text-sm max-w-sm mb-6',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {displayDescription}
      </p>

      {/* Action button */}
      {action ? (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
        >
          <Plus size={18} />
          {action.label}
        </button>
      ) : variant === 'inbox' || variant === 'project' ? (
        <button
          onClick={() => setQuickEntryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
        >
          <Plus size={18} />
          Add Task
        </button>
      ) : null}
    </div>
  );
}

// Compact inline empty state
interface InlineEmptyProps {
  message?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function InlineEmpty({ message = 'No items', icon, className }: InlineEmptyProps) {
  const { theme } = useAppStore();

  return (
    <div className={clsx(
      'flex items-center justify-center gap-2 py-4 text-sm',
      theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
      className
    )}>
      {icon}
      <span>{message}</span>
    </div>
  );
}
