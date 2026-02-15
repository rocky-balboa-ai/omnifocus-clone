'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app.store';
import {
  Inbox,
  FolderKanban,
  Tags,
  Calendar,
  Flag,
  RefreshCw,
  Plus,
  Settings,
  Sun,
  BarChart3,
  LogOut,
  Bot,
} from 'lucide-react';
import clsx from 'clsx';
import { startOfDay, isBefore, isToday } from 'date-fns';
import { SidebarCalendar } from './MiniCalendar';
import { ProjectTree } from './ProjectTree';
import { TagTree } from './TagTree';

/* ─── nav items ─── */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: 'inbox' | 'today' | 'flagged' | 'forecast' | 'rockyQueue';
}

const navItems: NavItem[] = [
  { id: 'today',       label: 'Today',          href: '/today',       icon: <Sun size={18} />,           badgeKey: 'today' },
  { id: 'inbox',       label: 'Inbox',          href: '/inbox',       icon: <Inbox size={18} />,         badgeKey: 'inbox' },
  { id: 'projects',    label: 'Projects',       href: '/projects',    icon: <FolderKanban size={18} /> },
  { id: 'tags',        label: 'Tags',           href: '/tags',        icon: <Tags size={18} /> },
  { id: 'forecast',    label: 'Forecast',       href: '/forecast',    icon: <Calendar size={18} />,      badgeKey: 'forecast' },
  { id: 'flagged',     label: 'Flagged',        href: '/flagged',     icon: <Flag size={18} />,          badgeKey: 'flagged' },
  { id: 'review',      label: 'Review',         href: '/review',      icon: <RefreshCw size={18} /> },
  { id: 'rocky-queue', label: "Rocky's Queue",  href: '/rocky-queue', icon: <Bot size={18} />,           badgeKey: 'rockyQueue' },
  { id: 'stats',       label: 'Statistics',     href: '/stats',       icon: <BarChart3 size={18} /> },
];

export function Sidebar() {
  const {
    setQuickEntryOpen,
    openPerspectiveEditor,
    setSettingsOpen,
    setWeeklyReviewOpen,
    theme,
    actions,
    perspectives,
    logout,
  } = useAppStore();
  const pathname = usePathname();

  const customPerspectives = perspectives.filter((p) => !p.isBuiltIn);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const counts = useMemo(() => {
    const today = startOfDay(new Date());
    const active = actions.filter((a) => a.status === 'active');
    return {
      inbox: active.filter((a) => !a.projectId).length,
      today: active.filter((a) => {
        if (!a.dueDate) return false;
        return isToday(new Date(a.dueDate)) || isBefore(new Date(a.dueDate), today);
      }).length,
      flagged: active.filter((a) => a.flagged).length,
      forecast: active.filter((a) => !!a.dueDate).length,
      rockyQueue: active.filter((a) => a.managedBy === 'rocky').length,
    };
  }, [actions]);

  const dark = theme === 'dark';

  return (
    <aside
      className={clsx(
        'hidden md:flex w-64 border-r flex-col',
        dark
          ? 'bg-omnifocus-sidebar border-omnifocus-border'
          : 'bg-omnifocus-light-sidebar border-omnifocus-light-border',
      )}
    >
      {/* Header */}
      <div className="p-4">
        <h1 className={clsx('text-xl font-semibold', dark ? 'text-white' : 'text-gray-900')}>
          OmniFocus
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const count = item.badgeKey ? counts[item.badgeKey] : 0;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-omnifocus-purple text-white'
                    : dark
                      ? 'text-gray-400 hover:bg-omnifocus-surface hover:text-white'
                      : 'text-gray-600 hover:bg-omnifocus-light-surface hover:text-gray-900',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && (
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 text-xs rounded-full font-medium',
                      active
                        ? 'bg-white/20'
                        : item.badgeKey === 'flagged'
                          ? 'bg-omnifocus-orange text-white'
                          : item.badgeKey === 'today'
                            ? 'bg-omnifocus-orange text-white'
                            : item.badgeKey === 'rockyQueue'
                              ? 'bg-omnifocus-purple text-white'
                              : dark
                                ? 'bg-omnifocus-surface text-gray-400'
                                : 'bg-gray-200 text-gray-600',
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Project & Tag trees */}
        <ProjectTree theme={theme} />
        <TagTree theme={theme} />

        {/* Custom perspectives */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 mb-2">
            <h3
              className={clsx(
                'text-xs font-semibold uppercase tracking-wider',
                dark ? 'text-gray-500' : 'text-gray-400',
              )}
            >
              Custom
            </h3>
            <button
              onClick={() => openPerspectiveEditor()}
              className={clsx(
                'p-1 rounded transition-colors',
                dark
                  ? 'text-gray-500 hover:bg-omnifocus-surface hover:text-white'
                  : 'text-gray-400 hover:bg-omnifocus-light-surface hover:text-gray-900',
              )}
              title="New Perspective"
            >
              <Plus size={14} />
            </button>
          </div>
          {customPerspectives.length > 0 ? (
            <div className="space-y-1">
              {customPerspectives.map((p) => (
                <Link
                  key={p.id}
                  href={`/perspectives/${p.id}`}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    pathname === `/perspectives/${p.id}`
                      ? 'bg-omnifocus-purple text-white'
                      : dark
                        ? 'text-gray-400 hover:bg-omnifocus-surface hover:text-white'
                        : 'text-gray-600 hover:bg-omnifocus-light-surface hover:text-gray-900',
                  )}
                >
                  <FolderKanban size={18} />
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={clsx('px-3 text-xs', dark ? 'text-gray-600' : 'text-gray-400')}>
              No custom perspectives yet
            </p>
          )}
        </div>

        {/* Mini calendar */}
        <div className="mt-6 px-2">
          <SidebarCalendar onSelectDate={() => {}} />
        </div>
      </nav>

      {/* Footer actions */}
      <div
        className={clsx(
          'p-4 border-t space-y-2',
          dark ? 'border-omnifocus-border' : 'border-omnifocus-light-border',
        )}
      >
        <button
          onClick={() => setQuickEntryOpen(true)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
            dark
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-omnifocus-light-surface text-gray-600 hover:text-gray-900',
          )}
        >
          <Plus size={18} />
          <span className="text-sm">New Action</span>
        </button>
        <button
          onClick={() => setWeeklyReviewOpen(true)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
            dark
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-omnifocus-light-surface text-gray-600 hover:text-gray-900',
          )}
        >
          <RefreshCw size={18} />
          <span className="text-sm">Weekly Review</span>
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className={clsx(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors',
            dark
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-omnifocus-light-surface text-gray-600 hover:text-gray-900',
          )}
        >
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          <span className="text-sm">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
