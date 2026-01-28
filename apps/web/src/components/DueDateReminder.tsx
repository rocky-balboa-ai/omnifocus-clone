'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  AlertCircle,
  Clock,
  CalendarClock,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import clsx from 'clsx';

interface DueDateReminderProps {
  onActionClick?: (actionId: string) => void;
}

export function DueDateReminder({ onActionClick }: DueDateReminderProps) {
  const { actions, theme, setSelectedAction } = useAppStore();

  const categorizedActions = useMemo(() => {
    const today = startOfDay(new Date());
    const activeWithDue = actions.filter(
      a => a.status === 'active' && a.dueDate
    );

    const overdue = activeWithDue.filter(a => isPast(new Date(a.dueDate!)) && !isToday(new Date(a.dueDate!)));
    const dueToday = activeWithDue.filter(a => isToday(new Date(a.dueDate!)));
    const dueTomorrow = activeWithDue.filter(a => isTomorrow(new Date(a.dueDate!)));
    const dueThisWeek = activeWithDue.filter(a => {
      const dueDate = new Date(a.dueDate!);
      return isThisWeek(dueDate) && !isToday(dueDate) && !isTomorrow(dueDate) && !isPast(dueDate);
    });

    return { overdue, dueToday, dueTomorrow, dueThisWeek };
  }, [actions]);

  const handleClick = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    } else {
      setSelectedAction(actionId);
    }
  };

  const totalUrgent = categorizedActions.overdue.length + categorizedActions.dueToday.length;

  if (totalUrgent === 0 && categorizedActions.dueTomorrow.length === 0 && categorizedActions.dueThisWeek.length === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      categorizedActions.overdue.length > 0
        ? theme === 'dark'
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-red-50 border-red-200'
        : theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border'
          : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock
          size={18}
          className={categorizedActions.overdue.length > 0 ? 'text-red-500' : 'text-omnifocus-orange'}
        />
        <h3 className={clsx(
          'text-sm font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Upcoming Deadlines
        </h3>
        {totalUrgent > 0 && (
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            categorizedActions.overdue.length > 0
              ? 'bg-red-500 text-white'
              : 'bg-omnifocus-orange text-white'
          )}>
            {totalUrgent} urgent
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Overdue */}
        {categorizedActions.overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={12} className="text-red-500" />
              <span className="text-xs font-medium text-red-500">Overdue</span>
            </div>
            <div className="space-y-1">
              {categorizedActions.overdue.slice(0, 3).map(action => (
                <ActionItem
                  key={action.id}
                  action={action}
                  theme={theme}
                  onClick={() => handleClick(action.id)}
                  variant="overdue"
                />
              ))}
              {categorizedActions.overdue.length > 3 && (
                <p className={clsx(
                  'text-xs pl-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  +{categorizedActions.overdue.length - 3} more overdue
                </p>
              )}
            </div>
          </div>
        )}

        {/* Due Today */}
        {categorizedActions.dueToday.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-omnifocus-orange" />
              <span className="text-xs font-medium text-omnifocus-orange">Due Today</span>
            </div>
            <div className="space-y-1">
              {categorizedActions.dueToday.slice(0, 3).map(action => (
                <ActionItem
                  key={action.id}
                  action={action}
                  theme={theme}
                  onClick={() => handleClick(action.id)}
                  variant="today"
                />
              ))}
              {categorizedActions.dueToday.length > 3 && (
                <p className={clsx(
                  'text-xs pl-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  +{categorizedActions.dueToday.length - 3} more today
                </p>
              )}
            </div>
          </div>
        )}

        {/* Due Tomorrow */}
        {categorizedActions.dueTomorrow.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} />
              <span className={clsx(
                'text-xs font-medium',
                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
              )}>
                Tomorrow
              </span>
            </div>
            <div className="space-y-1">
              {categorizedActions.dueTomorrow.slice(0, 2).map(action => (
                <ActionItem
                  key={action.id}
                  action={action}
                  theme={theme}
                  onClick={() => handleClick(action.id)}
                  variant="tomorrow"
                />
              ))}
              {categorizedActions.dueTomorrow.length > 2 && (
                <p className={clsx(
                  'text-xs pl-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  +{categorizedActions.dueTomorrow.length - 2} more tomorrow
                </p>
              )}
            </div>
          </div>
        )}

        {/* This Week */}
        {categorizedActions.dueThisWeek.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-500'} />
              <span className={clsx(
                'text-xs font-medium',
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              )}>
                This Week
              </span>
            </div>
            <div className="space-y-1">
              {categorizedActions.dueThisWeek.slice(0, 2).map(action => (
                <ActionItem
                  key={action.id}
                  action={action}
                  theme={theme}
                  onClick={() => handleClick(action.id)}
                  variant="week"
                />
              ))}
              {categorizedActions.dueThisWeek.length > 2 && (
                <p className={clsx(
                  'text-xs pl-4',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  +{categorizedActions.dueThisWeek.length - 2} more this week
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({
  action,
  theme,
  onClick,
  variant,
}: {
  action: { id: string; title: string; dueDate?: string };
  theme: 'light' | 'dark';
  onClick: () => void;
  variant: 'overdue' | 'today' | 'tomorrow' | 'week';
}) {
  const getDaysOverdue = () => {
    if (!action.dueDate) return 0;
    return Math.abs(differenceInDays(new Date(), new Date(action.dueDate)));
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors group',
        theme === 'dark'
          ? 'hover:bg-omnifocus-bg'
          : 'hover:bg-gray-100'
      )}
    >
      <span className={clsx(
        'flex-1 truncate',
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        {action.title}
      </span>
      {variant === 'overdue' && (
        <span className="text-xs text-red-500">
          {getDaysOverdue()}d ago
        </span>
      )}
      {variant === 'week' && action.dueDate && (
        <span className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {format(new Date(action.dueDate), 'EEE')}
        </span>
      )}
      <ChevronRight
        size={14}
        className={clsx(
          'opacity-0 group-hover:opacity-100 transition-opacity',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}
      />
    </button>
  );
}
