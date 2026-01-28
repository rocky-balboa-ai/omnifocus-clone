import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUpdateTag = jest.fn();
const mockOnClose = jest.fn();

const mockStore = {
  tags: [
    { id: '1', name: 'Work', availableFrom: '09:00', availableUntil: '17:00' },
    { id: '2', name: 'Home', availableFrom: null, availableUntil: null },
  ],
  theme: 'dark' as const,
  updateTag: mockUpdateTag,
};

jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

jest.mock('@/lib/api', () => ({
  api: {
    patch: jest.fn(),
  },
}));

import { TagDetailPanel } from '../TagDetailPanel';

describe('TagDetailPanel', () => {
  beforeEach(() => {
    mockUpdateTag.mockClear();
    mockOnClose.mockClear();
  });

  it('renders tag name and availability fields', () => {
    render(<TagDetailPanel tagId="1" onClose={mockOnClose} />);

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByLabelText(/available from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/available until/i)).toBeInTheDocument();
  });

  it('displays existing availability times', () => {
    render(<TagDetailPanel tagId="1" onClose={mockOnClose} />);

    const fromInput = screen.getByLabelText(/available from/i) as HTMLInputElement;
    const untilInput = screen.getByLabelText(/available until/i) as HTMLInputElement;

    expect(fromInput.value).toBe('09:00');
    expect(untilInput.value).toBe('17:00');
  });

  it('shows empty fields when no availability set', () => {
    render(<TagDetailPanel tagId="2" onClose={mockOnClose} />);

    const fromInput = screen.getByLabelText(/available from/i) as HTMLInputElement;
    const untilInput = screen.getByLabelText(/available until/i) as HTMLInputElement;

    expect(fromInput.value).toBe('');
    expect(untilInput.value).toBe('');
  });

  it('calls updateTag when availability times change', async () => {
    mockUpdateTag.mockResolvedValue({});

    render(<TagDetailPanel tagId="2" onClose={mockOnClose} />);

    const fromInput = screen.getByLabelText(/available from/i);
    fireEvent.change(fromInput, { target: { value: '08:00' } });
    fireEvent.blur(fromInput);

    await waitFor(() => {
      expect(mockUpdateTag).toHaveBeenCalledWith('2', { availableFrom: '08:00' });
    });
  });

  it('clears availability when input is emptied', async () => {
    mockUpdateTag.mockResolvedValue({});

    render(<TagDetailPanel tagId="1" onClose={mockOnClose} />);

    const fromInput = screen.getByLabelText(/available from/i);
    fireEvent.change(fromInput, { target: { value: '' } });
    fireEvent.blur(fromInput);

    await waitFor(() => {
      expect(mockUpdateTag).toHaveBeenCalledWith('1', { availableFrom: null });
    });
  });

  it('renders nothing when tagId is null', () => {
    const { container } = render(<TagDetailPanel tagId={null} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onClose when close button clicked', () => {
    render(<TagDetailPanel tagId="1" onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
