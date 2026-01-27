import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface Action {
  id: string;
  title: string;
  note?: string;
  status: 'active' | 'completed' | 'dropped' | 'on_hold';
  flagged: boolean;
  deferDate?: string;
  dueDate?: string;
  plannedDate?: string;
  completedAt?: string;
  estimatedMinutes?: number;
  projectId?: string;
  parentId?: string;
  position: number;
  project?: Project;
  tags: { tag: Tag }[];
  children?: Action[];
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  note?: string;
  status: 'active' | 'completed' | 'dropped' | 'on_hold';
  type: 'sequential' | 'parallel' | 'single_actions';
  flagged: boolean;
  deferDate?: string;
  dueDate?: string;
  reviewInterval?: string;
  nextReviewAt?: string;
  folderId?: string;
  actions?: Action[];
  _count?: { actions: number; completedActions?: number };
}

export interface Tag {
  id: string;
  name: string;
  parentId?: string;
  children?: Tag[];
  _count?: { actions: number; projects: number };
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
  projects?: Project[];
}

export interface Perspective {
  id: string;
  name: string;
  icon?: string;
  isBuiltIn: boolean;
  filterRules?: any[];
  sortRules?: any[];
  groupBy?: string;
}

interface AppState {
  // Data
  actions: Action[];
  projects: Project[];
  tags: Tag[];
  folders: Folder[];
  perspectives: Perspective[];

  // UI State
  currentPerspective: string;
  selectedActionId: string | null;
  selectedProjectId: string | null;
  editingPerspectiveId: string | null;
  filterTagId: string | null;
  selectedActionIds: Set<string>;
  collapsedActionIds: Set<string>;
  isQuickEntryOpen: boolean;
  isSearchOpen: boolean;
  isPerspectiveEditorOpen: boolean;
  isSettingsOpen: boolean;
  isKeyboardHelpOpen: boolean;
  showCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'auto';
  isFocusMode: boolean;

  // Actions
  setCurrentPerspective: (id: string) => void;
  setSelectedAction: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  setQuickEntryOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setShowCompleted: (show: boolean) => void;
  setFilterTagId: (tagId: string | null) => void;
  toggleActionSelection: (id: string) => void;
  clearActionSelection: () => void;
  selectAllActions: () => void;
  bulkCompleteActions: () => Promise<void>;
  bulkDeleteActions: () => Promise<void>;
  bulkFlagActions: (flagged: boolean) => Promise<void>;
  bulkSetDueDate: (dueDate: string | null) => Promise<void>;
  bulkSetProject: (projectId: string | null) => Promise<void>;
  openPerspectiveEditor: (id?: string | null) => void;
  closePerspectiveEditor: () => void;
  setSettingsOpen: (open: boolean) => void;
  setKeyboardHelpOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  toggleFocusMode: () => void;

