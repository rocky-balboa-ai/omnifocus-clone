'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
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
import { EndOfDaySummary } from '@/components/EndOfDaySummary';
import { HabitTracker } from '@/components/HabitTracker';
import { TimeBlocker } from '@/components/TimeBlocker';
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

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const {
    isAuthenticated,
    setAuthenticated,
    checkAuth,
    fetchPerspectives,
    fetchActions,
    fetchProjects,
    fetchTags,
    fetchFolders,
    currentPerspective,
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

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useThemeInit();
  useKeyboardShortcuts();
  useNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPerspectives();
      fetchProjects();
      fetchTags();
      fetchFolders();
    }
  }, [isAuthenticated, fetchPerspectives, fetchProjects, fetchTags, fetchFolders]);

  useEffect(() => {
    if (isAuthenticated && currentPerspective) {
      fetchActions(currentPerspective);
    }
  }, [isAuthenticated, currentPerspective, fetchActions]);

  const keyboardShortcutsModal = useKeyboardShortcutsModal();

  const handleLoginSuccess = (user: { id: string; username: string }) => {
    setAuthenticated(true, user);
  };

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
      {!isFocusMode && <Sidebar />}

      <main className="flex-1 overflow-hidden pb-16 md:pb-0 flex flex-col">
        <FocusBar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        <KeyboardHintBar />
      </main>

      <BottomNav />
      <FloatingActionButton onClick={() => setQuickEntryOpen(true)} />

      <TaskDetailPanel
        actionId={selectedActionId}
        onClose={() => setSelectedAction(null)}
      />

      <ProjectDetailPanel
        projectId={selectedProjectId}
        onClose={() => setSelectedProject(null)}
      />

      <QuickEntryForm
        isOpen={isQuickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
      />

      <SearchCommand
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <QuickOpen
        isOpen={isQuickOpenOpen}
        onClose={() => setQuickOpenOpen(false)}
      />

      <PerspectiveEditor
        isOpen={isPerspectiveEditorOpen}
        perspectiveId={editingPerspectiveId}
        onClose={closePerspectiveEditor}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <UndoToast />
      <NotificationService />
      <NotificationPrompt />

      <KeyboardShortcutsHelp
        isOpen={isKeyboardHelpOpen}
        onClose={() => setKeyboardHelpOpen(false)}
      />

      <FocusTimer
        isOpen={isFocusTimerOpen}
        onClose={() => setFocusTimerOpen(false)}
      />

      <WeeklyReviewFlow
        isOpen={isWeeklyReviewOpen}
        onClose={() => setWeeklyReviewOpen(false)}
      />

      <HabitTracker
        isOpen={isHabitTrackerOpen}
        onClose={() => setHabitTrackerOpen(false)}
      />

      <TimeBlocker
        isOpen={isTimeBlockerOpen}
        onClose={() => setTimeBlockerOpen(false)}
      />

      <Scratchpad />
      <BatchActionsBar />
      <FocusModeOverlay />
      <EndOfDaySummary />

      <KeyboardShortcutHints
        isOpen={keyboardShortcutsModal.isOpen}
        onClose={keyboardShortcutsModal.close}
      />
    </div>
    </ConfettiProvider>
    </ToastProvider>
  );
}
