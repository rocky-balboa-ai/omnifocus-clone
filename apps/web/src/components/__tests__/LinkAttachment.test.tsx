import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkAttachment } from '../LinkAttachment';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('LinkAttachment', () => {
  const mockStore = {
    theme: 'dark',
  };

  const mockOnAdd = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Add Link Form', () => {
    it('should render add link button', () => {
      render(
        <LinkAttachment
          links={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Add Link')).toBeInTheDocument();
    });

    it('should show input form when Add Link is clicked', () => {
      render(
        <LinkAttachment
          links={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Add Link'));

      expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Link title (optional)')).toBeInTheDocument();
    });

    it('should call onAdd with URL and title when form is submitted', async () => {
      render(
        <LinkAttachment
          links={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Add Link'));

      const urlInput = screen.getByPlaceholderText('https://...');
      const titleInput = screen.getByPlaceholderText('Link title (optional)');

      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.change(titleInput, { target: { value: 'Example Site' } });

      const addButton = screen.getByRole('button', { name: /add$/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          url: 'https://example.com',
          title: 'Example Site',
        });
      });
    });

    it('should not call onAdd if URL is empty', async () => {
      render(
        <LinkAttachment
          links={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Add Link'));

      const addButton = screen.getByRole('button', { name: /add$/i });
      fireEvent.click(addButton);

      expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('should auto-add https:// if missing', async () => {
      render(
        <LinkAttachment
          links={[]}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Add Link'));

      const urlInput = screen.getByPlaceholderText('https://...');
      fireEvent.change(urlInput, { target: { value: 'example.com' } });

      const addButton = screen.getByRole('button', { name: /add$/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          url: 'https://example.com',
          title: '',
        });
      });
    });
  });

  describe('Link Display', () => {
    const mockLinks = [
      { id: 'link-1', url: 'https://example.com', title: 'Example' },
      { id: 'link-2', url: 'https://github.com', title: 'GitHub' },
    ];

    it('should display existing links', () => {
      render(
        <LinkAttachment
          links={mockLinks}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Example')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('should show URL as title if no title provided', () => {
      const linksWithoutTitle = [
        { id: 'link-1', url: 'https://example.com', title: '' },
      ];

      render(
        <LinkAttachment
          links={linksWithoutTitle}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('should call onRemove when delete button is clicked', async () => {
      render(
        <LinkAttachment
          links={mockLinks}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      const deleteButtons = screen.getAllByTitle('Remove link');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnRemove).toHaveBeenCalledWith('link-1');
      });
    });

    it('should open link in new tab when clicked', () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      render(
        <LinkAttachment
          links={mockLinks}
          onAdd={mockOnAdd}
          onRemove={mockOnRemove}
        />
      );

      const linkElement = screen.getByText('Example');
      fireEvent.click(linkElement);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

      windowOpenSpy.mockRestore();
    });
  });
});
