import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  tasksApi,
} from '../api/tasks';

interface UseTasksReturn {
  tasks: Task[];
  allTasksByDate: Record<string, Task[]>;
  selectedDate: string;
  loading: boolean;
  error: string | null;
  setSelectedDate: (date: string) => void;
  addTask: (title: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  moveTask: (id: string, newDate: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  refreshTasks: (date?: string) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  // Cache tasks per date for dot indicators on the calendar
  const [allTasksByDate, setAllTasksByDate] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async (date?: string) => {
    const target = date ?? selectedDate;
    setLoading(true);
    setError(null);
    try {
      const fetched = await tasksApi.getByDate(target);
      setTasks(fetched);
      setAllTasksByDate((prev) => ({ ...prev, [target]: fetched }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Reload when selected date changes
  useEffect(() => {
    refreshTasks(selectedDate);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTask = useCallback(
    async (title: string) => {
      const payload: CreateTaskPayload = { title, date: selectedDate };
      try {
        const created = await tasksApi.create(payload);
        setTasks((prev) => [...prev, created]);
        setAllTasksByDate((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] ?? []), created],
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create task');
      }
    },
    [selectedDate],
  );

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const payload: UpdateTaskPayload = { completed: !task.completed };
    try {
      const updated = await tasksApi.update(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setAllTasksByDate((prev) => ({
        ...prev,
        [updated.date]: (prev[updated.date] ?? []).map((t) =>
          t.id === id ? updated : t,
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [tasks]);

  const moveTask = useCallback(
    async (id: string, newDate: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.date === newDate) return;
      const oldDate = task.date;
      const payload: UpdateTaskPayload = { date: newDate };
      try {
        const updated = await tasksApi.update(id, payload);
        // Remove from old date cache, add to new date cache
        setAllTasksByDate((prev) => ({
          ...prev,
          [oldDate]: (prev[oldDate] ?? []).filter((t) => t.id !== id),
          [newDate]: [...(prev[newDate] ?? []), updated],
        }));
        // Update current view tasks
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to move task');
      }
    },
    [tasks],
  );

  const removeTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      try {
        await tasksApi.remove(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setAllTasksByDate((prev) => ({
          ...prev,
          [task.date]: (prev[task.date] ?? []).filter((t) => t.id !== id),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete task');
      }
    },
    [tasks],
  );

  return {
    tasks,
    allTasksByDate,
    selectedDate,
    loading,
    error,
    setSelectedDate,
    addTask,
    toggleTask,
    moveTask,
    removeTask,
    refreshTasks,
  };
}
