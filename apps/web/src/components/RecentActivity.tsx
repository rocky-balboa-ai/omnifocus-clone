'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  Plus,
  Flag,
  Calendar,
  Edit3,
  Clock,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import clsx from 'clsx';

interface ActivityItem {
  id: string;
  type: 'completed' | 'created' | 'flagged' | 'due_set' | 'edited';
  actionId: string;
  actionTitle: string;
  timestamp: Date;
}

export function RecentActivity() {
  const { actions, theme } = useAppStore();

  // Generate activity feed from actions
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    actions.forEach(action => {
      // Completed actions
      if (action.status === 'completed' && action.completedAt) {
        items.push({
          id: `completed-${action.id}`,
          type: 'completed',
          actionId: action.id,
          actionTitle: action.title,
          timestamp: new Date(action.completedAt),
        });
      }

      // Due dates set recently (within 24 hours assuming)
      if (action.dueDate && isToday(new Date(action.dueDate))) {
        items.push({
          id: `due-${action.id}`,
          type: 'due_set',
          actionId: action.id,
          actionTitle: action.title,
          timestamp: new Date(action.dueDate),
        });
      }
    });

    // Sort by timestamp descending and limit to 10
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, [actions]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'completed':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'created':
        return <Plus size={14} className="text-blue-400" />;
      case 'flagged':
        return <Flag size={14} className="text-omnifocus-orange" />;
      case 'due_set':
        return <Calendar size={14} className="text-purple-400" />;
      case 'edited':
        return <Edit3 size={14} className="text-gray-400" />;
      default:
        return <Activity size={14} className="text-gray-400" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'completed':
        return 'Completed';
      case 'created':
        return 'Created';
      case 'flagged':
        return 'Flagged';
      case 'due_set':
        return 'Due today';
      case 'edited':
        return 'Edited';
      default:
        return 'Updated';
    }
  };

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (activities.length === 0) {
    return (
      <div className={clsx(
        'p-4 rounded-xl border',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-gray-400" />
          <h3 className={clsx(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Recent Activity
          </h3>
        </div>
        <p className={clsx(
          'text-sm text-center py-4',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={18} className="text-omnifocus-purple" />
        <h3 className={clsx(
          'text-sm font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Recent Activity
        </h3>
      </div>

      <div className="space-y-3">
        {activities.map(activity => (
          <div
            key={activity.id}
            className={clsx(
              'flex items-start gap-3 text-sm',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            <div className="mt-0.5 shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'text-xs font-medium',
                  activity.type === 'completed' ? 'text-green-500' :
                  activity.type === 'flagged' ? 'text-omnifocus-orange' :
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {getActivityText(activity)}
                </span>
                <span className={clsx(
                  'text-xs',
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                )}>
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              <p className={clsx(
                'truncate',
                activity.type === 'completed' && 'line-through opacity-60'
              )}>
                {activity.actionTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
