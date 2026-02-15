'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
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

/* ─── types ─── */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeKey?: 'today' | 'inbox' | 'flagged' | 'forecast' | 'review';
}

/* Bottom bar shows 4 main items + More */
const primaryItems: NavItem[] = [
  { id: 'today',    label: 'Today',    href: '/today',    icon: Sun,      badgeKey: 'today' },
  { id: 'inbox',    label: 'Inbox',    href: '/inbox',    icon: Inbox,    badgeKey: 'inbox' },
  { id: 'forecast', label: 'Forecast', href: '/forecast', icon: Calendar, badgeKey: 'forecast' },
  { id: 'flagged',  label: 'Flagged',  href: '/flagged',  icon: Flag,     badgeKey: 'flagged' },
];

/* Items inside the "More" menu */
const moreItems: NavItem[] = [
  { id: 'projects',    label: 'Projects',       href: '/projects',    icon: FolderKanban },
  { id: 'tags',        label: 'Tags',           href: '/tags',        icon: Tags },
  { id: 'review',      label: 'Review',         href: '/review',      icon: RefreshCw, badgeKey: 'review' },
  { id: 'rocky-queue', label: "Rocky's Queue",  href: '/rocky-queue', icon: Bot },
  { id: 'stats',       label: 'Statistics',     href: '/stats',       icon: BarChart3 },
];

export function BottomNav() {
  const { setSettingsOpen, logout, actions, projects, theme } = useAppStore();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  /* close menu on outside click */
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  const counts = useMemo(() => {
    const today = startOfDay(new Date());
    const active = actions.filter((a) => a.status === 'active');
    return {
      today: active.filter((a) => {
        if (!a.dueDate) return false;
        const d = new Date(a.dueDate);
        return isToday(d) || isBefore(d, today);
      }).length,
      inbox: active.filter((a) => !a.projectId).length,
      flagged: active.filter((a) => a.flagged).length,
      forecast: active.filter((a) => {
        if (!a.dueDate) return false;
        const d = new Date(a.dueDate);
        return isBefore(d, today) || isToday(d);
      }).length,
      review: projects.filter((p) => {
        if (p.status !== 'active' || !p.reviewInterval) return false;
        if (!p.nextReviewAt) return true;
        const d = new Date(p.nextReviewAt);
        return isBefore(d, today) || isToday(d);
      }).length,
    };
  }, [actions, projects]);

  const dark = theme === 'dark';

  return (
    <nav
      className={clsx(
        'md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t z-40',
        dark
          ? 'bg-omnifocus-sidebar/95 border-omnifocus-border'
          : 'bg-white/95 border-gray-200',
      )}
    >
      <div className="flex items-center justify-around px-1 pb-safe">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = item.badgeKey ? counts[item.badgeKey] ?? 0 : 0;

          return (
            <a
              key={item.id}
              href={item.href}
              className={clsx(
                'relative flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
                active
                  ? 'text-omnifocus-purple'
                  : dark
                    ? 'text-gray-500 active:scale-95'
                    : 'text-gray-400 active:scale-95',
              )}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={clsx('transition-transform duration-200', active && 'scale-110')}
                />
                {count > 0 && (
                  <span
                    className={clsx(
                      'absolute -top-1 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold',
                      item.id === 'forecast'
                        ? 'bg-red-500 text-white'
                        : 'bg-omnifocus-purple text-white',
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] mt-0.5 font-medium',
                  active ? 'text-omnifocus-purple' : dark ? 'text-gray-500' : 'text-gray-400',
                )}
              >
                {item.label}
              </span>
            </a>
          );
        })}

        {/* More button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={clsx(
              'relative flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-200 min-w-[52px]',
              moreOpen
                ? 'text-omnifocus-purple'
                : dark
                  ? 'text-gray-500 active:scale-95'
                  : 'text-gray-400 active:scale-95',
            )}
          >
            <MoreHorizontal
              size={24}
              className={clsx('transition-transform duration-200', moreOpen && 'scale-110')}
            />
            <span
              className={clsx(
                'text-[10px] mt-0.5 font-medium',
                moreOpen ? 'text-omnifocus-purple' : dark ? 'text-gray-500' : 'text-gray-400',
              )}
            >
              More
            </span>
          </button>

          {/* Popup menu */}
          {moreOpen && (
            <div
              className={clsx(
                'absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-lg border overflow-hidden',
                dark
                  ? 'bg-omnifocus-sidebar border-omnifocus-border'
                  : 'bg-white border-gray-200',
              )}
            >
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                      active
                        ? 'text-omnifocus-purple bg-omnifocus-purple/10'
                        : dark
                          ? 'text-gray-300 hover:bg-omnifocus-surface'
                          : 'text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </a>
                );
              })}

              <div
                className={clsx('border-t', dark ? 'border-omnifocus-border' : 'border-gray-200')}
              />

              <button
                onClick={() => {
                  setMoreOpen(false);
                  setSettingsOpen(true);
                }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  dark
                    ? 'text-gray-300 hover:bg-omnifocus-surface'
                    : 'text-gray-700 hover:bg-gray-100',
                )}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                }}
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
