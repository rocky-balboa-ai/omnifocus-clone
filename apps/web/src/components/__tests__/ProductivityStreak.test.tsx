import { render, screen } from '@testing-library/react';
import { ProductivityStreak, calculateStreak } from '../ProductivityStreak';
import { useAppStore } from '@/stores/app.store';
import { subDays, startOfDay } from 'date-fns';

// Mock the store
jest.mock('@/stores/app.store', () => ({
  useAppStore: jest.fn(),
}));

describe('calculateStreak', () => {
  it('should return 0 for no completed actions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('should return 1 for task completed today only', () => {
    const today = new Date();
    const actions = [
      { id: 'a1', status: 'completed', completedAt: today.toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(1);
  });

  it('should calculate consecutive days streak', () => {
    const today = startOfDay(new Date());
    const actions = [
      { id: 'a1', status: 'completed', completedAt: today.toISOString() },
      { id: 'a2', status: 'completed', completedAt: subDays(today, 1).toISOString() },
      { id: 'a3', status: 'completed', completedAt: subDays(today, 2).toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(3);
  });

  it('should stop counting when a day is missed', () => {
    const today = startOfDay(new Date());
    const actions = [
      { id: 'a1', status: 'completed', completedAt: today.toISOString() },
      { id: 'a2', status: 'completed', completedAt: subDays(today, 1).toISOString() },
      // Day 2 missing
      { id: 'a3', status: 'completed', completedAt: subDays(today, 3).toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(2);
  });

  it('should count streak starting from yesterday if nothing completed today', () => {
    const today = startOfDay(new Date());
    const actions = [
      // Nothing today
      { id: 'a1', status: 'completed', completedAt: subDays(today, 1).toISOString() },
      { id: 'a2', status: 'completed', completedAt: subDays(today, 2).toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(2);
  });

  it('should return 0 if no recent completions', () => {
    const today = startOfDay(new Date());
    const actions = [
      { id: 'a1', status: 'completed', completedAt: subDays(today, 10).toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(0);
  });

  it('should handle multiple completions per day', () => {
    const today = startOfDay(new Date());
    const actions = [
      { id: 'a1', status: 'completed', completedAt: today.toISOString() },
      { id: 'a2', status: 'completed', completedAt: today.toISOString() },
      { id: 'a3', status: 'completed', completedAt: subDays(today, 1).toISOString() },
    ];
    expect(calculateStreak(actions as any)).toBe(2);
  });
});

describe('ProductivityStreak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render streak count', () => {
    const today = new Date();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      actions: [
        { id: 'a1', status: 'completed', completedAt: today.toISOString() },
      ],
    });

    render(<ProductivityStreak />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/day streak/i)).toBeInTheDocument();
  });

  it('should show plural for multiple days', () => {
    const today = startOfDay(new Date());
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      actions: [
        { id: 'a1', status: 'completed', completedAt: today.toISOString() },
        { id: 'a2', status: 'completed', completedAt: subDays(today, 1).toISOString() },
        { id: 'a3', status: 'completed', completedAt: subDays(today, 2).toISOString() },
      ],
    });

    render(<ProductivityStreak />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/days streak/i)).toBeInTheDocument();
  });

  it('should show fire emoji for streaks >= 7', () => {
    const today = startOfDay(new Date());
    const actions = [];
    for (let i = 0; i < 10; i++) {
      actions.push({
        id: `a${i}`,
        status: 'completed',
        completedAt: subDays(today, i).toISOString(),
      });
    }

    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      actions,
    });

    render(<ProductivityStreak />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render compact mode', () => {
    const today = new Date();
    (useAppStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      actions: [
        { id: 'a1', status: 'completed', completedAt: today.toISOString() },
      ],
    });

    render(<ProductivityStreak compact />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
