'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore, Project, Action } from '@/stores/app.store';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FolderKanban,
  Flag,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';

interface WeeklyReviewFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReviewStep =
  | 'intro'
  | 'inbox-zero'
  | 'review-projects'
  | 'review-flagged'
  | 'review-calendar'
  | 'set-priorities'
  | 'complete';

const REVIEW_STEPS: ReviewStep[] = [
  'intro',
  'inbox-zero',
  'review-projects',
  'review-flagged',
  'review-calendar',
  'set-priorities',
  'complete',
];

export function WeeklyReviewFlow({ isOpen, onClose }: WeeklyReviewFlowProps) {
  const { theme, actions, projects, setCurrentPerspective, setSelectedProject, setSelectedAction } = useAppStore();
  const [currentStep, setCurrentStep] = useState<ReviewStep>('intro');
  const [reviewedProjects, setReviewedProjects] = useState<Set<string>>(new Set());

  const stepIndex = REVIEW_STEPS.indexOf(currentStep);

  // Calculate stats
  const inboxCount = useMemo(() =>
    actions.filter(a => !a.projectId && a.status === 'active').length,
    [actions]
  );

  const activeProjects = useMemo(() =>
    projects.filter(p => p.status === 'active'),
    [projects]
  );

  const flaggedActions = useMemo(() =>
    actions.filter(a => a.flagged && a.status === 'active'),
    [actions]
  );

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const actionsThisWeek = useMemo(() =>
    actions.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
    }),
    [actions, weekStart, weekEnd]
  );

  const completedLastWeek = useMemo(() => {
    const lastWeekEnd = subDays(weekStart, 1);
    const lastWeekStart = subDays(weekStart, 7);
    return actions.filter(a => {
      if (!a.completedAt) return false;
      const completedDate = new Date(a.completedAt);
      return isWithinInterval(completedDate, { start: lastWeekStart, end: lastWeekEnd });
    });
  }, [actions, weekStart]);

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < REVIEW_STEPS.length) {
      setCurrentStep(REVIEW_STEPS[nextIndex]);
    }
  };

  const handlePrev = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(REVIEW_STEPS[prevIndex]);
    }
  };

  const handleProjectReviewed = (projectId: string) => {
    setReviewedProjects(prev => new Set([...prev, projectId]));
  };

  const goToInbox = () => {
    setCurrentPerspective('inbox');
    onClose();
  };

  const goToProject = (projectId: string) => {
    setSelectedProject(projectId);
    onClose();
  };

  const goToFlagged = () => {
    setCurrentPerspective('flagged');
    onClose();
  };

  const goToForecast = () => {
    setCurrentPerspective('forecast');
    onClose();
  };

  const resetReview = () => {
    setCurrentStep('intro');
    setReviewedProjects(new Set());
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="text-center py-8">
            <div className={clsx(
              'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center',
              theme === 'dark' ? 'bg-omnifocus-purple/20' : 'bg-purple-50'
            )}>
              <RefreshCw size={40} className="text-omnifocus-purple" />
            </div>
            <h3 className={clsx(
              'text-2xl font-bold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Weekly Review
            </h3>
            <p className={clsx(
              'text-sm mb-6 max-w-md mx-auto',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              The weekly review is the critical factor for GTD success. Take 30-60 minutes to get clear, current, creative, and ready for the week ahead.
            </p>

            {/* Last week stats */}
            <div className={clsx(
              'p-4 rounded-lg mb-6 max-w-sm mx-auto',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
            )}>
              <h4 className={clsx(
                'text-xs font-semibold uppercase tracking-wider mb-3',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Last Week
              </h4>
              <div className="flex items-center justify-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                <span className={clsx(
                  'text-2xl font-bold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {completedLastWeek.length}
                </span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                  actions completed
                </span>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
            >
              <span>Start Review</span>
              <ArrowRight size={18} />
            </button>
          </div>
        );

      case 'inbox-zero':
        return (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'
              )}>
                <Inbox size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Get Inbox to Zero
                </h3>
                <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  Process each item: Do it, delegate it, defer it, or delete it
                </p>
              </div>
            </div>

            <div className={clsx(
              'p-4 rounded-lg text-center',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
            )}>
              <p className={clsx(
                'text-4xl font-bold mb-2',
                inboxCount === 0 ? 'text-green-500' : theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {inboxCount}
              </p>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                items in inbox
              </p>
            </div>

            {inboxCount > 0 ? (
              <button
                onClick={goToInbox}
                className="w-full mt-4 py-3 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
              >
                Go to Inbox
              </button>
            ) : (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
                <CheckCircle2 size={20} />
                <span className="font-medium">Inbox is empty!</span>
              </div>
            )}
          </div>
        );

      case 'review-projects':
        return (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'
              )}>
                <FolderKanban size={20} className="text-purple-500" />
              </div>
              <div>
                <h3 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Review Projects
                </h3>
                <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  Ensure each project has a clear next action
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeProjects.map(project => (
                <div
                  key={project.id}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg',
                    theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {reviewedProjects.has(project.id) ? (
                      <CheckCircle2 size={18} className="text-green-500" />
                    ) : (
                      <div className={clsx(
                        'w-4 h-4 rounded-full border-2',
                        theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                      )} />
                    )}
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToProject(project.id)}
                      className={clsx(
                        'px-2 py-1 rounded text-xs',
                        theme === 'dark'
                          ? 'bg-omnifocus-bg text-gray-400 hover:text-white'
                          : 'bg-gray-200 text-gray-500 hover:text-gray-900'
                      )}
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleProjectReviewed(project.id)}
                      className={clsx(
                        'px-2 py-1 rounded text-xs',
                        reviewedProjects.has(project.id)
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-omnifocus-purple/20 text-omnifocus-purple'
                      )}
                    >
                      {reviewedProjects.has(project.id) ? 'Reviewed' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {reviewedProjects.size === activeProjects.length && activeProjects.length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-500">
                <CheckCircle2 size={20} />
                <span className="font-medium">All projects reviewed!</span>
              </div>
            )}
          </div>
        );

      case 'review-flagged':
        return (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-omnifocus-orange/20' : 'bg-orange-50'
              )}>
                <Flag size={20} className="text-omnifocus-orange" />
              </div>
              <div>
                <h3 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Review Flagged Items
                </h3>
                <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  Are these still your priorities?
                </p>
              </div>
            </div>

            <div className={clsx(
              'p-4 rounded-lg text-center',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
            )}>
              <p className={clsx(
                'text-4xl font-bold mb-2',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {flaggedActions.length}
              </p>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                flagged actions
              </p>
            </div>

            {flaggedActions.length > 0 && (
              <button
                onClick={goToFlagged}
                className="w-full mt-4 py-3 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
              >
                Review Flagged
              </button>
            )}
          </div>
        );

      case 'review-calendar':
        return (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'
              )}>
                <Calendar size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Review Calendar
                </h3>
                <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  Check upcoming due dates for the week
                </p>
              </div>
            </div>

            <div className={clsx(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
            )}>
              <p className={clsx(
                'text-sm mb-2',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </p>
              <p className={clsx(
                'text-4xl font-bold mb-2',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {actionsThisWeek.length}
              </p>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                actions due this week
              </p>
            </div>

            <button
              onClick={goToForecast}
              className="w-full mt-4 py-3 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
            >
              View Forecast
            </button>
          </div>
        );

      case 'set-priorities':
        return (
          <div className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-50'
              )}>
                <Sparkles size={20} className="text-yellow-500" />
              </div>
              <div>
                <h3 className={clsx(
                  'text-lg font-semibold',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  Set Priorities
                </h3>
                <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                  What are the 3-5 most important things for this week?
                </p>
              </div>
            </div>

            <div className={clsx(
              'p-4 rounded-lg',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-50'
            )}>
              <p className={clsx(
                'text-sm mb-4',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Flag the actions that must get done this week. Be realistic - less is more.
              </p>
              <ul className="space-y-2 text-sm">
                <li className={clsx('flex items-start gap-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                  <span className="text-omnifocus-orange mt-0.5">1.</span>
                  <span>Choose 3-5 must-do items</span>
                </li>
                <li className={clsx('flex items-start gap-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                  <span className="text-omnifocus-orange mt-0.5">2.</span>
                  <span>Flag them for easy access</span>
                </li>
                <li className={clsx('flex items-start gap-2', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
                  <span className="text-omnifocus-orange mt-0.5">3.</span>
                  <span>Set realistic due dates</span>
                </li>
              </ul>
            </div>

            <button
              onClick={goToFlagged}
              className="w-full mt-4 py-3 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
            >
              Set Priorities Now
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className={clsx(
              'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center',
              theme === 'dark' ? 'bg-green-500/20' : 'bg-green-50'
            )}>
              <Trophy size={40} className="text-green-500" />
            </div>
            <h3 className={clsx(
              'text-2xl font-bold mb-3',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Review Complete!
            </h3>
            <p className={clsx(
              'text-sm mb-6 max-w-md mx-auto',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Great job! You&apos;re ready for a productive week. Remember to check back next week.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={resetReview}
                className={clsx(
                  'px-4 py-2 rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'bg-omnifocus-surface text-gray-300 hover:text-white'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                )}
              >
                Start Over
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={clsx(
        'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'w-[90%] max-w-lg rounded-2xl shadow-2xl',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border border-omnifocus-border'
          : 'bg-white border border-gray-200'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {REVIEW_STEPS.map((step, i) => (
              <div
                key={step}
                className={clsx(
                  'w-2 h-2 rounded-full transition-colors',
                  i <= stepIndex
                    ? 'bg-omnifocus-purple'
                    : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                )}
              />
            ))}
          </div>

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

        {/* Content */}
        <div className="px-6">
          {renderStepContent()}
        </div>

        {/* Footer navigation */}
        {currentStep !== 'intro' && currentStep !== 'complete' && (
          <div className={clsx(
            'flex items-center justify-between px-4 py-3 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <button
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
