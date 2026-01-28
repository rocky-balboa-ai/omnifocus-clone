'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { isToday, isBefore, startOfDay, addHours, differenceInMinutes } from 'date-fns';

const NOTIFICATION_KEY = 'omnifocus-notifications-permission';
const LAST_CHECK_KEY = 'omnifocus-last-notification-check';

export function useNotifications() {
  const { actions } = useAppStore();
  const notifiedRef = useRef<Set<string>>(new Set());

  // Request permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    const hasAsked = localStorage.getItem(NOTIFICATION_KEY);
    if (!hasAsked && Notification.permission === 'default') {
      // Wait a bit before asking
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          localStorage.setItem(NOTIFICATION_KEY, permission);
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const showNotification = useCallback((title: string, body: string, tag: string) => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (notifiedRef.current.has(tag)) return;

    notifiedRef.current.add(tag);

    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag,
      badge: '/icon-192.png',
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  }, []);

  // Check for due tasks periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDueTasks = () => {
      const now = new Date();
      const today = startOfDay(now);

      // Check for overdue tasks (once per session)
      const overdueActions = actions.filter(a =>
        a.status === 'active' &&
        a.dueDate &&
        isBefore(new Date(a.dueDate), today)
      );

      if (overdueActions.length > 0) {
        const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
        const todayStr = today.toISOString();

        if (lastCheck !== todayStr) {
          showNotification(
            'Overdue Tasks',
            `You have ${overdueActions.length} overdue task${overdueActions.length > 1 ? 's' : ''} that need attention.`,
            'overdue-tasks'
          );
          localStorage.setItem(LAST_CHECK_KEY, todayStr);
        }
      }

      // Check for tasks due soon (within 1 hour)
      const dueSoon = actions.filter(a => {
        if (a.status !== 'active' || !a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        const minutesUntilDue = differenceInMinutes(dueDate, now);
        return minutesUntilDue > 0 && minutesUntilDue <= 60;
      });

      dueSoon.forEach(action => {
        const minutesUntilDue = differenceInMinutes(new Date(action.dueDate!), now);
        showNotification(
          'Task Due Soon',
          `"${action.title}" is due in ${minutesUntilDue} minute${minutesUntilDue !== 1 ? 's' : ''}.`,
          `due-soon-${action.id}`
        );
      });
    };

    // Check immediately and every 5 minutes
    checkDueTasks();
    const interval = setInterval(checkDueTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [actions, showNotification]);
}
