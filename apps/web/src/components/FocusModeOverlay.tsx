'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  X,
  Check,
  Clock,
  Pause,
  Play,
  Flag,
  ChevronDown,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import clsx from 'clsx';

export function FocusModeOverlay() {
  const {
    isFocusMode,
    toggleFocusMode,
    selectedActionId,
    actions,
    completeAction,
    updateAction,
    theme,
  } = useAppStore();

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  const action = actions.find(a => a.id === selectedActionId);

  // Timer
  useEffect(() => {
    if (!isFocusMode || isPaused) return;

    const interval = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isFocusMode, isPaused]);

  // Reset timer when task changes
  useEffect(() => {
    setTimeElapsed(0);
    setIsPaused(false);
  }, [selectedActionId]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (action) {
      await completeAction(action.id);
      toggleFocusMode();
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isFocusMode || !action) return null;

  const progress = action.estimatedMinutes
    ? Math.min((timeElapsed / 60) / action.estimatedMinutes * 100, 100)
    : 0;

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex flex-col items-center justify-center',
      'transition-all duration-500',
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-omnifocus-bg to-gray-900'
        : 'bg-gradient-to-br from-white via-gray-50 to-white'
    )}>
      {/* Ambient background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={clsx(
          'absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse',
          theme === 'dark' ? 'bg-omnifocus-purple' : 'bg-purple-300'
        )} />
        <div className={clsx(
          'absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse',
          'animation-delay-1000',
          theme === 'dark' ? 'bg-blue-500' : 'bg-blue-300'
        )} />
      </div>

      {/* Header controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <button
          onClick={toggleFullscreen}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          )}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAmbientSound(!ambientSound)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              ambientSound
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : theme === 'dark'
                  ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            )}
            title={ambientSound ? 'Disable ambient sound' : 'Enable ambient sound'}
          >
            {ambientSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={toggleFocusMode}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              theme === 'dark'
                ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
            )}
            title="Exit focus mode"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-8 text-center">
        {/* Task title */}
        <h1 className={clsx(
          'text-3xl md:text-4xl font-bold mb-4',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {action.title}
        </h1>

        {/* Task metadata */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {action.flagged && (
            <span className="flex items-center gap-1 text-omnifocus-orange">
              <Flag size={16} />
              Flagged
            </span>
          )}
          {action.estimatedMinutes && (
            <span className={clsx(
              'flex items-center gap-1',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              <Clock size={16} />
              {action.estimatedMinutes}m estimated
            </span>
          )}
          {action.project && (
            <span className={clsx(
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {action.project.name}
            </span>
          )}
        </div>

        {/* Timer display */}
        <div className="mb-8">
          <div className={clsx(
            'text-6xl md:text-8xl font-mono font-bold mb-4',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {formatTime(timeElapsed)}
          </div>

          {/* Progress bar (if estimated time exists) */}
          {action.estimatedMinutes && (
            <div className="w-full max-w-md mx-auto">
              <div className={clsx(
                'h-2 rounded-full overflow-hidden',
                theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
              )}>
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    progress >= 100 ? 'bg-green-500' : 'bg-omnifocus-purple'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={clsx(
                'text-sm mt-2',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {progress >= 100
                  ? 'Time exceeded!'
                  : `${Math.round(progress)}% of estimated time`
                }
              </p>
            </div>
          )}
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl transition-colors',
              isPaused
                ? 'bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-white hover:bg-omnifocus-border'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            )}
          >
            {isPaused ? (
              <>
                <Play size={20} />
                Resume
              </>
            ) : (
              <>
                <Pause size={20} />
                Pause
              </>
            )}
          </button>

          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Check size={20} />
            Complete
          </button>
        </div>

        {/* Notes toggle */}
        {action.note && (
          <div className="mt-8">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={clsx(
                'flex items-center gap-2 mx-auto text-sm',
                theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <ChevronDown
                size={16}
                className={clsx('transition-transform', showNotes && 'rotate-180')}
              />
              {showNotes ? 'Hide notes' : 'Show notes'}
            </button>

            {showNotes && (
              <div className={clsx(
                'mt-4 p-4 rounded-lg text-left max-w-md mx-auto',
                theme === 'dark' ? 'bg-omnifocus-surface text-gray-300' : 'bg-gray-100 text-gray-700'
              )}>
                <p className="whitespace-pre-wrap text-sm">{action.note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className={clsx(
        'absolute bottom-4 text-xs',
        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
      )}>
        Press <kbd className={clsx(
          'px-1.5 py-0.5 rounded mx-1',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
        )}>Space</kbd> to {isPaused ? 'resume' : 'pause'}
        <span className="mx-2">·</span>
        Press <kbd className={clsx(
          'px-1.5 py-0.5 rounded mx-1',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
        )}>Enter</kbd> to complete
        <span className="mx-2">·</span>
        Press <kbd className={clsx(
          'px-1.5 py-0.5 rounded mx-1',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-200'
        )}>Esc</kbd> to exit
      </div>
    </div>
  );
}
