'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Clock,
  Calendar,
  Target,
  Flame,
  TrendingUp,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  subDays,
  differenceInMinutes,
} from 'date-fns';
import clsx from 'clsx';

interface FocusSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  taskId?: string;
  taskTitle?: string;
  completed: boolean;
  breaks: number;
}

const STORAGE_KEY = 'omnifocus-focus-sessions';

// Hook for managing focus session history
export function useFocusSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        setSessions([]);
      }
    }
  }, []);

  // Save to localStorage
  const saveSessions = (newSessions: FocusSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  };

  const addSession = (session: Omit<FocusSession, 'id'>) => {
    const newSession: FocusSession = {
      ...session,
      id: Math.random().toString(36).substr(2, 9),
    };
    saveSessions([newSession, ...sessions]);
    return newSession;
  };

  const clearHistory = () => {
    saveSessions([]);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    const todaySessions = sessions.filter(s => isSameDay(new Date(s.startTime), today));
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekSessions = sessions.filter(s => new Date(s.startTime) >= weekStart);

    const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const totalMinutesWeek = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const completedToday = todaySessions.filter(s => s.completed).length;
    const totalSessionsToday = todaySessions.length;

    // Calculate streak
    let streak = 0;
    let checkDate = today;
    while (true) {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.startTime), checkDate));
      if (daySessions.length > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return {
      totalMinutesToday,
      totalMinutesWeek,
      completedToday,
      totalSessionsToday,
      streak,
      averageSessionLength: weekSessions.length > 0
        ? Math.round(totalMinutesWeek / weekSessions.length)
        : 0,
    };
  }, [sessions]);

  return {
    sessions,
    addSession,
    clearHistory,
    stats,
  };
}

// Focus Session History Panel
interface FocusSessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FocusSessionHistory({ isOpen, onClose }: FocusSessionHistoryProps) {
  const { theme } = useAppStore();
  const { sessions, stats, clearHistory } = useFocusSessions();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get sessions for selected date
  const selectedDateSessions = useMemo(() => {
    return sessions.filter(s => isSameDay(new Date(s.startTime), selectedDate));
  }, [sessions, selectedDate]);

  // Get week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    const end = endOfWeek(new Date(), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, []);

  // Get daily totals for week
  const dailyTotals = useMemo(() => {
    return weekDays.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.startTime), day));
      return daySessions.reduce((sum, s) => sum + s.duration, 0);
    });
  }, [weekDays, sessions]);

  const maxMinutes = Math.max(...dailyTotals, 60); // At least 60 min scale

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
        'relative w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl border overflow-hidden',
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
          <div className="flex items-center gap-3">
            <Clock className="text-omnifocus-purple" size={24} />
            <h2 className={clsx(
              'text-lg font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Focus Session History
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

        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Stats cards */}
          <div className="p-6 grid grid-cols-4 gap-4">
            <StatCard
              icon={<Clock size={20} />}
              label="Today"
              value={`${stats.totalMinutesToday}m`}
              theme={theme}
            />
            <StatCard
              icon={<Calendar size={20} />}
              label="This Week"
              value={`${Math.round(stats.totalMinutesWeek / 60)}h`}
              theme={theme}
            />
            <StatCard
              icon={<Flame size={20} />}
              label="Streak"
              value={`${stats.streak} days`}
              theme={theme}
            />
            <StatCard
              icon={<Target size={20} />}
              label="Avg Session"
              value={`${stats.averageSessionLength}m`}
              theme={theme}
            />
          </div>

          {/* Week chart */}
          <div className={clsx(
            'mx-6 p-4 rounded-xl',
            theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
          )}>
            <h3 className={clsx(
              'text-sm font-medium mb-4',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              This Week
            </h3>
            <div className="flex items-end justify-between gap-2 h-32">
              {weekDays.map((day, i) => {
                const height = maxMinutes > 0 ? (dailyTotals[i] / maxMinutes) * 100 : 0;
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDay = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="relative w-full flex-1 flex items-end justify-center">
                      <div
                        className={clsx(
                          'w-full max-w-8 rounded-t transition-all',
                          isSelected
                            ? 'bg-omnifocus-purple'
                            : isTodayDay
                              ? 'bg-omnifocus-purple/60'
                              : theme === 'dark'
                                ? 'bg-omnifocus-bg'
                                : 'bg-gray-300'
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className={clsx(
                      'text-xs',
                      isSelected
                        ? 'text-omnifocus-purple font-medium'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {format(day, 'EEE')}
                    </span>
                    <span className={clsx(
                      'text-[10px]',
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    )}>
                      {dailyTotals[i]}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day sessions */}
          <div className="p-6">
            <h3 className={clsx(
              'text-sm font-medium mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
              <span className={clsx(
                'ml-2 text-xs font-normal',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {selectedDateSessions.length} sessions
              </span>
            </h3>

            {selectedDateSessions.length === 0 ? (
              <p className={clsx(
                'text-sm text-center py-8',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                No focus sessions on this day
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateSessions.map(session => (
                  <SessionItem key={session.id} session={session} theme={theme} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat card
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  theme: 'light' | 'dark';
}

function StatCard({ icon, label, value, theme }: StatCardProps) {
  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
    )}>
      <div className={clsx(
        'mb-2',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      )}>
        {icon}
      </div>
      <p className={clsx(
        'text-2xl font-bold',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {value}
      </p>
      <p className={clsx(
        'text-xs',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        {label}
      </p>
    </div>
  );
}

// Session item
interface SessionItemProps {
  session: FocusSession;
  theme: 'light' | 'dark';
}

function SessionItem({ session, theme }: SessionItemProps) {
  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 rounded-lg',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
    )}>
      <div className={clsx(
        'w-10 h-10 rounded-full flex items-center justify-center',
        session.completed
          ? 'bg-green-500/20 text-green-500'
          : 'bg-yellow-500/20 text-yellow-500'
      )}>
        {session.completed ? <Target size={18} /> : <Pause size={18} />}
      </div>

      <div className="flex-1">
        <p className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {session.taskTitle || 'Focus Session'}
        </p>
        <p className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
        </p>
      </div>

      <div className="text-right">
        <p className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {session.duration}m
        </p>
        {session.breaks > 0 && (
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {session.breaks} break{session.breaks > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// Mini focus stats widget for sidebar
export function FocusStatsWidget({ className }: { className?: string }) {
  const { theme } = useAppStore();
  const { stats } = useFocusSessions();

  return (
    <div className={clsx(
      'p-3 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={clsx(
          'text-xs font-medium',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          Focus Today
        </span>
        <Flame size={14} className="text-omnifocus-orange" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={clsx(
            'text-2xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.totalMinutesToday}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            minutes
          </p>
        </div>
        <div className="text-right">
          <p className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-omnifocus-orange' : 'text-omnifocus-orange'
          )}>
            {stats.streak} day streak
          </p>
        </div>
      </div>
    </div>
  );
}
