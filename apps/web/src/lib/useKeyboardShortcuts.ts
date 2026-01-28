'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { startOfDay, addDays, nextMonday } from 'date-fns';

export function useKeyboardShortcuts() {
  const {
    selectedActionId,
    setQuickEntryOpen,
    setSearchOpen,
    setCommandPaletteOpen,
    setKeyboardHelpOpen,
    setFocusTimerOpen,
    setWeeklyReviewOpen,
    setHabitTrackerOpen,
    setTimeBlockerOpen,
    setSelectedAction,
    completeAction,
    updateAction,
    deleteAction,
    indentAction,
    outdentAction,
    actions,
    isQuickEntryOpen,
    isSearchOpen,
    isCommandPaletteOpen,
    isQuickOpenOpen,
    setQuickOpenOpen,
    isKeyboardHelpOpen,
    isFocusTimerOpen,
    isWeeklyReviewOpen,
    isHabitTrackerOpen,
    isTimeBlockerOpen,
    toggleFocusMode,
    isFocusMode,
  } = useAppStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if we're in an input field
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
                         target.tagName === 'TEXTAREA' ||
                         target.isContentEditable;

    // Cmd/Ctrl + K: Open search (always works)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
      return;
    }

    // Cmd/Ctrl + P: Open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      setCommandPaletteOpen(true);
      return;
    }

    // Cmd/Ctrl + O: Open quick open (go to)
    if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
      e.preventDefault();
      setQuickOpenOpen(true);
      return;
    }

    // Cmd/Ctrl + \: Toggle focus mode
    if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
      e.preventDefault();
      toggleFocusMode();
      return;
    }

    // Focus mode specific shortcuts
    if (isFocusMode && selectedActionId) {
      if (e.key === 'Escape') {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        completeAction(selectedActionId);
        toggleFocusMode();
        return;
      }
      // Space is handled by the FocusModeOverlay component for pause/resume
      return;
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      if (isKeyboardHelpOpen) {
        setKeyboardHelpOpen(false);
        return;
      }
      if (isFocusTimerOpen) {
        setFocusTimerOpen(false);
        return;
      }
      if (isWeeklyReviewOpen) {
        setWeeklyReviewOpen(false);
        return;
      }
      if (isSearchOpen) {
        setSearchOpen(false);
        return;
      }
      if (isQuickOpenOpen) {
        setQuickOpenOpen(false);
        return;
      }
      if (isQuickEntryOpen) {
        setQuickEntryOpen(false);
        return;
      }
      if (selectedActionId) {
        setSelectedAction(null);
        return;
      }
    }

    // ?: Toggle keyboard shortcuts help (Shift+/)
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      setKeyboardHelpOpen(!isKeyboardHelpOpen);
      return;
    }

    // Skip other shortcuts if in input field
    if (isInputField) return;

    // Skip if modals are open
    if (isQuickEntryOpen || isSearchOpen || isCommandPaletteOpen || isQuickOpenOpen || isKeyboardHelpOpen || isFocusTimerOpen || isWeeklyReviewOpen || isHabitTrackerOpen || isTimeBlockerOpen) return;

    switch (e.key.toLowerCase()) {
      case 'n':
        // New action
        e.preventDefault();
        setQuickEntryOpen(true);
        break;

      case 'e':
        // Edit selected action (open detail panel)
        if (selectedActionId) {
          e.preventDefault();
          // Already selected, so detail panel should be open
        } else if (actions.length > 0) {
          // Select first action if none selected
          e.preventDefault();
          setSelectedAction(actions[0].id);
        }
        break;

      case ' ':
        // Complete selected action
        if (selectedActionId) {
          e.preventDefault();
          completeAction(selectedActionId);
          setSelectedAction(null);
        }
        break;

      case 'f':
        // Flag/unflag selected action
        if (selectedActionId) {
          e.preventDefault();
          const action = actions.find(a => a.id === selectedActionId);
          if (action) {
            updateAction(selectedActionId, { flagged: !action.flagged });
          }
        }
        break;

      case 'j':
      case 'arrowdown':
        // Move selection down
        e.preventDefault();
        if (actions.length > 0) {
          const currentIndex = actions.findIndex(a => a.id === selectedActionId);
          const nextIndex = currentIndex < actions.length - 1 ? currentIndex + 1 : 0;
          setSelectedAction(actions[nextIndex].id);
        }
        break;

      case 'k':
      case 'arrowup':
        // Move selection up
        e.preventDefault();
        if (actions.length > 0) {
          const currentIndex = actions.findIndex(a => a.id === selectedActionId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : actions.length - 1;
          setSelectedAction(actions[prevIndex].id);
        }
        break;

      case 'd':
        // Set due date to today
        if (selectedActionId) {
          e.preventDefault();
          updateAction(selectedActionId, { dueDate: startOfDay(new Date()).toISOString() });
        }
        break;

      case 't':
        // Set due date to tomorrow
        if (selectedActionId) {
          e.preventDefault();
          updateAction(selectedActionId, { dueDate: addDays(startOfDay(new Date()), 1).toISOString() });
        }
        break;

      case 'w':
        // Set due date to next week (Monday)
        if (selectedActionId) {
          e.preventDefault();
          updateAction(selectedActionId, { dueDate: nextMonday(startOfDay(new Date())).toISOString() });
        }
        break;

      case 'backspace':
      case 'delete':
        // Delete selected action (with confirmation)
        if (selectedActionId && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (confirm('Delete this action?')) {
            deleteAction(selectedActionId);
            setSelectedAction(null);
          }
        }
        break;

      case 'tab':
        // Tab = indent, Shift+Tab = outdent
        if (selectedActionId) {
          e.preventDefault();
          if (e.shiftKey) {
            outdentAction(selectedActionId);
          } else {
            indentAction(selectedActionId);
          }
        }
        break;

      case 'p':
        // Open focus timer (pomodoro)
        e.preventDefault();
        setFocusTimerOpen(true);
        break;

      case 'r':
        // Open weekly review
        e.preventDefault();
        setWeeklyReviewOpen(true);
        break;

      case 'h':
        // Open habit tracker
        e.preventDefault();
        setHabitTrackerOpen(true);
        break;

      case 'b':
        // Open time blocker
        e.preventDefault();
        setTimeBlockerOpen(true);
        break;
    }
  }, [
    selectedActionId,
    setQuickEntryOpen,
    setSearchOpen,
    setCommandPaletteOpen,
    setKeyboardHelpOpen,
    setFocusTimerOpen,
    setWeeklyReviewOpen,
    setSelectedAction,
    completeAction,
    updateAction,
    deleteAction,
    indentAction,
    outdentAction,
    actions,
    isQuickEntryOpen,
    isSearchOpen,
    isCommandPaletteOpen,
    isQuickOpenOpen,
    setQuickOpenOpen,
    isKeyboardHelpOpen,
    isFocusTimerOpen,
    isWeeklyReviewOpen,
    isHabitTrackerOpen,
    setHabitTrackerOpen,
    setTimeBlockerOpen,
    isTimeBlockerOpen,
    toggleFocusMode,
    isFocusMode,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
