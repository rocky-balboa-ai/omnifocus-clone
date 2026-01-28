import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionContextMenu } from './ActionContextMenu';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('ActionContextMenu', () => {
  const mockAction = {
    id: 'action-1',
    title: 'Test Task',
    notes: 'Some notes',
    status: 'active',
    flagged: true,
    dueDate: '2024-01-15T00:00:00.000Z',
    deferDate: '2024-01-10T00:00:00.000Z',
    projectId: 'project-1',
    parentId: null,
    tags: [{ id: 'tag-1', tagId: 'tag-1', tag: { id: 'tag-1', name: 'Work' } }],
    estimatedMinutes: 30,
    blockedBy: ['action-2'],
  };

  const mockStore = {
    theme: 'dark',
    updateAction: jest.fn(),
    completeAction: jest.fn(),
    deleteAction: jest.fn(),
    createAction: jest.fn(),
    indentAction: jest.fn(),
    outdentAction: jest.fn(),
    fetchActions: jest.fn(),
    currentPerspective: 'inbox',
    projects: [
      { id: 'project-1', name: 'Project 1', status: 'active' },
    ],
  };

  const mockOnClose = jest.fn();
  const defaultPosition = { x: 100, y: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Duplicate Task', () => {
    it('should show Duplicate menu item', () => {
      render(
        <ActionContextMenu
          action={mockAction as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    it('should call createAction with copied properties when Duplicate is clicked', async () => {
      mockStore.createAction.mockResolvedValue({ id: 'new-action-1' });

      render(
        <ActionContextMenu
          action={mockAction as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(mockStore.createAction).toHaveBeenCalledWith({
          title: 'Test Task',
          notes: 'Some notes',
          flagged: true,
          dueDate: '2024-01-15T00:00:00.000Z',
          deferDate: '2024-01-10T00:00:00.000Z',
          projectId: 'project-1',
          parentId: null,
          tagIds: ['tag-1'],
          estimatedMinutes: 30,
        });
      });
    });

    it('should refresh actions after duplicating', async () => {
      mockStore.createAction.mockResolvedValue({ id: 'new-action-1' });

      render(
        <ActionContextMenu
          action={mockAction as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(mockStore.fetchActions).toHaveBeenCalledWith('inbox');
      });
    });

    it('should close menu after duplicating', async () => {
      mockStore.createAction.mockResolvedValue({ id: 'new-action-1' });

      render(
        <ActionContextMenu
          action={mockAction as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not copy blockedBy when duplicating (new task is independent)', async () => {
      mockStore.createAction.mockResolvedValue({ id: 'new-action-1' });

      render(
        <ActionContextMenu
          action={mockAction as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        const createCall = mockStore.createAction.mock.calls[0][0];
        expect(createCall.blockedBy).toBeUndefined();
      });
    });

    it('should duplicate task without tags when action has no tags', async () => {
      const actionWithoutTags = { ...mockAction, tags: [] };
      mockStore.createAction.mockResolvedValue({ id: 'new-action-1' });

      render(
        <ActionContextMenu
          action={actionWithoutTags as any}
          position={defaultPosition}
          onClose={mockOnClose}
        />
      );

      const duplicateButton = screen.getByText('Duplicate');
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        const createCall = mockStore.createAction.mock.calls[0][0];
        expect(createCall.tagIds).toEqual([]);
      });
    });
  });
});
