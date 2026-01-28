'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Play, Pause, RotateCcw, Bell, BellOff } from 'lucide-react';
import clsx from 'clsx';

interface CountdownTimerProps {
  initialMinutes?: number;
  onComplete?: () => void;
  autoStart?: boolean;
  showControls?: boolean;
  showPresets?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CountdownTimer({
  initialMinutes = 25,
  onComplete,
  autoStart = false,
  showControls = true,
  showPresets = false,
  size = 'md',
  className,
}: CountdownTimerProps) {
  const { theme } = useAppStore();
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Presets
  const presets = [
    { label: '5m', minutes: 5 },
    { label: '15m', minutes: 15 },
    { label: '25m', minutes: 25 },
    { label: '45m', minutes: 45 },
    { label: '60m', minutes: 60 },
  ];

  // Timer logic
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Play sound
          if (soundEnabled) {
            try {
              const audio = new Audio('/sounds/timer-complete.mp3');
              audio.play().catch(() => {});
            } catch {}
          }
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, soundEnabled, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
  };

  const handlePreset = (minutes: number) => {
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
  };

  const sizeConfig = {
    sm: { timer: 'text-3xl', ring: 100, stroke: 6 },
    md: { timer: 'text-5xl', ring: 160, stroke: 8 },
    lg: { timer: 'text-7xl', ring: 220, stroke: 10 },
  };

  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      {/* Timer ring */}
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg
          className="transform -rotate-90"
          width={config.ring}
          height={config.ring}
        >
          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            strokeWidth={config.stroke}
            fill="none"
            className={theme === 'dark' ? 'stroke-omnifocus-surface' : 'stroke-gray-200'}
          />
          {/* Progress circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            className="stroke-omnifocus-purple transition-all duration-1000"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx(
            'font-mono font-bold tabular-nums',
            config.timer,
            remainingSeconds < 60
              ? 'text-red-500'
              : theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {formatTime(remainingSeconds)}
          </span>
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="flex items-center gap-2 mt-4">
          {presets.map(preset => (
            <button
              key={preset.minutes}
              onClick={() => handlePreset(preset.minutes)}
              className={clsx(
                'px-3 py-1 text-sm rounded-full transition-colors',
                totalSeconds === preset.minutes * 60
                  ? 'bg-omnifocus-purple text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-bg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="flex items-center gap-3 mt-4">
          {isRunning ? (
            <button
              onClick={handlePause}
              className={clsx(
                'p-3 rounded-full transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-bg'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              )}
            >
              <Pause size={24} />
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="p-3 rounded-full bg-omnifocus-purple text-white hover:bg-purple-600 transition-colors"
            >
              <Play size={24} />
            </button>
          )}

          <button
            onClick={handleReset}
            className={clsx(
              'p-3 rounded-full transition-colors',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-bg'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={clsx(
              'p-3 rounded-full transition-colors',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-bg'
                : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
          >
            {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}

// Compact inline timer
interface InlineTimerProps {
  minutes: number;
  onComplete?: () => void;
  className?: string;
}

export function InlineTimer({ minutes, onComplete, className }: InlineTimerProps) {
  const { theme } = useAppStore();
  const [remainingSeconds, setRemainingSeconds] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className={clsx(
          'p-1 rounded transition-colors',
          theme === 'dark'
            ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <span className={clsx(
        'text-sm font-mono tabular-nums',
        remainingSeconds < 60 ? 'text-red-500' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        {formatTime(remainingSeconds)}
      </span>
    </div>
  );
}

// Time remaining badge
interface TimeRemainingBadgeProps {
  deadline: Date;
  className?: string;
}

export function TimeRemainingBadge({ deadline, className }: TimeRemainingBadgeProps) {
  const { theme } = useAppStore();
  const [remaining, setRemaining] = useState<string>('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateRemaining = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setRemaining('Overdue');
        setUrgency('critical');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setRemaining(`${days}d`);
        setUrgency('normal');
      } else if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
        setUrgency(hours < 4 ? 'warning' : 'normal');
      } else {
        setRemaining(`${minutes}m`);
        setUrgency('critical');
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [deadline]);

  const urgencyClasses = {
    normal: theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
    warning: 'bg-yellow-500/20 text-yellow-500',
    critical: 'bg-red-500/20 text-red-500',
  };

  return (
    <span className={clsx(
      'px-2 py-0.5 text-xs font-medium rounded-full',
      urgencyClasses[urgency],
      className
    )}>
      {remaining}
    </span>
  );
}
