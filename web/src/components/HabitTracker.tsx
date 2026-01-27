'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Target,
  CheckCircle2,
  Circle,
  Plus,
  X,
  Trash2,
  TrendingUp,
  Calendar,
  Flame,
} from 'lucide-react';
import {
  format,
  subDays,
  isSameDay,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import clsx from 'clsx';

interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  targetDays?: number[]; // For weekly: 0-6 (Sun-Sat)
  createdAt: string;
  completions: string[]; // Array of ISO date strings
}

const HABITS_STORAGE_KEY = 'omnifocus-habits';

interface HabitTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HabitTracker({ isOpen, onClose }: HabitTrackerProps) {
  const { theme } = useAppStore();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load habits from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HABITS_STORAGE_KEY);
      if (saved) {
        try {
          setHabits(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load habits:', e);
        }
      }
    }
  }, []);

  // Save habits to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && habits.length > 0) {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    }
  }, [habits]);

  const today = startOfDay(new Date());
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  }, [today]);

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      name: newHabitName.trim(),
      frequency: 'daily',
      createdAt: new Date().toISOString(),
      completions: [],
    };

    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddForm(false);
  };

  const toggleCompletion = (habitId: string, date: Date) => {
    setHabits(habits.map(habit => {
      if (habit.id !== habitId) return habit;

      const dateStr = format(date, 'yyyy-MM-dd');
      const isCompleted = habit.completions.includes(dateStr);

      return {
        ...habit,
        completions: isCompleted
          ? habit.completions.filter(d => d !== dateStr)
          : [...habit.completions, dateStr],
      };
    }));
  };

  const deleteHabit = (habitId: string) => {
    if (confirm('Delete this habit?')) {
      setHabits(habits.filter(h => h.id !== habitId));
    }
  };

  const getStreak = (habit: Habit): number => {
    let streak = 0;
    let checkDate = today;

    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (habit.completions.includes(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (isSameDay(checkDate, today)) {
        // Today hasn't been completed yet, check yesterday
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getCompletionRate = (habit: Habit): number => {
    const daysActive = Math.min(
      differenceInDays(today, new Date(habit.createdAt)) + 1,
      30
    );
    const completionsInPeriod = habit.completions.filter(d => {
      const date = new Date(d);
      return differenceInDays(today, date) < daysActive;
    }).length;
    return Math.round((completionsInPeriod / daysActive) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx(
        'relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
        'animate-in zoom-in-95 duration-200',
        theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-6 py-4 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Target size={24} className="text-green-500" />
            <h2 className={clsx(
              'text-xl font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Habit Tracker
            </h2>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {habits.length === 0 && !showAddForm ? (
            <div className="text-center py-12">
              <Target size={48} className={clsx(
                'mx-auto mb-4',
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              )} />
              <p className={clsx(
                'text-lg font-medium mb-2',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                No habits yet
              </p>
              <p className={clsx(
                'text-sm mb-4',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Start tracking your daily habits to build consistency
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Plus size={18} />
                Add First Habit
              </button>
            </div>
          ) : (
            <>
              {/* Week header */}
              <div className={clsx(
                'flex items-center gap-2 mb-6 pb-3 border-b',
                theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
              )}>
                <div className="w-40" />
                {last7Days.map(day => (
                  <div
                    key={day.toISOString()}
                    className={clsx(
                      'flex-1 text-center text-xs',
                      isSameDay(day, today)
                        ? 'text-omnifocus-purple font-semibold'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div className={isSameDay(day, today) ? 'text-omnifocus-purple' : ''}>{format(day, 'd')}</div>
                  </div>
                ))}
                <div className="w-20 text-center text-xs text-gray-500">Stats</div>
              </div>

              {/* Habits list */}
              <div className="space-y-4">
                {habits.map(habit => {
                  const streak = getStreak(habit);
                  const rate = getCompletionRate(habit);

                  return (
                    <div
                      key={habit.id}
                      className={clsx(
                        'flex items-center gap-2 p-3 rounded-lg',
                        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
                      )}
                    >
                      <div className="w-40 flex items-center gap-2">
                        <span className={clsx(
                          'text-sm font-medium truncate',
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        )}>
                          {habit.name}
                        </span>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className={clsx(
                            'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                            theme === 'dark'
                              ? 'text-gray-500 hover:text-red-400'
                              : 'text-gray-400 hover:text-red-500'
                          )}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Day checkboxes */}
                      {last7Days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = habit.completions.includes(dateStr);

                        return (
                          <button
                            key={dateStr}
                            onClick={() => toggleCompletion(habit.id, day)}
                            className={clsx(
                              'flex-1 flex items-center justify-center p-2 rounded-lg transition-colors',
                              isCompleted
                                ? 'bg-green-500/20 text-green-500'
                                : theme === 'dark'
                                  ? 'hover:bg-omnifocus-bg text-gray-600'
                                  : 'hover:bg-gray-100 text-gray-300'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={20} />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>
                        );
                      })}

                      {/* Stats */}
                      <div className="w-20 flex flex-col items-center gap-1">
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs text-orange-400">
                            <Flame size={12} />
                            {streak}
                          </div>
                        )}
                        <div className={clsx(
                          'text-xs',
                          rate >= 80 ? 'text-green-500' :
                          rate >= 50 ? 'text-yellow-500' :
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )}>
                          {rate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add habit form */}
              {showAddForm ? (
                <div className={clsx(
                  'mt-4 p-4 rounded-lg border',
                  theme === 'dark'
                    ? 'bg-omnifocus-bg border-omnifocus-border'
                    : 'bg-white border-gray-200'
                )}>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addHabit();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewHabitName('');
                      }
                    }}
                    placeholder="Habit name (e.g., Meditate, Exercise)"
                    autoFocus
                    className={clsx(
                      'w-full px-3 py-2 rounded-lg border mb-3',
                      theme === 'dark'
                        ? 'bg-omnifocus-surface border-omnifocus-border text-white placeholder-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewHabitName('');
                      }}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-sm',
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-500 hover:text-gray-900'
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addHabit}
                      disabled={!newHabitName.trim()}
                      className="px-3 py-1.5 rounded-lg text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Add Habit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className={clsx(
                    'mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors',
                    theme === 'dark'
                      ? 'border-omnifocus-border text-gray-500 hover:border-green-500 hover:text-green-500'
                      : 'border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500'
                  )}
                >
                  <Plus size={18} />
                  Add New Habit
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
