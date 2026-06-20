import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../api/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'bg-gray-200 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-600',
};

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white',
        'hover:border-blue-300 transition-colors group',
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : '',
      ].join(' ')}
      data-testid={`task-item-${task.id}`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
        aria-label="Drag to reorder"
        title="Drag to move to another date"
      >
        ⠿
      </span>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Title */}
      <span
        className={[
          'flex-1 text-sm break-words min-w-0',
          task.completed ? 'line-through text-gray-400' : 'text-gray-800',
        ].join(' ')}
      >
        {task.title}
      </span>

      {/* Priority badge */}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}
      >
        {task.priority}
      </span>

      {/* AI badge */}
      {task.aiGenerated && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium flex-shrink-0"
          title="AI-generated task"
        >
          AI
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={() => onRemove(task.id)}
        className="ml-auto text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center"
        aria-label={`Delete task "${task.title}"`}
      >
        ✕
      </button>
    </div>
  );
}
