import { render, screen, waitFor } from '@testing-library/react';
import { TaskDetailPanel } from '../TaskDetailPanel';

// Stable mock data - defined outside to prevent reference changes
const mockAction = {
  id: 'test-action-1',
  title: 'Test Action',
  note: '',
  status: 'active',
  flagged: false,
  tags: [],
  attachments: [],
};

const mockStore = {
  actions: [mockAction],
  projects: [],
  tags: [],
  updateAction: jest.fn(),
  deleteAction: jest.fn(),
  completeAction: jest.fn(),
  theme: 'dark' as const,
};

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    uploadFile: jest.fn(),
    getFileUrl: jest.fn((path: string) => path),
  },
}));

describe('TaskDetailPanel', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('animation', () => {
    it('should have slide-in animation classes when open', () => {
      const { container } = render(
        <TaskDetailPanel actionId="test-action-1" onClose={mockOnClose} />
      );

      // The panel should have animation classes for sliding in from right
      const panel = container.querySelector('[data-testid="task-detail-panel"]');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass('animate-slide-in-right');
    });

    it('should apply transition classes for smooth animation', () => {
      const { container } = render(
        <TaskDetailPanel actionId="test-action-1" onClose={mockOnClose} />
      );

      const panel = container.querySelector('[data-testid="task-detail-panel"]');
      expect(panel).toHaveClass('transition-transform');
    });
  });
});
