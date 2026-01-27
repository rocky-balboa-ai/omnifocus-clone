'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  Circle,
  Plus,
  Edit3,
  Calendar,
  Flag,
  Tag,
  FolderOpen,
  Clock,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay } from 'date-fns';
import clsx from 'clsx';

type TimelineEventType =
  | 'created'
  | 'completed'
  | 'updated'
  | 'scheduled'
  | 'flagged'
  | 'unflagged'
  | 'tagged'
  | 'moved'
  | 'deferred'
  | 'deleted'
  | 'restored';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  actionId: string;
  actionTitle: string;
  timestamp: string;
  details?: string;
  projectId?: string;
  projectName?: string;
}

// Mock events for demo - in real app, this would come from an activity log
function generateMockEvents(actions: any[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  actions.forEach(action => {
    // Created event
    events.push({
      id: `${action.id}-created`,
      type: 'created',
      actionId: action.id,
      actionTitle: action.title,
      timestamp: action.createdAt,
      projectId: action.projectId,
    });

    // Completed event
    if (action.status === 'completed' && action.completedAt) {
      events.push({
        id: `${action.id}-completed`,
        type: 'completed',
        actionId: action.id,
        actionTitle: action.title,
        timestamp: action.completedAt,
        projectId: action.projectId,
      });
    }

    // Flagged event
    if (action.flagged) {
      events.push({
        id: `${action.id}-flagged`,
        type: 'flagged',
        actionId: action.id,
        actionTitle: action.title,
        timestamp: action.updatedAt || action.createdAt,
        projectId: action.projectId,
      });
    }

    // Scheduled event (has due date)
    if (action.dueDate) {
      events.push({
        id: `${action.id}-scheduled`,
        type: 'scheduled',
        actionId: action.id,
        actionTitle: action.title,
        timestamp: action.updatedAt || action.createdAt,
        details: format(new Date(action.dueDate), 'MMM d, yyyy'),
        projectId: action.projectId,
      });
    }
  });

  // Sort by timestamp descending
  return events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

const EVENT_CONFIG: Record<TimelineEventType, {
  icon: typeof Circle;
  color: string;
  bgColor: string;
  label: string;
}> = {
  created: {
    icon: Plus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    label: 'Created',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Completed',
  },
  updated: {
    icon: Edit3,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    label: 'Updated',
  },
  scheduled: {
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    label: 'Scheduled',
  },
  flagged: {
    icon: Flag,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    label: 'Flagged',
  },
  unflagged: {
    icon: Flag,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/20',
    label: 'Unflagged',
  },
  tagged: {
    icon: Tag,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    label: 'Tagged',
  },
  moved: {
    icon: FolderOpen,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    label: 'Moved',
  },
  deferred: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    label: 'Deferred',
  },
  deleted: {
    icon: Trash2,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    label: 'Deleted',
  },
  restored: {
    icon: RotateCcw,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Restored',
  },
};

interface TimelineProps {
  limit?: number;
  actionId?: string; // Filter by specific action
  projectId?: string; // Filter by project
  className?: string;
}

export function Timeline({ limit = 50, actionId, projectId, className }: TimelineProps) {
  const { theme, actions, setSelectedAction } = useAppStore();

  const events = useMemo(() => {
    let allEvents = generateMockEvents(actions);

    // Apply filters
    if (actionId) {
      allEvents = allEvents.filter(e => e.actionId === actionId);
    }
    if (projectId) {
      allEvents = allEvents.filter(e => e.projectId === projectId);
    }

    return allEvents.slice(0, limit);
  }, [actions, actionId, projectId, limit]);

  // Group events by day
  const groupedEvents = useMemo(() => {
    const groups: { date: Date; events: TimelineEvent[] }[] = [];
    let currentGroup: { date: Date; events: TimelineEvent[] } | null = null;

    events.forEach(event => {
      const eventDate = startOfDay(new Date(event.timestamp));

      if (!currentGroup || currentGroup.date.getTime() !== eventDate.getTime()) {
        currentGroup = { date: eventDate, events: [] };
        groups.push(currentGroup);
      }

      currentGroup.events.push(event);
    });

    return groups;
  }, [events]);

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  if (events.length === 0) {
    return (
      <div className={clsx(
        'flex flex-col items-center justify-center py-12',
        className
      )}>
        <Clock size={32} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
        <p className={clsx(
          'mt-2 text-sm',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {groupedEvents.map(group => (
        <div key={group.date.toISOString()}>
          {/* Date header */}
          <div className={clsx(
            'sticky top-0 z-10 px-4 py-2 text-xs font-semibold uppercase tracking-wider',
            theme === 'dark'
              ? 'bg-omnifocus-bg text-gray-500'
              : 'bg-gray-50 text-gray-500'
          )}>
            {formatDateHeader(group.date)}
          </div>

          {/* Events */}
          <div className="relative">
            {/* Timeline line */}
            <div className={clsx(
              'absolute left-6 top-0 bottom-0 w-px',
              theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200'
            )} />

            {/* Event items */}
            <div className="space-y-1">
              {group.events.map((event, idx) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={idx === group.events.length - 1}
                  onClick={() => setSelectedAction(event.actionId)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  onClick: () => void;
  theme: 'light' | 'dark';
}

function TimelineItem({ event, isLast, onClick, theme }: TimelineItemProps) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'group relative flex items-start gap-3 px-4 py-2 cursor-pointer transition-colors',
        theme === 'dark' ? 'hover:bg-omnifocus-surface/50' : 'hover:bg-gray-50'
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={clsx(
        'relative z-10 w-5 h-5 rounded-full flex items-center justify-center',
        config.bgColor
      )}>
        <Icon size={12} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-xs font-medium',
            config.color
          )}>
            {config.label}
          </span>
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          )}>
            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
          </span>
        </div>
        <p className={clsx(
          'text-sm truncate',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {event.actionTitle}
        </p>
        {event.details && (
          <p className={clsx(
            'text-xs mt-0.5',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {event.details}
          </p>
        )}
      </div>

      {/* Time */}
      <span className={clsx(
        'text-xs shrink-0',
        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
      )}>
        {format(new Date(event.timestamp), 'h:mm a')}
      </span>
    </div>
  );
}

// Compact timeline for sidebar or widgets
export function CompactTimeline({ limit = 5, className }: { limit?: number; className?: string }) {
  const { theme, actions, setSelectedAction } = useAppStore();

  const events = useMemo(() => {
    return generateMockEvents(actions).slice(0, limit);
  }, [actions, limit]);

  if (events.length === 0) {
    return (
      <p className={clsx(
        'text-sm text-center py-4',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        No recent activity
      </p>
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {events.map(event => {
        const config = EVENT_CONFIG[event.type];
        const Icon = config.icon;

        return (
          <div
            key={event.id}
            className={clsx(
              'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
              theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
            )}
            onClick={() => setSelectedAction(event.actionId)}
          >
            <Icon size={14} className={config.color} />
            <span className={clsx(
              'flex-1 text-sm truncate',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}>
              {event.actionTitle}
            </span>
            <span className={clsx(
              'text-xs shrink-0',
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            )}>
              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Timeline panel (modal-style)
interface TimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  actionId?: string;
  projectId?: string;
}

export function TimelinePanel({ isOpen, onClose, actionId, projectId }: TimelinePanelProps) {
  const { theme } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={clsx(
        'relative w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl border overflow-hidden',
        'animate-in fade-in zoom-in-95 duration-200',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-omnifocus-purple" />
            <h2 className={clsx(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Activity Timeline
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          <Timeline actionId={actionId} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
