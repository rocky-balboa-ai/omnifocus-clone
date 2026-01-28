import { render, screen, waitFor, act } from '@testing-library/react';
import { NotificationService, useNotificationPermission } from '../NotificationService';
import { useAppStore } from '@/stores/app.store';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

// Mock Notification API
const mockNotification = jest.fn();
(global as any).Notification = mockNotification;
mockNotification.permission = 'default';
mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');

describe('NotificationService', () => {
  const mockActions = [
    {
      id: 'a1',
      title: 'Due Now',
      status: 'active',
      dueDate: new Date().toISOString(),
    },
    {
      id: 'a2',
      title: 'Due Later',
      status: 'active',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    },
    {
      id: 'a3',
      title: 'No Due Date',
      status: 'active',
    },
    {
      id: 'a4',
      title: 'Completed Task',
      status: 'completed',
      dueDate: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      actions: mockActions,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render nothing visible', () => {
    const { container } = render(<NotificationService />);
    expect(container.firstChild).toBeNull();
  });

  it('should check for due actions periodically', async () => {
    mockNotification.permission = 'granted';

    render(<NotificationService />);

    // Fast-forward time to trigger the interval
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    // Should have created a notification for the due task
    await waitFor(() => {
      expect(mockNotification).toHaveBeenCalled();
    });
  });

  it('should not notify for completed tasks', async () => {
    mockNotification.permission = 'granted';
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      actions: [mockActions[3]], // Only the completed task
    });

    render(<NotificationService />);

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should not create any notifications
    expect(mockNotification).not.toHaveBeenCalled();
  });

  it('should not notify for tasks without due dates', async () => {
    mockNotification.permission = 'granted';
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      actions: [mockActions[2]], // Only the no due date task
    });

    render(<NotificationService />);

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(mockNotification).not.toHaveBeenCalled();
  });
});

describe('useNotificationPermission', () => {
  const TestComponent = () => {
    const { permission, requestPermission } = useNotificationPermission();
    return (
      <div>
        <span data-testid="permission">{permission}</span>
        <button onClick={requestPermission}>Request</button>
      </div>
    );
  };

  beforeEach(() => {
    mockNotification.permission = 'default';
  });

  it('should return current permission status', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('permission').textContent).toBe('default');
  });

  it('should update permission after request', async () => {
    mockNotification.requestPermission = jest.fn().mockResolvedValue('granted');
    render(<TestComponent />);

    act(() => {
      screen.getByText('Request').click();
    });

    await waitFor(() => {
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });
  });
});
