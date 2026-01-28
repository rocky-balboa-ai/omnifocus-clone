import { render, screen, fireEvent } from '@testing-library/react';
import { QuickOpen } from '../QuickOpen';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('QuickOpen', () => {
  const mockOnClose = jest.fn();
  const mockSetCurrentPerspective = jest.fn();
  const mockSetSelectedProject = jest.fn();
  const mockSetFocusedTag = jest.fn();

  const mockProjects = [
    { id: 'p1', name: 'Work Project', status: 'active' },
    { id: 'p2', name: 'Home Project', status: 'active' },
    { id: 'p3', name: 'Completed Project', status: 'completed' },
  ];

  const mockTags = [
    { id: 't1', name: 'urgent' },
    { id: 't2', name: 'home' },
    { id: 't3', name: 'work' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      projects: mockProjects,
      tags: mockTags,
      setCurrentPerspective: mockSetCurrentPerspective,
      setSelectedProject: mockSetSelectedProject,
      setFocusedTag: mockSetFocusedTag,
    });
  });

  it('should render nothing when closed', () => {
    const { container } = render(<QuickOpen isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when open', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText(/go to/i)).toBeInTheDocument();
  });

  it('should show perspectives section', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Perspectives')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    // 'Projects' and 'Tags' appear both as perspective items and section headers
    expect(screen.getAllByText('Projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tags').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('should show active projects section', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    // Should show Projects header in results
    expect(screen.getAllByText('Projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Work Project')).toBeInTheDocument();
    expect(screen.getByText('Home Project')).toBeInTheDocument();
    // Completed projects should not show
    expect(screen.queryByText('Completed Project')).not.toBeInTheDocument();
  });

  it('should show tags section', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    expect(screen.getAllByText('Tags').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
  });

  it('should filter results when typing', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/go to/i);
    fireEvent.change(input, { target: { value: 'work' } });

    // Should show Work Project and work tag
    expect(screen.getByText('Work Project')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
    // Should not show Home Project or home tag
    expect(screen.queryByText('Home Project')).not.toBeInTheDocument();
    expect(screen.queryByText('home')).not.toBeInTheDocument();
  });

  it('should navigate to perspective when selected', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Inbox'));

    expect(mockSetCurrentPerspective).toHaveBeenCalledWith('inbox');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should navigate to project when selected', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Work Project'));

    expect(mockSetCurrentPerspective).toHaveBeenCalledWith('projects');
    expect(mockSetSelectedProject).toHaveBeenCalledWith('p1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should focus on tag when selected', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('urgent'));

    expect(mockSetFocusedTag).toHaveBeenCalledWith('t1');
    expect(mockSetCurrentPerspective).toHaveBeenCalledWith('inbox');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close on escape key', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/go to/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when clicking backdrop', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    // Click the backdrop (first child which is the overlay)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should navigate with arrow keys and enter', () => {
    render(<QuickOpen isOpen={true} onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText(/go to/i);

    // Press down arrow to move selection
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Press enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should have navigated somewhere
    expect(mockOnClose).toHaveBeenCalled();
  });
});