  // API Actions
  fetchPerspectives: () => Promise<void>;
  fetchActions: (perspectiveId: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchTags: () => Promise<void>;
  fetchFolders: () => Promise<void>;

  createAction: (data: Partial<Action>) => Promise<Action>;
  updateAction: (id: string, data: Partial<Action>) => Promise<Action>;
  completeAction: (id: string) => Promise<void>;
  uncompleteAction: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  reorderActions: (actionIds: string[]) => void;
  toggleActionCollapsed: (id: string) => void;
  indentAction: (id: string) => Promise<void>;
  outdentAction: (id: string) => Promise<void>;

  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  cleanupCompleted: (olderThanDays?: number) => Promise<{ deleted: number }>;

  createTag: (data: Partial<Tag>) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  actions: [],
  projects: [],
  tags: [],
  folders: [],
  perspectives: [],
  currentPerspective: 'inbox',
  selectedActionId: null,
  selectedProjectId: null,
  editingPerspectiveId: null,
  filterTagId: null,
  selectedActionIds: new Set<string>(),
  collapsedActionIds: new Set<string>(),
  isQuickEntryOpen: false,
  isSearchOpen: false,
  isPerspectiveEditorOpen: false,
  isSettingsOpen: false,
  isKeyboardHelpOpen: false,
  showCompleted: false,
  isLoading: false,
  error: null,
  theme: 'dark',
  themeMode: 'auto',
  isFocusMode: false,

  // UI Actions
  setCurrentPerspective: (id) => set({ currentPerspective: id }),
  setSelectedAction: (id) => set({ selectedActionId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setQuickEntryOpen: (open) => set({ isQuickEntryOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setShowCompleted: (show) => set({ showCompleted: show }),
  setFilterTagId: (tagId) => set({ filterTagId: tagId }),

  toggleActionSelection: (id) => {
    set((state) => {
      const newSelected = new Set(state.selectedActionIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedActionIds: newSelected };
    });
  },

  clearActionSelection: () => set({ selectedActionIds: new Set<string>() }),

  selectAllActions: () => {
    const { actions } = get();
    set({ selectedActionIds: new Set(actions.map(a => a.id)) });
  },

  bulkCompleteActions: async () => {
    const { selectedActionIds, completeAction, clearActionSelection } = get();
    for (const id of selectedActionIds) {
      await completeAction(id);
    }
    clearActionSelection();
  },

  bulkDeleteActions: async () => {
    const { selectedActionIds, deleteAction, clearActionSelection } = get();
    for (const id of selectedActionIds) {
      await deleteAction(id);
    }
    clearActionSelection();
  },

  bulkFlagActions: async (flagged: boolean) => {
    const { selectedActionIds, updateAction, clearActionSelection } = get();
    for (const id of selectedActionIds) {
      await updateAction(id, { flagged } as any);
    }
    clearActionSelection();
  },

  bulkSetDueDate: async (dueDate: string | null) => {
    const { selectedActionIds, updateAction, clearActionSelection } = get();
    for (const id of selectedActionIds) {
      await updateAction(id, { dueDate } as any);
    }
    clearActionSelection();
  },

  bulkSetProject: async (projectId: string | null) => {
    const { selectedActionIds, updateAction, clearActionSelection } = get();
    for (const id of selectedActionIds) {
      await updateAction(id, { projectId } as any);
    }
    clearActionSelection();
  },

  openPerspectiveEditor: (id) => set({ isPerspectiveEditorOpen: true, editingPerspectiveId: id || null }),
  closePerspectiveEditor: () => set({ isPerspectiveEditorOpen: false, editingPerspectiveId: null }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setKeyboardHelpOpen: (open) => set({ isKeyboardHelpOpen: open }),

  setTheme: (theme) => {
    set({ theme });
    // Update document class and localStorage
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('omnifocus-theme', theme);
    }
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('omnifocus-theme-mode', mode);
      if (mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        get().setTheme(prefersDark ? 'dark' : 'light');
      } else {
        get().setTheme(mode);
      }
    }
  },

  toggleTheme: () => {
    const { theme, setTheme } = get();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  },

  toggleFocusMode: () => {
    set((state) => ({ isFocusMode: !state.isFocusMode }));
  },

  // API Actions
  fetchPerspectives: async () => {
    try {
      const perspectives = await api.get<Perspective[]>('/perspectives');
      set({ perspectives });
    } catch (error) {
      set({ error: 'Failed to fetch perspectives' });
    }
  },

  fetchActions: async (perspectiveId) => {
    set({ isLoading: true, error: null });
    try {
      const { filterTagId } = get();
      let actions: Action[];

      if (filterTagId) {
        // Fetch actions filtered by tag
        actions = await api.get<Action[]>(`/actions?tagId=${filterTagId}`);
      } else {
        // Fetch actions by perspective
        actions = await api.get<Action[]>(`/perspectives/${perspectiveId}/actions`);
      }

      set({ actions, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch actions', isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await api.get<Project[]>('/projects');
      set({ projects });
    } catch (error) {
      set({ error: 'Failed to fetch projects' });
    }
  },

  fetchTags: async () => {
    try {
      const tags = await api.get<Tag[]>('/tags');
      set({ tags });
    } catch (error) {
      set({ error: 'Failed to fetch tags' });
    }
  },

  fetchFolders: async () => {
    try {
      const folders = await api.get<Folder[]>('/folders');
      set({ folders });
    } catch (error) {
      set({ error: 'Failed to fetch folders' });
    }
  },

  createAction: async (data) => {
    const action = await api.post<Action>('/actions', data);
    set((state) => ({ actions: [...state.actions, action] }));
    return action;
  },

  updateAction: async (id, data) => {
    const action = await api.patch<Action>(`/actions/${id}`, data);
    set((state) => ({
      actions: state.actions.map((a) => (a.id === id ? action : a)),
    }));
    return action;
  },

  completeAction: async (id) => {
    const { actions, showCompleted } = get();
    const action = actions.find(a => a.id === id);
    const actionTitle = action?.title || 'Action';

    await api.post(`/actions/${id}/complete`);

    // Update action status instead of removing (so undo can work)
    set((state) => ({
      actions: state.actions.map(a =>
        a.id === id
          ? { ...a, status: 'completed' as const, completedAt: new Date().toISOString() }
          : a
      ).filter(a => showCompleted || a.status !== 'completed'),
    }));

    // Dispatch undo event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('action-completed', {
        detail: { actionId: id, title: actionTitle }
      }));
    }
  },

  uncompleteAction: async (id) => {
    await api.post(`/actions/${id}/uncomplete`);
    // Refresh actions to get the updated state
    const { currentPerspective, fetchActions } = get();
    await fetchActions(currentPerspective);
  },

  deleteAction: async (id) => {
    const { actions } = get();
    const action = actions.find(a => a.id === id);
    const actionTitle = action?.title || 'Action';
    const actionData = action ? { ...action } : null;

    await api.delete(`/actions/${id}`);
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== id),
    }));

    // Dispatch undo event
    if (typeof window !== 'undefined' && actionData) {
      window.dispatchEvent(new CustomEvent('action-deleted', {
        detail: { actionId: id, title: actionTitle, actionData }
      }));
    }
  },

  reorderActions: (actionIds) => {
    set((state) => {
      const actionMap = new Map(state.actions.map(a => [a.id, a]));
      const reordered = actionIds
        .map(id => actionMap.get(id))
        .filter((a): a is Action => a !== undefined);

      // Add any actions not in the reorder list at the end
      const remainingActions = state.actions.filter(a => !actionIds.includes(a.id));

      return { actions: [...reordered, ...remainingActions] };
    });

    // Persist to API (fire and forget)
    api.post('/actions/reorder', { actionIds }).catch(console.error);
  },

  toggleActionCollapsed: (id) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedActionIds);
      if (newCollapsed.has(id)) {
        newCollapsed.delete(id);
      } else {
        newCollapsed.add(id);
      }
      return { collapsedActionIds: newCollapsed };
    });
  },

  indentAction: async (id) => {
    const { actions, updateAction } = get();
    const actionIndex = actions.findIndex(a => a.id === id);
    if (actionIndex <= 0) return; // Can't indent first item

    // Find the action above this one (potential parent)
    // Look for an action at the same level or above
    const action = actions[actionIndex];
    let potentialParentIndex = actionIndex - 1;

    // Find a sibling (same parentId) above this action to become the parent
    while (potentialParentIndex >= 0) {
      const potentialParent = actions[potentialParentIndex];
      if (potentialParent.parentId === action.parentId) {
        // Found a sibling above - make it the parent
        await updateAction(id, { parentId: potentialParent.id } as any);
        return;
      }
      potentialParentIndex--;
    }
  },

  outdentAction: async (id) => {
    const { actions, updateAction } = get();
    const action = actions.find(a => a.id === id);
    if (!action?.parentId) return; // Already at root level

    // Find the parent's parent
    const parent = actions.find(a => a.id === action.parentId);
    const newParentId = parent?.parentId || null;

    await updateAction(id, { parentId: newParentId } as any);
  },

  createProject: async (data) => {
    const project = await api.post<Project>('/projects', data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: async (id, data) => {
    const project = await api.patch<Project>(`/projects/${id}`, data);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
    return project;
  },

  cleanupCompleted: async (olderThanDays = 7) => {
    const result = await api.post<{ deleted: number }>('/actions/cleanup', { olderThanDays });
    // Refresh actions to reflect the deleted items
    const { currentPerspective, fetchActions } = get();
    await fetchActions(currentPerspective);
    return result;
  },

  createTag: async (data) => {
    const tag = await api.post<Tag>('/tags', data);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  deleteTag: async (id) => {
    await api.delete(`/tags/${id}`);
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }));
  },
}));
