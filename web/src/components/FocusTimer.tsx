'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Play, Pause, RotateCcw, X, Coffee, Zap, Settings2 } from 'lucide-react';
import clsx from 'clsx';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimerMode = 'focus' | 'short-break' | 'long-break';

const DEFAULT_DURATIONS = {
  focus: 25 * 60,        // 25 minutes
  'short-break': 5 * 60, // 5 minutes
  'long-break': 15 * 60, // 15 minutes
};

export function FocusTimer({ isOpen, onClose }: FocusTimerProps) {
  const { theme, selectedActionId, actions } = useAppStore();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedAction = selectedActionId ? actions.find(a => a.id === selectedActionId) : null;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer completed
      setIsRunning(false);
      playNotification();

      if (mode === 'focus') {
        const newSessions = sessionsCompleted + 1;
        setSessionsCompleted(newSessions);

        // After 4 focus sessions, suggest a long break
        if (newSessions % 4 === 0) {
          setMode('long-break');
          setTimeLeft(durations['long-break']);
        } else {
          setMode('short-break');
          setTimeLeft(durations['short-break']);
        }
      } else {
        // Break completed, back to focus
        setMode('focus');
        setTimeLeft(durations.focus);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, sessionsCompleted, durations]);

  const playNotification = () => {
    // Play a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // Audio not available
    }

    // Also try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? 'Focus session complete!' : 'Break time over!', {
        body: mode === 'focus' ? 'Time for a break!' : 'Ready to focus again?',
        icon: '/favicon.ico',
      });
    }
  };

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestNotificationPermission();
    }
  }, [isOpen, requestNotificationPermission]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const handleReset = () => {
    setTimeLeft(durations[mode]);
    setIsRunning(false);
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Timer Modal */}
      <div className={clsx(
        'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'w-[90%] max-w-md rounded-2xl shadow-2xl',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border border-omnifocus-border'
          : 'bg-white border border-gray-200'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-omnifocus-purple" />
            <h2 className={clsx('text-lg font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Focus Timer
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={onClose}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'hover:bg-omnifocus-surface text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className={clsx(
          'flex p-2 gap-1 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          {[
            { id: 'focus' as const, label: 'Focus', icon: Zap },
            { id: 'short-break' as const, label: 'Short Break', icon: Coffee },
            { id: 'long-break' as const, label: 'Long Break', icon: Coffee },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                mode === id
                  ? 'bg-omnifocus-purple text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="p-8">
          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke={theme === 'dark' ? '#3f3f5c' : '#e5e7eb'}
                strokeWidth="8"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke={mode === 'focus' ? '#8B5CF6' : '#10B981'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={clsx(
                'text-5xl font-mono font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {formatTime(timeLeft)}
              </span>
              <span className={clsx(
                'text-sm mt-1',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {mode === 'focus' ? 'Focus Time' : mode === 'short-break' ? 'Short Break' : 'Long Break'}
              </span>
            </div>
          </div>

          {/* Current Task */}
          {selectedAction && mode === 'focus' && (
            <div className={clsx(
              'mb-6 p-3 rounded-lg text-center',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
            )}>
              <p className={clsx('text-xs mb-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                Working on:
              </p>
              <p className={clsx('text-sm font-medium truncate', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                {selectedAction.title}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className={clsx(
                'p-3 rounded-full transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              )}
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={clsx(
                'p-4 rounded-full transition-colors',
                mode === 'focus' ? 'bg-omnifocus-purple' : 'bg-green-500',
                'text-white hover:opacity-90'
              )}
            >
              {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-0.5" />}
            </button>
            <div className={clsx(
              'p-3 rounded-full',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
            )}>
              <span className={clsx(
                'text-sm font-medium',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              )}>
                {sessionsCompleted}
              </span>
            </div>
          </div>

          {/* Sessions Counter */}
          <p className={clsx(
            'text-center text-xs mt-4',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {sessionsCompleted} focus session{sessionsCompleted !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={clsx(
            'border-t p-4 space-y-3',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <h3 className={clsx(
              'text-sm font-medium',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Timer Durations
            </h3>
            {[
              { id: 'focus' as const, label: 'Focus' },
              { id: 'short-break' as const, label: 'Short Break' },
              { id: 'long-break' as const, label: 'Long Break' },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center justify-between gap-4">
                <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                  {label}
                </span>
                <select
                  value={durations[id] / 60}
                  onChange={(e) => {
                    const newDurations = { ...durations, [id]: parseInt(e.target.value) * 60 };
                    setDurations(newDurations);
                    if (mode === id && !isRunning) {
                      setTimeLeft(newDurations[id]);
                    }
                  }}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg border-omnifocus-border text-white'
                      : 'bg-white border-gray-200 text-gray-900',
                    'border'
                  )}
                >
                  {[5, 10, 15, 20, 25, 30, 45, 60].map(mins => (
                    <option key={mins} value={mins}>{mins} min</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
