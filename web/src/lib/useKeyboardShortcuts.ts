'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';

export function useKeyboardShortcuts() {
  const {
    selectedActionId,
    setQuickEntryOpen,
    setSearchOpen,
    setSelectedAction,
    completeAction,
    updateAction,
    indentAction,
    outdentAction,
    actions,
    isQuickEntryOpen,
    isSearchOpen,
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

    // Escape: Close modals
    if (e.key === 'Escape') {
      if (isSearchOpen) {
        setSearchOpen(false);
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

    // Skip other shortcuts if in input field
    if (isInputField) return;

    // Skip if modals are open
    if (isQuickEntryOpen || isSearchOpen) return;

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
        // Move selection down
        e.preventDefault();
        if (actions.length > 0) {
          const currentIndex = actions.findIndex(a => a.id === selectedActionId);
          const nextIndex = currentIndex < actions.length - 1 ? currentIndex + 1 : 0;
          setSelectedAction(actions[nextIndex].id);
        }
        break;

      case 'k':
        // Move selection up
        e.preventDefault();
        if (actions.length > 0) {
          const currentIndex = actions.findIndex(a => a.id === selectedActionId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : actions.length - 1;
          setSelectedAction(actions[prevIndex].id);
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
    }
  }, [
    selectedActionId,
    setQuickEntryOpen,
    setSearchOpen,
    setSelectedAction,
    completeAction,
    updateAction,
    indentAction,
    outdentAction,
    actions,
    isQuickEntryOpen,
    isSearchOpen,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
