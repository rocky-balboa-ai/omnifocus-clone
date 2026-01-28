import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskTemplates } from '../TaskTemplates';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('TaskTemplates', () => {
  const mockSaveTemplate = jest.fn();
  const mockDeleteTemplate = jest.fn();
  const mockCreateActionFromTemplate = jest.fn().mockResolvedValue({ id: 'new-action' });
  const mockOnClose = jest.fn();

  const mockTemplates = [
    {
      id: 't1',
      name: 'Weekly Review',
      title: 'Complete weekly review',
      note: 'Go through all projects',
      flagged: true,
      estimatedMinutes: 60,
    },
    {
      id: 't2',
      name: 'Daily Standup',
      title: 'Daily standup meeting',
      estimatedMinutes: 15,
    },
  ];

  const mockProjects = [
    { id: 'p1', name: 'Work', status: 'active' },
    { id: 'p2', name: 'Personal', status: 'active' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      templates: mockTemplates,
      projects: mockProjects,
      saveTemplate: mockSaveTemplate,
      deleteTemplate: mockDeleteTemplate,
      createActionFromTemplate: mockCreateActionFromTemplate,
    });
  });

  it('should render nothing when closed', () => {
    const { container } = render(<TaskTemplates isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render modal when open', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Task Templates')).toBeInTheDocument();
  });

  it('should display existing templates', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Weekly Review')).toBeInTheDocument();
    expect(screen.getByText('Daily Standup')).toBeInTheDocument();
  });

  it('should show template details', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Complete weekly review')).toBeInTheDocument();
    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
  });

  it('should create action from template', async () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    const useButtons = screen.getAllByText('Use');
    fireEvent.click(useButtons[0]);

    await waitFor(() => {
      expect(mockCreateActionFromTemplate).toHaveBeenCalledWith('t1');
    });
  });

  it('should delete template', async () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    // Find delete buttons
    const deleteButtons = screen.getAllByTitle(/delete/i);
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteTemplate).toHaveBeenCalledWith('t1');
  });

  it('should show new template form', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('New Template'));

    expect(screen.getByPlaceholderText(/template name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument();
  });

  it('should save new template', async () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('New Template'));

    const nameInput = screen.getByPlaceholderText(/template name/i);
    const titleInput = screen.getByPlaceholderText(/task title/i);

    fireEvent.change(nameInput, { target: { value: 'My Template' } });
    fireEvent.change(titleInput, { target: { value: 'Do the thing' } });

    fireEvent.click(screen.getByText('Save Template'));

    await waitFor(() => {
      expect(mockSaveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Template',
          title: 'Do the thing',
        })
      );
    });
  });

  it('should close on escape key', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when clicking backdrop', () => {
    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    // The backdrop has bg-black/60 class
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeTruthy();
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show empty state when no templates', () => {
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      templates: [],
      projects: mockProjects,
      saveTemplate: mockSaveTemplate,
      deleteTemplate: mockDeleteTemplate,
      createActionFromTemplate: mockCreateActionFromTemplate,
    });

    render(<TaskTemplates isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/no templates yet/i)).toBeInTheDocument();
  });
});
