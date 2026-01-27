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
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { FocusTimer } from '@/components/FocusTimer';
import { WeeklyReviewFlow } from '@/components/WeeklyReviewFlow';
import { useAppStore } from '@/stores/app.store';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useThemeInit } from '@/lib/useThemeInit';
import clsx from 'clsx';

export default function Home() {
  const {
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
    theme,
    isFocusMode,
  } = useAppStore();

  // Initialize theme from localStorage/system preference
  useThemeInit();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    fetchPerspectives();
    fetchProjects();
    fetchTags();
  }, [fetchPerspectives, fetchProjects, fetchTags]);

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

  return (
    <div className={clsx(
      'flex h-screen',
      theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-omnifocus-light-bg'
    )}>
      {/* Desktop sidebar - hidden on mobile and in focus mode */}
      {!isFocusMode && <Sidebar />}

      {/* Main content - full width on mobile */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
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
    </div>
  );
}
