'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ActionList } from '@/components/ActionList';
import { ProjectList } from '@/components/ProjectList';
import { TagList } from '@/components/TagList';
import { ForecastList } from '@/components/ForecastList';
import { FlaggedList } from '@/components/FlaggedList';
import { ReviewList } from '@/components/ReviewList';
import { TodayDashboard } from '@/components/TodayDashboard';
import { StatsDashboard } from '@/components/StatsDashboard';
import { BottomNav } from '@/components/BottomNav';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { TaskDetailPanel } from '@/components/TaskDetailPanel';
import { QuickEntryForm } from '@/components/QuickEntryForm';
import { SearchCommand } from '@/components/SearchCommand';
import { ProjectDetailPanel } from '@/components/ProjectDetailPanel';
import { PerspectiveEditor } from '@/components/PerspectiveEditor';
import { SettingsPanel } from '@/components/SettingsPanel';
import { UndoToast } from '@/components/UndoToast';
import { NotificationService, NotificationPrompt } from '@/components/NotificationService';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { FocusTimer } from '@/components/FocusTimer';
import { WeeklyReviewFlow } from '@/components/WeeklyReviewFlow';
import { KeyboardHintBar } from '@/components/KeyboardHintBar';
import { Scratchpad } from '@/components/Scratchpad';
import { BatchActionsBar } from '@/components/BatchActionsBar';
import { FocusModeOverlay } from '@/components/FocusModeOverlay';
import { FocusBar } from '@/components/FocusBar';
import { MorningBriefing } from '@/components/MorningBriefing';
import { EndOfDaySummary } from '@/components/EndOfDaySummary';
import { HabitTracker } from '@/components/HabitTracker';
import { TimeBlocker } from '@/components/TimeBlocker';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { OnboardingTour } from '@/components/OnboardingTour';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickOpen } from '@/components/QuickOpen';
import { ToastProvider } from '@/components/Toast';
import { ConfettiProvider } from '@/components/Confetti';
import { KeyboardShortcutHints, useKeyboardShortcutsModal } from '@/components/KeyboardShortcutHints';
import { LoginForm } from '@/components/LoginForm';
import { useAppStore } from '@/stores/app.store';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useThemeInit } from '@/lib/useThemeInit';
import { useNotifications } from '@/lib/useNotifications';
import clsx from 'clsx';

