import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the API
const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// Mock clipboard
const mockClipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
Object.assign(navigator, { clipboard: mockClipboard });

import { AccountSettings } from '../AccountSettings';

describe('AccountSettings', () => {
  const defaultProps = {
    currentUser: { id: 'user-123', username: 'fred' },
    theme: 'dark' as const,
  };

  beforeEach(() => {
    mockGet.mockClear();
    mockPatch.mockClear();
    mockPost.mockClear();
    mockClipboard.writeText.mockClear();

    // Default: return masked API key
    mockGet.mockImplementation((path: string) => {
      if (path === '/auth/api-key') return Promise.resolve({ maskedKey: 'sk_***...abc' });
      if (path === '/auth/api-key/reveal') return Promise.resolve({ apiKey: 'sk_fullkey123456789abc' });
      return Promise.resolve({});
    });
  });

  // ===========================================================================
  // Username Change
  // ===========================================================================
  describe('Username Change', () => {
    it('renders current username in input field', () => {
      render(<AccountSettings {...defaultProps} />);
      const input = screen.getByDisplayValue('fred');
      expect(input).toBeInTheDocument();
    });

    it('calls API to update username', async () => {
      mockPatch.mockResolvedValue({ id: 'user-123', username: 'newname' });

      render(<AccountSettings {...defaultProps} />);

      const input = screen.getByDisplayValue('fred');
      fireEvent.change(input, { target: { value: 'newname' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith('/auth/profile', { username: 'newname' });
      });
    });

    it('shows success message after username update', async () => {
      mockPatch.mockResolvedValue({ id: 'user-123', username: 'newname' });

      render(<AccountSettings {...defaultProps} />);

      const input = screen.getByDisplayValue('fred');
      fireEvent.change(input, { target: { value: 'newname' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/username updated/i)).toBeInTheDocument();
      });
    });

    it('shows error when username update fails', async () => {
      mockPatch.mockRejectedValue(new Error('Username already taken'));

      render(<AccountSettings {...defaultProps} />);

      const input = screen.getByDisplayValue('fred');
      fireEvent.change(input, { target: { value: 'taken' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/username already taken/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Password Change
  // ===========================================================================
  describe('Password Change', () => {
    it('renders password change fields', () => {
      render(<AccountSettings {...defaultProps} />);

      expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/confirm.*password/i)).toBeInTheDocument();
    });

    it('calls API to change password', async () => {
      mockPatch.mockResolvedValue({ success: true });

      render(<AccountSettings {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText(/current password/i), { target: { value: 'oldpass' } });
      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByPlaceholderText(/confirm.*password/i), { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith('/auth/password', {
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        });
      });
    });

    it('shows error when passwords do not match', async () => {
      render(<AccountSettings {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText(/current password/i), { target: { value: 'oldpass' } });
      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByPlaceholderText(/confirm.*password/i), { target: { value: 'differentpass' } });
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockPatch).not.toHaveBeenCalled();
    });

    it('shows error when current password is wrong', async () => {
      mockPatch.mockRejectedValue(new Error('Current password is incorrect'));

      render(<AccountSettings {...defaultProps} />);

      fireEvent.change(screen.getByPlaceholderText(/current password/i), { target: { value: 'wrongpass' } });
      fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpass123' } });
      fireEvent.change(screen.getByPlaceholderText(/confirm.*password/i), { target: { value: 'newpass123' } });
      fireEvent.click(screen.getByRole('button', { name: /change password/i }));

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // API Key Management
  // ===========================================================================
  describe('API Key Management', () => {
    it('shows masked API key on load', async () => {
      render(<AccountSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('sk_***...abc')).toBeInTheDocument();
      });
    });

    it('reveals full API key when reveal button is clicked', async () => {
      render(<AccountSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('sk_***...abc')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /reveal/i }));

      await waitFor(() => {
        expect(screen.getByText('sk_fullkey123456789abc')).toBeInTheDocument();
      });
    });

    it('copies API key to clipboard', async () => {
      render(<AccountSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('sk_***...abc')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/auth/api-key/reveal');
        expect(mockClipboard.writeText).toHaveBeenCalledWith('sk_fullkey123456789abc');
      });
    });

    it('regenerates API key with confirmation', async () => {
      mockPost.mockResolvedValue({ apiKey: 'sk_newregenerated123' });
      // Mock window.confirm to return true
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AccountSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('sk_***...abc')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/auth/api-key/regenerate');
      });

      confirmSpy.mockRestore();
    });

    it('does not regenerate when confirmation is cancelled', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<AccountSettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('sk_***...abc')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /regenerate/i }));

      expect(mockPost).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });
});
