'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { isBefore, addMinutes, isAfter, differenceInMinutes } from 'date-fns';

// How often to check for due tasks (in ms)
const CHECK_INTERVAL = 60000; // 1 minute

// How many minutes before due to notify
const NOTIFY_BEFORE_MINUTES = 15;

// Track which tasks we've already notified about (to avoid duplicates)
const notifiedTasks = new Set<string>();

/**
 * Hook to manage notification permissions
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied' as NotificationPermission;
  }, []);

  return { permission, requestPermission };
}

/**
 * Check if a task should trigger a notification
 */
function shouldNotify(action: Action): boolean {
  // Skip completed/dropped tasks
  if (action.status === 'completed' || action.status === 'dropped') {
    return false;
  }

  // Skip tasks without due dates
  if (!action.dueDate) {
    return false;
  }

  // Skip if already notified
  if (notifiedTasks.has(action.id)) {
    return false;
  }

  const now = new Date();
  const dueDate = new Date(action.dueDate);
  const notifyTime = addMinutes(dueDate, -NOTIFY_BEFORE_MINUTES);

  // Notify if we're within the notification window (15 min before to 0 min after due)
  if (isAfter(now, notifyTime) && isBefore(now, addMinutes(dueDate, 5))) {
    return true;
  }

  // Also notify if overdue (within last hour)
  if (isAfter(now, dueDate) && differenceInMinutes(now, dueDate) <= 60) {
    return true;
  }

  return false;
}

/**
 * Send a browser notification
 */
function sendNotification(action: Action) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const dueDate = new Date(action.dueDate!);
  const now = new Date();
  const isOverdue = isAfter(now, dueDate);

  const title = isOverdue ? `Overdue: ${action.title}` : `Due Soon: ${action.title}`;
  const body = isOverdue
    ? `This task was due ${differenceInMinutes(now, dueDate)} minutes ago`
    : `Due in ${differenceInMinutes(dueDate, now)} minutes`;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: action.id, // Prevents duplicate notifications
      requireInteraction: true,
    });

    // Mark as notified
    notifiedTasks.add(action.id);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

/**
 * Background service that checks for due tasks and sends notifications
 */
export function NotificationService() {
  const { actions } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkDueTasks = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    actions.forEach((action) => {
      if (shouldNotify(action)) {
        sendNotification(action);
      }
    });
  }, [actions]);

  useEffect(() => {
    // Check immediately on mount
    checkDueTasks();

    // Set up periodic checks
    intervalRef.current = setInterval(checkDueTasks, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkDueTasks]);

  // This component renders nothing - it's just a background service
  return null;
}

/**
 * UI component to enable notifications
 */
export function NotificationPrompt() {
  const { permission, requestPermission } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);
  const { theme } = useAppStore();

  // Don't show if permission already granted/denied or dismissed
  if (permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border max-w-sm z-40
        ${theme === 'dark' ? 'bg-omnifocus-sidebar border-omnifocus-border' : 'bg-white border-gray-200'}
      `}
    >
      <h3 className={`font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Enable Notifications?
      </h3>
      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Get reminded when tasks are due so you never miss a deadline.
      </p>
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          className="px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90"
        >
          Enable
        </button>
        <button
          onClick={() => setDismissed(true)}
          className={`
            px-3 py-1.5 rounded-lg text-sm
            ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
          `}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
