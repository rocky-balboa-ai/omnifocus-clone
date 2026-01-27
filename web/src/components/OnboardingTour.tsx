'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Inbox,
  FolderKanban,
  Calendar,
  Flag,
  Target,
  Keyboard,
  Sun,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

const ONBOARDING_KEY = 'omnifocus-onboarding-complete';

const STEPS = [
  {
    title: 'Welcome to OmniFocus Clone',
    description: 'A powerful task management app inspired by OmniFocus. Let\'s take a quick tour of the key features.',
    icon: Sparkles,
    color: 'text-omnifocus-purple',
  },
  {
    title: 'Inbox - Capture Everything',
    description: 'The Inbox is where new tasks land. Capture ideas quickly, then organize them later into projects.',
    icon: Inbox,
    color: 'text-blue-500',
  },
  {
    title: 'Projects - Organize Your Work',
    description: 'Group related tasks into projects. Use sequential or parallel types to control task availability.',
    icon: FolderKanban,
    color: 'text-purple-500',
  },
  {
    title: 'Forecast - Plan Ahead',
    description: 'See your tasks laid out on a calendar. Know what\'s coming up and never miss a deadline.',
    icon: Calendar,
    color: 'text-orange-500',
  },
  {
    title: 'Flagged - Priority Items',
    description: 'Flag important tasks to quickly access them. Perfect for items that need your attention now.',
    icon: Flag,
    color: 'text-omnifocus-orange',
  },
  {
    title: 'Today - Your Daily Focus',
    description: 'The Today view shows what\'s overdue, due today, and flagged items. Start your day here.',
    icon: Sun,
    color: 'text-yellow-500',
  },
  {
    title: 'Keyboard Shortcuts',
    description: 'Power users love keyboard shortcuts. Press ? at any time to see all available shortcuts.',
    icon: Keyboard,
    color: 'text-green-500',
  },
  {
    title: 'You\'re Ready!',
    description: 'That\'s the basics. Press N to add your first task, or explore the sidebar to get started.',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
];

export function OnboardingTour() {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if onboarding has been completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      if (!completed) {
        // Small delay for better UX
        setTimeout(() => setIsOpen(true), 500);
      }
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className={clsx(
        'relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden',
        'animate-in zoom-in-95 duration-300',
        theme === 'dark' ? 'bg-omnifocus-sidebar' : 'bg-white'
      )}>
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className={clsx(
            'absolute top-4 right-4 p-2 rounded-full transition-colors z-10',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          )}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className={clsx(
            'w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center',
            theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
          )}>
            <Icon size={40} className={step.color} />
          </div>

          {/* Title */}
          <h2 className={clsx(
            'text-2xl font-bold mb-3',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {step.title}
          </h2>

          {/* Description */}
          <p className={clsx(
            'text-base mb-8',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentStep
                    ? 'w-6 bg-omnifocus-purple'
                    : index < currentStep
                      ? 'bg-omnifocus-purple/50'
                      : theme === 'dark'
                        ? 'bg-omnifocus-border'
                        : 'bg-gray-200'
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={clsx(
                'flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors',
                currentStep === 0
                  ? 'opacity-0 cursor-default'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <button
              onClick={handleSkip}
              className={clsx(
                'text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              Skip tour
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 transition-colors"
            >
              {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reset onboarding (for testing or re-watching)
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}
