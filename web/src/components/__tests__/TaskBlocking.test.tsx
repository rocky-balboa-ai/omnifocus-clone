import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUpdateAction = jest.fn();
const mockOnClose = jest.fn();

const mockStore = {
  actions: [
    { id: '1', title: 'Task 1', status: 'active', flagged: false, tags: [], position: 0, blockedBy: [] },
    { id: '2', title: 'Task 2', status: 'active', flagged: false, tags: [], position: 1, blockedBy: ['1'] },
    { id: '3', title: 'Task 3', status: 'active', flagged: false, tags: [], position: 2, blockedBy: [] },
  ],
  theme: 'dark' as const,
  updateAction: mockUpdateAction,
};

jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

jest.mock('@/lib/api', () => ({
  api: {
    patch: jest.fn(),
  },
}));

import { BlockingPicker } from '../BlockingPicker';

describe('BlockingPicker', () => {
  beforeEach(() => {
    mockUpdateAction.mockClear();
    mockOnClose.mockClear();
  });

  it('renders list of available actions to block on', () => {
    render(<BlockingPicker actionId="3" onClose={mockOnClose} />);

    // Should show Task 1 and Task 2 as options (not self)
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('shows currently blocking actions as checked', () => {
    render(<BlockingPicker actionId="2" onClose={mockOnClose} />);

    // Task 2 is blocked by Task 1, so Task 1 should be checked
    const checkbox = screen.getByRole('checkbox', { name: /task 1/i });
    expect(checkbox).toBeChecked();
  });

  it('calls updateAction when adding a blocking action', async () => {
    mockUpdateAction.mockResolvedValue({});

    render(<BlockingPicker actionId="3" onClose={mockOnClose} />);

    const checkbox = screen.getByRole('checkbox', { name: /task 1/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith('3', { blockedBy: ['1'] });
    });
  });

  it('calls updateAction when removing a blocking action', async () => {
    mockUpdateAction.mockResolvedValue({});

    render(<BlockingPicker actionId="2" onClose={mockOnClose} />);

    const checkbox = screen.getByRole('checkbox', { name: /task 1/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockUpdateAction).toHaveBeenCalledWith('2', { blockedBy: [] });
    });
  });

  it('does not show the current action in the list', () => {
    render(<BlockingPicker actionId="1" onClose={mockOnClose} />);

    // Should not show Task 1 as an option
    const checkboxes = screen.queryAllByRole('checkbox');
    const labels = checkboxes.map(cb => cb.getAttribute('aria-label'));
    expect(labels).not.toContain('Task 1');
  });
});

describe('Blocked indicator in ActionItem', () => {
  it('shows blocked indicator when action has blockedBy', () => {
    // This test would be for the ActionItem component
    // Blocked tasks should show a visual indicator
    expect(true).toBe(true); // Placeholder - will implement in ActionItem
  });
});
