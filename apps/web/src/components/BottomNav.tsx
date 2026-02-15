'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
  Sun,
  MoreHorizontal,
  Settings,
  LogOut,
  Bot,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';
import { isBefore, isToday, startOfDay } from 'date-fns';

const perspectiveIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  today: Sun,
  inbox: Inbox,
  projects: FolderKanban,
  tags: Tags,
  forecast: Calendar,
  flagged: Flag,
  review: RefreshCw,
};

const perspectiveHref: Record<string, string> = {
  inbox: '/inbox',
  projects: '/projects',
  tags: '/tags',
  forecast: '/forecast',
  flagged: '/flagged',
  review: '/review',
  today: '/today',
  stats: '/stats',
  'rocky-queue': '/rocky-queue',
};

// Mobile shows fewer items due to space constraints - reduced to make room for More
const perspectiveOrder = ['today', 'inbox', 'forecast', 'flagged'];

export function BottomNav() {
  const { perspectives, setSettingsOpen, logout, actions, projects, theme } = useAppStore();
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (id: string) => {
    const href = perspectiveHref[id];
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMoreOpen]);

  // Calculate badge counts for each perspective
  const badgeCounts = useMemo(() => {
    const today = startOfDay(new Date());
    const activeActions = actions.filter(a => a.status === 'active');

    const overdueCount = activeActions.filter(a =>
      a.dueDate && isBefore(new Date(a.dueDate), today)
    ).length;

    const dueTodayCount = activeActions.filter(a =>
      a.dueDate && isToday(new Date(a.dueDate))
    ).length;

    return {
      today: overdueCount + dueTodayCount,
      inbox: activeActions.filter(a => !a.projectId).length,
      flagged: activeActions.filter(a => a.flagged).length,
      forecast: activeActions.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return isBefore(dueDate, today) || isToday(dueDate);
      }).length,
      review: projects.filter(p => {
        if (p.status !== 'active' || !p.reviewInterval) return false;
        if (!p.nextReviewAt) return true;
        return isBefore(new Date(p.nextReviewAt), today) || isToday(new Date(p.nextReviewAt));
      }).length,
    };
  }, [actions, projects]);

  // Get perspectives in the correct order (including special 'today')
  const orderedPerspectives = perspectiveOrder
    .map(id => {
      if (id === 'today') {
        return { id: 'today', name: 'Today', isBuiltIn: true };
      }
      return perspectives.find(p => p.id === id);
    })
    .filter(Boolean);

  const handleLogout = () => {
    setIsMoreOpen(false);
    logout();
  };

  const handleOpenSettings = () => {
    setIsMoreOpen(false);
    setSettingsOpen(true);
  };

  return (
    <nav className={clsx(
      'md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-40',
      theme === 'dark'
        ? 'bg-omnifocus-sidebar/95 border-omnifocus-border'
        : 'bg-white/95 border-gray-200'
    )}>
      <div className="flex items-center justify-around px-1 pb-safe">
        {orderedPerspectives.map((perspective) => {
          if (!perspective) return null;
          const Icon = perspectiveIcons[perspective.id] || Inbox;
          const active = isActive(perspective.id);
          const badgeCount = badgeCounts[perspective.id as keyof typeof badgeCounts] || 0;
          const href = perspectiveHref[perspective.id] || '/inbox';

          return (
            <Link
              key={perspective.id}
              href={href}
              className={clsx(
                'relative flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
                active
                  ? 'text-omnifocus-purple'
                  : theme === 'dark' ? 'text-gray-500 active:scale-95' : 'text-gray-400 active:scale-95'
              )}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={clsx(
                    'transition-transform duration-200',
                    active && 'scale-110'
                  )}
                />
                {badgeCount > 0 && (
                  <span className={clsx(
                    'absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold',
                    perspective.id === 'forecast'
                      ? 'bg-red-500 text-white'
                      : 'bg-omnifocus-purple text-white'
                  )}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={clsx(
                'text-[10px] mt-0.5 font-medium',
                active
                  ? 'text-omnifocus-purple'
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {perspective.name}
              </span>
            </Link>
          );
        })}

        {/* More Menu Button */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={clsx(
              'relative flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
              isMoreOpen
                ? 'text-omnifocus-purple'
                : theme === 'dark' ? 'text-gray-500 active:scale-95' : 'text-gray-400 active:scale-95'
            )}
          >
            <MoreHorizontal
              size={24}
              className={clsx(
                'transition-transform duration-200',
                isMoreOpen && 'scale-110'
              )}
            />
            <span className={clsx(
              'text-[10px] mt-0.5 font-medium',
              isMoreOpen
                ? 'text-omnifocus-purple'
                : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              More
            </span>
          </button>

          {/* Popup Menu */}
          {isMoreOpen && (
            <div className={clsx(
              'absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-lg border overflow-hidden',
              theme === 'dark'
                ? 'bg-omnifocus-sidebar border-omnifocus-border'
                : 'bg-white border-gray-200'
            )}>
              {/* Navigation items */}
              <Link
                href="/projects"
                onClick={() => setIsMoreOpen(false)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isActive('projects')
                    ? 'text-omnifocus-purple bg-omnifocus-purple/10'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <FolderKanban size={18} />
                <span>Projects</span>
              </Link>
              <Link
                href="/rocky-queue"
                onClick={() => setIsMoreOpen(false)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isActive('rocky-queue')
                    ? 'text-omnifocus-purple bg-omnifocus-purple/10'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Bot size={18} />
                <span>Rocky's Queue</span>
              </Link>
              <Link
                href="/stats"
                onClick={() => setIsMoreOpen(false)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isActive('stats')
                    ? 'text-omnifocus-purple bg-omnifocus-purple/10'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-omnifocus-surface'
                      : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <BarChart3 size={18} />
                <span>Statistics</span>
              </Link>

              {/* Divider */}
              <div className={clsx(
                'border-t',
                theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
              )} />

              {/* Settings */}
              <button
                onClick={handleOpenSettings}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-omnifocus-surface'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