export default function Home() {
  const {
    isAuthenticated,
    setAuthenticated,
    checkAuth,
    currentPerspective,
    fetchPerspectives,
    fetchActions,
    fetchProjects,
    fetchTags,
    selectedActionId,
    setSelectedAction,
    selectedProjectId,
    setSelectedProject,
    isQuickEntryOpen,
    setQuickEntryOpen,
    isSearchOpen,
    setSearchOpen,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isQuickOpenOpen,
    setQuickOpenOpen,
    isPerspectiveEditorOpen,
    editingPerspectiveId,
    closePerspectiveEditor,
    isSettingsOpen,
    setSettingsOpen,
    isKeyboardHelpOpen,
    setKeyboardHelpOpen,
    isFocusTimerOpen,
    setFocusTimerOpen,
    isWeeklyReviewOpen,
    setWeeklyReviewOpen,
    isHabitTrackerOpen,
    setHabitTrackerOpen,
    isTimeBlockerOpen,
    setTimeBlockerOpen,
    theme,
    isFocusMode,
  } = useAppStore();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Initialize theme from localStorage/system preference
  useThemeInit();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Enable browser notifications
  useNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPerspectives();
      fetchProjects();
      fetchTags();
    }
  }, [isAuthenticated, fetchPerspectives, fetchProjects, fetchTags]);

  useEffect(() => {
    if (currentPerspective) {
      fetchActions(currentPerspective);
    }
  }, [currentPerspective, fetchActions]);

  const handleNewAction = () => {
    setQuickEntryOpen(true);
  };

  const handleCloseQuickEntry = () => {
    setQuickEntryOpen(false);
  };

  const handleCloseTaskDetail = () => {
    setSelectedAction(null);
  };

  // Keyboard shortcuts modal
  const keyboardShortcutsModal = useKeyboardShortcutsModal();

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return (
    <ToastProvider>
    <ConfettiProvider>
    <div className={clsx(
      'flex h-screen',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-omnifocus-light-bg'
    )}>
      {/* Desktop sidebar - hidden on mobile and in focus mode */}
      {!isFocusMode && <Sidebar />}

      {/* Main content - full width on mobile */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0 flex flex-col">
        {/* Global Progress Bar */}
        <GlobalProgressBar dailyGoal={10} />

        {/* Focus Bar - shows when focused on a project/tag */}
        <FocusBar />

        <div className="flex-1 overflow-hidden">
          {currentPerspective === 'projects' ? (
            <ProjectList />
          ) : currentPerspective === 'tags' ? (
            <TagList />
          ) : currentPerspective === 'forecast' ? (
            <ForecastList />
          ) : currentPerspective === 'flagged' ? (
            <FlaggedList />
          ) : currentPerspective === 'review' ? (
            <ReviewList />
          ) : currentPerspective === 'today' ? (
            <TodayDashboard />
          ) : currentPerspective === 'stats' ? (
            <StatsDashboard />
          ) : (
            <ActionList />
          )}
        </div>

        {/* Keyboard hints - desktop only */}
        <KeyboardHintBar />
      </main>

      {/* Mobile only: Bottom navigation */}
      <BottomNav />

      {/* Mobile only: Floating action button */}
      <FloatingActionButton onClick={handleNewAction} />

      {/* Task Detail Panel - opens when an action is selected */}
      <TaskDetailPanel
        actionId={selectedActionId}
        onClose={handleCloseTaskDetail}
      />

      {/* Project Detail Panel - opens when a project is selected */}
      <ProjectDetailPanel
        projectId={selectedProjectId}
        onClose={() => setSelectedProject(null)}
      />

      {/* Quick Entry Form - opens from FAB or keyboard shortcut */}
      <QuickEntryForm
        isOpen={isQuickEntryOpen}
        onClose={handleCloseQuickEntry}
      />

      {/* Search Command - opens with cmd+k */}
      <SearchCommand
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Command Palette - opens with cmd+p */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Quick Open - opens with cmd+o */}
      <QuickOpen
        isOpen={isQuickOpenOpen}
        onClose={() => setQuickOpenOpen(false)}
      />

      {/* Perspective Editor */}
      <PerspectiveEditor
        isOpen={isPerspectiveEditorOpen}
        perspectiveId={editingPerspectiveId}
        onClose={closePerspectiveEditor}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Undo Toast */}
      <UndoToast />

      {/* Notification Service (background) */}
      <NotificationService />
      <NotificationPrompt />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={isKeyboardHelpOpen}
        onClose={() => setKeyboardHelpOpen(false)}
      />

      {/* Focus Timer */}
      <FocusTimer
        isOpen={isFocusTimerOpen}
        onClose={() => setFocusTimerOpen(false)}
      />

      {/* Weekly Review Flow */}
      <WeeklyReviewFlow
        isOpen={isWeeklyReviewOpen}
        onClose={() => setWeeklyReviewOpen(false)}
      />

      {/* Habit Tracker */}
      <HabitTracker
        isOpen={isHabitTrackerOpen}
        onClose={() => setHabitTrackerOpen(false)}
      />

      {/* Time Blocker */}
      <TimeBlocker
        isOpen={isTimeBlockerOpen}
        onClose={() => setTimeBlockerOpen(false)}
      />

      {/* Scratchpad - floating quick notes */}
      <Scratchpad />

      {/* Batch Actions Bar - appears when multiple actions selected */}
      <BatchActionsBar />

      {/* Focus Mode Overlay */}
      <FocusModeOverlay />

      {/* Morning Briefing */}
      <MorningBriefing />

      {/* End of Day Summary */}
      <EndOfDaySummary />

      {/* Onboarding Tour */}
      <OnboardingTour />

      {/* Keyboard Shortcuts Modal (press ? to toggle) */}
      <KeyboardShortcutHints
        isOpen={keyboardShortcutsModal.isOpen}
        onClose={keyboardShortcutsModal.close}
      />
    </div>
    </ConfettiProvider>
    </ToastProvider>
  );
}
