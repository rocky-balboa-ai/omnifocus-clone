import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportMenu } from '../ExportMenu';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

// Mock URL and Blob
const mockURL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
};
Object.defineProperty(global, 'URL', { value: mockURL });

describe('ExportMenu', () => {
  const mockActions = [
    {
      id: 'a1',
      title: 'Task One',
      status: 'active',
      flagged: true,
      dueDate: '2025-01-28T12:00:00Z',
      project: { name: 'Work Project' },
      tags: [{ tag: { name: 'urgent' } }],
    },
    {
      id: 'a2',
      title: 'Task Two',
      status: 'completed',
      flagged: false,
      completedAt: '2025-01-27T10:00:00Z',
      project: { name: 'Home Project' },
      tags: [],
    },
    {
      id: 'a3',
      title: 'Task Three',
      status: 'active',
      flagged: false,
      deferDate: '2025-02-01T00:00:00Z',
      project: null,
      tags: [{ tag: { name: 'home' } }, { tag: { name: 'errands' } }],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      actions: mockActions,
      currentPerspective: 'inbox',
    });
  });

  it('should render export button', () => {
    render(<ExportMenu />);
    expect(screen.getByTitle(/export/i)).toBeInTheDocument();
  });

  it('should show dropdown menu when clicked', () => {
    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));

    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
    expect(screen.getByText(/export as markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/copy to clipboard/i)).toBeInTheDocument();
  });

  it('should export to CSV with correct format', async () => {
    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));
    fireEvent.click(screen.getByText(/export as csv/i));

    // Check that URL.createObjectURL was called
    await waitFor(() => {
      expect(mockURL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('should export to Markdown with correct format', async () => {
    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));
    fireEvent.click(screen.getByText(/export as markdown/i));

    await waitFor(() => {
      expect(mockURL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('should copy to clipboard when selected', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));
    fireEvent.click(screen.getByText(/copy to clipboard/i));

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should close menu after selecting an option', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));
    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/copy to clipboard/i));

    await waitFor(() => {
      expect(screen.queryByText(/export as csv/i)).not.toBeInTheDocument();
    });
  });

  it('should close menu when clicking outside', () => {
    render(
      <div>
        <ExportMenu />
        <div data-testid="outside">Outside</div>
      </div>
    );

    fireEvent.click(screen.getByTitle(/export/i));
    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByText(/export as csv/i)).not.toBeInTheDocument();
  });

  it('should show print option', () => {
    // Mock window.print
    window.print = jest.fn();

    render(<ExportMenu />);

    fireEvent.click(screen.getByTitle(/export/i));

    expect(screen.getByText(/print/i)).toBeInTheDocument();
  });
});
