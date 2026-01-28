import { render, screen } from '@testing-library/react';
import { StalledIndicator, isProjectStalled } from '../StalledIndicator';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('StalledIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue({ theme: 'dark' });
  });

  describe('isProjectStalled utility', () => {
    it('should return false for projects with recent activity', () => {
      const project = {
        id: 'p1',
        updatedAt: new Date().toISOString(), // Today
        status: 'active',
        _count: { actions: 5, completedActions: 2 },
      };

      expect(isProjectStalled(project as any)).toBe(false);
    });

    it('should return true for projects with no activity in 14+ days', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'active',
        _count: { actions: 5, completedActions: 2 },
      };

      expect(isProjectStalled(project as any)).toBe(true);
    });

    it('should return false for completed projects', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'completed',
        _count: { actions: 5, completedActions: 5 },
      };

      expect(isProjectStalled(project as any)).toBe(false);
    });

    it('should return false for on-hold projects', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'on_hold',
        _count: { actions: 5, completedActions: 2 },
      };

      expect(isProjectStalled(project as any)).toBe(false);
    });

    it('should return false for projects with no remaining actions', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'active',
        _count: { actions: 5, completedActions: 5 },
      };

      expect(isProjectStalled(project as any)).toBe(false);
    });
  });

  describe('StalledIndicator component', () => {
    it('should render stalled icon when project is stalled', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'active',
        _count: { actions: 5, completedActions: 2 },
      };

      render(<StalledIndicator project={project as any} />);

      expect(screen.getByTitle(/stalled/i)).toBeInTheDocument();
    });

    it('should not render anything when project is not stalled', () => {
      const project = {
        id: 'p1',
        updatedAt: new Date().toISOString(),
        status: 'active',
        _count: { actions: 5, completedActions: 2 },
      };

      const { container } = render(<StalledIndicator project={project as any} />);

      expect(container.firstChild).toBeNull();
    });

    it('should show days since last update in tooltip', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 15);

      const project = {
        id: 'p1',
        updatedAt: twoWeeksAgo.toISOString(),
        status: 'active',
        _count: { actions: 5, completedActions: 2 },
      };

      render(<StalledIndicator project={project as any} />);

      const indicator = screen.getByTitle(/stalled.*15.*days/i);
      expect(indicator).toBeInTheDocument();
    });
  });
});
