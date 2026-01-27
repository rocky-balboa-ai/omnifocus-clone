'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Bell,
  BellOff,
  X,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Flag,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

// Notification types
type NotificationType = 'reminder' | 'overdue' | 'completed' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionId?: string;
  projectId?: string;
}

// Context for notifications
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = 'omnifocus-notifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        setNotifications([]);
      }
    }
  }, []);

  // Save to localStorage
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };
    saveNotifications([newNotification, ...notifications]);
  }, [notifications, saveNotifications]);

  const markAsRead = useCallback((id: string) => {
    saveNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  }, [notifications, saveNotifications]);

  const markAllAsRead = useCallback(() => {
    saveNotifications(notifications.map(n => ({ ...n, read: true })));
  }, [notifications, saveNotifications]);

  const removeNotification = useCallback((id: string) => {
    saveNotifications(notifications.filter(n => n.id !== id));
  }, [notifications, saveNotifications]);

  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Notification bell button
interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const { theme } = useAppStore();
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative p-2 rounded-lg transition-colors',
        theme === 'dark'
          ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
        className
      )}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Notification panel
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { theme, setSelectedAction } = useAppStore();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionId) {
      setSelectedAction(notification.actionId);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={clsx(
        'fixed right-4 top-16 w-96 max-h-[70vh] rounded-2xl shadow-2xl border overflow-hidden z-50',
        'animate-in fade-in slide-in-from-top-2 duration-200',
        theme === 'dark'
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-omnifocus-purple" />
            <h3 className={clsx(
              'font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-omnifocus-purple/20 text-omnifocus-purple text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={clsx(
                  'p-1.5 rounded-lg text-xs transition-colors',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
                title="Mark all as read"
              >
                <CheckCheck size={16} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className={clsx(
                  'p-1.5 rounded-lg text-xs transition-colors',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                )}
                title="Clear all"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <BellOff size={32} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'} />
              <p className={clsx(
                'mt-2 text-sm',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                No notifications
              </p>
            </div>
          ) : (
            <div className="divide-y divide-omnifocus-border">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onRemove={() => removeNotification(notification.id)}
                  theme={theme}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Individual notification item
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onRemove: () => void;
  theme: 'light' | 'dark';
}

function NotificationItem({ notification, onClick, onRemove, theme }: NotificationItemProps) {
  const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
    reminder: { icon: Calendar, color: 'text-blue-500' },
    overdue: { icon: AlertCircle, color: 'text-red-500' },
    completed: { icon: CheckCircle2, color: 'text-green-500' },
    info: { icon: Info, color: 'text-blue-500' },
    warning: { icon: Flag, color: 'text-omnifocus-orange' },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'group flex items-start gap-3 p-4 cursor-pointer transition-colors',
        !notification.read && (theme === 'dark' ? 'bg-omnifocus-surface/50' : 'bg-blue-50/50'),
        theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-50'
      )}
      onClick={onClick}
    >
      <div className={clsx('shrink-0 mt-0.5', config.color)}>
        <Icon size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={clsx(
            'text-sm font-medium',
            !notification.read && 'font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-omnifocus-purple shrink-0 mt-1.5" />
          )}
        </div>
        <p className={clsx(
          'text-sm mt-0.5',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          {notification.message}
        </p>
        <p className={clsx(
          'text-xs mt-1',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={clsx(
          'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          theme === 'dark'
            ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Hook to generate notifications from app state
export function useNotificationGenerator() {
  const { actions } = useAppStore();
  const { addNotification, notifications } = useNotifications();

  useEffect(() => {
    // Check for overdue tasks
    const now = new Date();
    const overdueTasks = actions.filter(a =>
      a.status === 'active' &&
      a.dueDate &&
      new Date(a.dueDate) < now
    );

    // Only add notifications for new overdue tasks
    overdueTasks.forEach(task => {
      const existingNotification = notifications.find(n =>
        n.type === 'overdue' && n.actionId === task.id
      );

      if (!existingNotification) {
        addNotification({
          type: 'overdue',
          title: 'Task overdue',
          message: task.title,
          actionId: task.id,
        });
      }
    });
  }, [actions]); // Only re-run when actions change
}

// Notification toast (for real-time notifications)
interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const { theme } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeConfig: Record<NotificationType, { icon: typeof Bell; bgColor: string }> = {
    reminder: { icon: Calendar, bgColor: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100' },
    overdue: { icon: AlertCircle, bgColor: theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100' },
    completed: { icon: CheckCircle2, bgColor: theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100' },
    info: { icon: Info, bgColor: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100' },
    warning: { icon: Flag, bgColor: theme === 'dark' ? 'bg-yellow-500/20' : 'bg-yellow-100' },
  };

  const config = typeConfig[notification.type];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'fixed top-4 right-4 w-80 rounded-xl shadow-2xl border overflow-hidden z-[100]',
      'animate-in fade-in slide-in-from-right duration-300',
      config.bgColor,
      theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
    )}>
      <div className="flex items-start gap-3 p-4">
        <Icon size={20} className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className={clsx(
            'font-medium text-sm',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {notification.title}
          </p>
          <p className={clsx(
            'text-sm',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>
            {notification.message}
          </p>
        </div>
        <button onClick={onClose} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
