'use client';

import { useState, useMemo } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { estimateEnergyLevel } from './EnergyFilter';
import {
  Shuffle,
  Clock,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Play,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { isToday, isPast } from 'date-fns';
import clsx from 'clsx';

type AvailableTime = '5' | '15' | '30' | '60' | '120';
type EnergyLevel = 'low' | 'medium' | 'high' | 'any';

export function WhatsNext() {
  const { actions, theme, setSelectedAction, setFocusTimerOpen } = useAppStore();

  const [availableTime, setAvailableTime] = useState<AvailableTime>('30');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('any');
  const [refreshKey, setRefreshKey] = useState(0);

  const suggestion = useMemo(() => {
    const activeActions = actions.filter(a => a.status === 'active');

    // Priority scoring
    const scoredActions = activeActions.map(action => {
      let score = 0;

      // Overdue tasks get highest priority
      if (action.dueDate && isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate))) {
        score += 100;
      }

      // Due today
      if (action.dueDate && isToday(new Date(action.dueDate))) {
        score += 80;
      }

      // Flagged
      if (action.flagged) {
        score += 60;
      }

      // Time fit bonus
      const estimate = action.estimatedMinutes || 30;
      const available = parseInt(availableTime);
      if (estimate <= available) {
        score += 40;
        // Bonus for tasks that fit well (not too short)
        if (estimate >= available * 0.5) {
          score += 20;
        }
      } else {
        // Penalty for tasks that are too long
        score -= 20;
      }

      // Energy level match
      const taskEnergy = estimateEnergyLevel(action);
      if (energyLevel !== 'any') {
        if (taskEnergy === energyLevel) {
          score += 30;
        } else {
          score -= 10;
        }
      }

      // Add some randomness to avoid always showing the same task
      score += Math.random() * 10;

      return { action, score };
    });

    // Sort by score and return top one
    scoredActions.sort((a, b) => b.score - a.score);
    return scoredActions[0]?.action || null;
  }, [actions, availableTime, energyLevel, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const handleStart = () => {
    if (suggestion) {
      setSelectedAction(suggestion.id);
      setFocusTimerOpen(true);
    }
  };

  const timeOptions: { value: AvailableTime; label: string }[] = [
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '120', label: '2h' },
  ];

  const energyOptions: { value: EnergyLevel; label: string; icon: any }[] = [
    { value: 'any', label: 'Any', icon: Sparkles },
    { value: 'low', label: 'Low', icon: BatteryLow },
    { value: 'medium', label: 'Med', icon: BatteryMedium },
    { value: 'high', label: 'High', icon: BatteryFull },
  ];

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-gradient-to-br from-omnifocus-surface to-omnifocus-bg border-omnifocus-border'
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    )}>
      {/* Header */}
      <div className={clsx(
        'px-4 py-3 border-b',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-omnifocus-purple" />
          <span className={clsx(
            'text-sm font-medium',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            What should I work on?
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={clsx(
        'px-4 py-3 border-b flex flex-wrap gap-4',
        theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-bg/50' : 'border-gray-200 bg-gray-50/50'
      )}>
        {/* Time available */}
        <div className="flex items-center gap-2">
          <Clock size={14} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            Time:
          </span>
          <div className="flex gap-1">
            {timeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAvailableTime(opt.value)}
                className={clsx(
                  'px-2 py-0.5 rounded text-xs transition-colors',
                  availableTime === opt.value
                    ? 'bg-omnifocus-purple text-white'
                    : theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                      : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Energy level */}
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            Energy:
          </span>
          <div className="flex gap-1">
            {energyOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setEnergyLevel(value)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
                  energyLevel === value
                    ? 'bg-omnifocus-purple text-white'
                    : theme === 'dark'
                      ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                      : 'bg-white text-gray-500 hover:text-gray-900'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestion */}
      <div className="p-4">
        {suggestion ? (
          <div className="space-y-3">
            <div
              onClick={() => setSelectedAction(suggestion.id)}
              className={clsx(
                'p-3 rounded-lg cursor-pointer transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface/50 hover:bg-omnifocus-surface'
                  : 'bg-white hover:bg-gray-50 shadow-sm'
              )}
            >
              <p className={clsx(
                'text-sm font-medium',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {suggestion.title}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                {suggestion.estimatedMinutes && (
                  <span className={clsx(
                    'flex items-center gap-1',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    <Clock size={12} />
                    {suggestion.estimatedMinutes}m
                  </span>
                )}
                {suggestion.project && (
                  <span className={clsx(
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {suggestion.project.name}
                  </span>
                )}
                <span className={clsx(
                  'flex items-center gap-1',
                  estimateEnergyLevel(suggestion) === 'high'
                    ? 'text-red-400'
                    : estimateEnergyLevel(suggestion) === 'medium'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                )}>
                  {estimateEnergyLevel(suggestion) === 'high' && <BatteryFull size={12} />}
                  {estimateEnergyLevel(suggestion) === 'medium' && <BatteryMedium size={12} />}
                  {estimateEnergyLevel(suggestion) === 'low' && <BatteryLow size={12} />}
                  {estimateEnergyLevel(suggestion)} energy
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm font-medium"
              >
                <Play size={16} />
                Start Focus Session
              </button>
              <button
                onClick={handleRefresh}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface hover:bg-omnifocus-border text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                )}
                title="Get another suggestion"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className={clsx(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              No tasks match your criteria.
            </p>
            <p className={clsx(
              'text-xs mt-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Try adjusting your time or energy filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
