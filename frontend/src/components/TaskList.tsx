import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import type { Task } from '../api/tasks';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
  loading: boolean;
  error: string | null;
  onToggle: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMove: (id: string, newDate: string) => Promise<void>;
}

export function TaskList({
  tasks,
  selectedDate,
  loading,
  error,
  onToggle,
  onRemove,
  onMove,
}: TaskListProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dragTargetDate, setDragTargetDate] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    setDragTargetDate(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // If dropped over a date string (from CalendarView drop zones), move there
    const overId = String(over.id);
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(overId) && overId !== selectedDate) {
      onMove(String(active.id), overId);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-gray-400 animate-pulse">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <span className="text-sm text-red-500">{error}</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-1 text-center px-4">
        <span className="text-2xl">📭</span>
        <span className="text-sm text-gray-400">No tasks for {selectedDate}</span>
        <span className="text-xs text-gray-300">Add one below or ask AI</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="flex-1 overflow-y-auto flex flex-col gap-1.5 px-3 py-2"
          aria-label={`Tasks for ${selectedDate}`}
        >
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTask ? (
          <div className="px-3 py-2 rounded-lg border-2 border-blue-400 bg-white shadow-xl text-sm text-gray-700 font-medium opacity-90">
            📋 {activeTask.title}
            {dragTargetDate && (
              <span className="ml-2 text-xs text-blue-500">
                → {dragTargetDate}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
