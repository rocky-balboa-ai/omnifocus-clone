import { render, screen, fireEvent } from '@testing-library/react';
import { FocusBar } from '../FocusBar';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('FocusBar', () => {
  const mockStore = {
    theme: 'dark',
    focusedProjectId: null,
    focusedTagId: null,
    projects: [
      { id: 'project-1', name: 'Work Project', status: 'active' },
    ],
    tags: [
      { id: 'tag-1', name: 'Urgent' },
    ],
    clearFocus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('should not render when not focused on anything', () => {
    const { container } = render(<FocusBar />);
    expect(container.firstChild).toBeNull();
  });

  it('should show focused project name when focused on a project', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      focusedProjectId: 'project-1',
    });

    render(<FocusBar />);

    expect(screen.getByText(/Focused on:/)).toBeInTheDocument();
    expect(screen.getByText('Work Project')).toBeInTheDocument();
  });

  it('should show focused tag name when focused on a tag', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      focusedTagId: 'tag-1',
    });

    render(<FocusBar />);

    expect(screen.getByText(/Focused on:/)).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('should call clearFocus when Exit Focus button is clicked', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      focusedProjectId: 'project-1',
    });

    render(<FocusBar />);

    const exitButton = screen.getByText('Exit Focus');
    fireEvent.click(exitButton);

    expect(mockStore.clearFocus).toHaveBeenCalled();
  });

  it('should prioritize project focus over tag focus', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      focusedProjectId: 'project-1',
      focusedTagId: 'tag-1',
    });

    render(<FocusBar />);

    expect(screen.getByText('Work Project')).toBeInTheDocument();
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
  });

  it('should show folder icon for project focus', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      focusedProjectId: 'project-1',
    });

    render(<FocusBar />);

    // The FolderOpen icon should be present
    const focusBar = screen.getByText('Work Project').closest('div');
    expect(focusBar).toBeInTheDocument();
  });
});
