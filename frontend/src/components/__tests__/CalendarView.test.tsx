import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalendarView } from '../CalendarView';
import { Task } from '../../api/tasks';

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test task',
  date: '2026-06-20',
  completed: false,
  priority: 'medium',
  aiGenerated: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
  ...overrides,
});

describe('CalendarView', () => {
  const onSelectDate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the correct month title', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    // Header + footer both display the month name
    const elements = screen.getAllByText('June 2026');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders all 7 weekday headers', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument();
    });
  });

  it('calls onSelectDate when a day is clicked', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    // Find the button for day 15 of June 2026
    const dayButton = screen.getByRole('button', { name: /2026-06-15/ });
    fireEvent.click(dayButton);
    expect(onSelectDate).toHaveBeenCalledWith('2026-06-15');
  });

  it('highlights the selected date', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    const selected = screen.getByRole('button', { name: /2026-06-20/ });
    expect(selected.className).toContain('bg-blue-600');
  });

  it('shows previous and next month navigation buttons', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
    expect(screen.getByLabelText('Next month')).toBeInTheDocument();
  });

  it('navigates to previous month when clicking prev button', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    fireEvent.click(screen.getByLabelText('Previous month'));
    const elements = screen.getAllByText('May 2026');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('navigates to next month when clicking next button', () => {
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={{}}
      />,
    );
    fireEvent.click(screen.getByLabelText('Next month'));
    const elements = screen.getAllByText('July 2026');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows task dot indicators when tasks exist', () => {
    const tasksByDate = {
      '2026-06-20': [makeTask({ id: 't1' }), makeTask({ id: 't2' })],
    };
    render(
      <CalendarView
        selectedDate="2026-06-15"
        onSelectDate={onSelectDate}
        tasksByDate={tasksByDate}
      />,
    );
    // The day cell with tasks has 2 dot elements
    const dayButton = screen.getByRole('button', { name: /2026-06-20.*2 tasks/ });
    expect(dayButton).toBeInTheDocument();
  });

  it('shows pending count in footer', () => {
    const tasksByDate = {
      '2026-06-20': [
        makeTask({ id: 't1', completed: false }),
        makeTask({ id: 't2', completed: true }),
      ],
    };
    render(
      <CalendarView
        selectedDate="2026-06-20"
        onSelectDate={onSelectDate}
        tasksByDate={tasksByDate}
      />,
    );
    expect(screen.getByText(/1 pending/)).toBeInTheDocument();
  });
});
