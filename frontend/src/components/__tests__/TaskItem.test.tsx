import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskItem } from '../TaskItem';
import { Task } from '../../api/tasks';

// Mock @dnd-kit to avoid complex drag context in unit tests
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

const baseTask: Task = {
  id: 'task-1',
  title: 'Test task',
  date: '2026-06-20',
  completed: false,
  priority: 'medium',
  aiGenerated: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
};

describe('TaskItem', () => {
  const onToggle = vi.fn().mockResolvedValue(undefined);
  const onRemove = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('renders unchecked checkbox when not completed', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checked checkbox when completed', () => {
    render(
      <TaskItem
        task={{ ...baseTask, completed: true }}
        onToggle={onToggle}
        onRemove={onRemove}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('applies line-through style when completed', () => {
    render(
      <TaskItem
        task={{ ...baseTask, completed: true }}
        onToggle={onToggle}
        onRemove={onRemove}
      />,
    );
    const title = screen.getByText('Test task');
    expect(title.className).toContain('line-through');
  });

  it('calls onToggle when checkbox is clicked', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('calls onRemove when delete button is clicked', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByLabelText('Delete task "Test task"'));
    expect(onRemove).toHaveBeenCalledWith('task-1');
  });

  it('shows priority badge', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows high priority badge with correct style', () => {
    render(
      <TaskItem
        task={{ ...baseTask, priority: 'high' }}
        onToggle={onToggle}
        onRemove={onRemove}
      />,
    );
    const badge = screen.getByText('high');
    expect(badge.className).toContain('bg-red-100');
  });

  it('shows AI badge for aiGenerated tasks', () => {
    render(
      <TaskItem
        task={{ ...baseTask, aiGenerated: true }}
        onToggle={onToggle}
        onRemove={onRemove}
      />,
    );
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('does not show AI badge for non-AI tasks', () => {
    render(
      <TaskItem task={baseTask} onToggle={onToggle} onRemove={onRemove} />,
    );
    expect(screen.queryByText('AI')).not.toBeInTheDocument();
  });
});
