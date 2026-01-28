import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock the API
const mockLogin = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockLogin(...args),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  it('renders username and password fields', () => {
    render(<LoginForm onSuccess={jest.fn()} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls API with credentials on submit', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'test-token', user: { id: '1', username: 'fred' } });
    const onSuccess = jest.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'fred' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'omnifocus' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('/auth/login', { username: 'fred', password: 'omnifocus' });
    });
  });

  it('stores token in localStorage on successful login', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'test-token', user: { id: '1', username: 'fred' } });
    const onSuccess = jest.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'fred' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'omnifocus' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token');
    });
  });

  it('calls onSuccess callback after login', async () => {
    mockLogin.mockResolvedValue({ accessToken: 'test-token', user: { id: '1', username: 'fred' } });
    const onSuccess = jest.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'fred' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'omnifocus' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginForm onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginForm onSuccess={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'fred' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'omnifocus' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });
  });
});
