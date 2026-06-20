import { useState, KeyboardEvent } from 'react';

interface TaskInputProps {
  onAdd: (title: string) => Promise<void>;
  selectedDate: string;
  loading?: boolean;
}

export function TaskInput({ onAdd, selectedDate, loading = false }: TaskInputProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex gap-2 px-3 py-2 bg-white border-t border-gray-200">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Add task for ${selectedDate}…`}
        disabled={loading || submitting}
        className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        aria-label="New task title"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading || submitting}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Add task"
      >
        {submitting ? '…' : '+'}
      </button>
    </div>
  );
}
