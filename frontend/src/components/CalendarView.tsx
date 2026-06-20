import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { Task } from '../api/tasks';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  tasksByDate: Record<string, Task[]>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({
  selectedDate,
  onSelectDate,
  tasksByDate,
}: CalendarViewProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Leading blank cells so the calendar starts on the right weekday
  const startOffset = getDay(monthStart);

  const prevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const nextMonth = () => setViewMonth((m) => addMonths(m, 1));

  return (
    <div className="calendar-view flex flex-col h-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-500 transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-semibold text-sm">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-500 transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-blue-50">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 bg-white">
        {/* Blank cells before month start */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`blank-${i}`} className="border-b border-r border-gray-100" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const dayTasks = tasksByDate[dateStr] ?? [];
          const hasTasks = dayTasks.length > 0;
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={[
                'relative flex flex-col items-center justify-start pt-1 pb-1 border-b border-r border-gray-100',
                'transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isToday
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : !isCurrentMonth
                  ? 'text-gray-300'
                  : 'text-gray-700 hover:bg-blue-50',
              ].join(' ')}
              aria-label={`${dateStr}${hasTasks ? `, ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}` : ''}`}
              aria-pressed={isSelected}
            >
              <span className="leading-none font-medium">
                {format(day, 'd')}
              </span>

              {/* Task dots */}
              {hasTasks && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className={[
                        'w-1 h-1 rounded-full',
                        isSelected
                          ? 'bg-white'
                          : t.completed
                          ? 'bg-gray-400'
                          : 'bg-blue-500',
                      ].join(' ')}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span
                      className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-gray-400'}`}
                    >
                      +{dayTasks.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="px-3 py-1 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 flex justify-between">
        <span>{format(viewMonth, 'MMMM yyyy')}</span>
        <span>
          {Object.values(tasksByDate).flat().filter((t) => !t.completed).length} pending
        </span>
      </div>
    </div>
  );
}
