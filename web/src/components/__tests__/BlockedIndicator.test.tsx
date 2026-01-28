import { render, screen } from '@testing-library/react';

const mockStore = {
  actions: [
    { id: '1', title: 'Blocking Task', status: 'active', flagged: false, tags: [], position: 0, blockedBy: [] },
    { id: '2', title: 'Blocked Task', status: 'active', flagged: false, tags: [], position: 1, blockedBy: ['1'] },
    { id: '3', title: 'Partially Blocked', status: 'active', flagged: false, tags: [], position: 2, blockedBy: ['1', '4'] },
    { id: '4', title: 'Completed Blocker', status: 'completed', flagged: false, tags: [], position: 3, blockedBy: [] },
  ],
  theme: 'dark' as const,
};

jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

import { BlockedIndicator } from '../BlockedIndicator';

describe('BlockedIndicator', () => {
  it('renders nothing when action has no blockers', () => {
    const { container } = render(<BlockedIndicator blockedBy={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows chain icon when action is blocked', () => {
    render(<BlockedIndicator blockedBy={['1']} />);
    expect(screen.getByTitle(/blocked by 1 task/i)).toBeInTheDocument();
  });

  it('shows correct count for multiple blockers', () => {
    render(<BlockedIndicator blockedBy={['1', '4']} />);
    expect(screen.getByTitle(/blocked by 2 tasks/i)).toBeInTheDocument();
  });

  it('shows orange/yellow when blocking tasks are incomplete', () => {
    render(<BlockedIndicator blockedBy={['1']} />);
    const indicator = screen.getByTitle(/blocked by 1 task/i);
    expect(indicator).toHaveClass('text-yellow-500');
  });

  it('shows green when all blocking tasks are completed', () => {
    render(<BlockedIndicator blockedBy={['4']} />);
    const indicator = screen.getByTitle(/blocked by 1 task/i);
    expect(indicator).toHaveClass('text-green-500');
  });

  it('shows orange when some blocking tasks are incomplete', () => {
    // Task 3 is blocked by both '1' (active) and '4' (completed)
    render(<BlockedIndicator blockedBy={['1', '4']} />);
    const indicator = screen.getByTitle(/blocked by 2 tasks/i);
    expect(indicator).toHaveClass('text-yellow-500');
  });
});
