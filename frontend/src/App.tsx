import { useTasks } from './hooks/useTasks';
import { CalendarView } from './components/CalendarView';
import { TaskList } from './components/TaskList';
import { TaskInput } from './components/TaskInput';
import { AgentInput } from './components/AgentInput';

function App() {
  const {
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
  } = useTasks();

  return (
    <div className="w-[400px] min-h-[600px] bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white flex-shrink-0">
        <span className="font-bold text-base">Smart Task Hub</span>
        <button
          className="text-blue-200 hover:text-white transition-colors text-lg"
          aria-label="Settings"
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      {/* Calendar — top ~300px */}
      <div className="flex-none h-[300px] border-b border-gray-200 overflow-hidden">
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasksByDate={allTasksByDate}
        />
      </div>

      {/* Task panel — bottom ~300px */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Selected date label */}
        <div className="px-3 py-1.5 bg-white border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-blue-600">{selectedDate}</span>
          <span className="text-xs text-gray-400">
            {tasks.filter((t) => !t.completed).length} pending ·{' '}
            {tasks.filter((t) => t.completed).length} done
          </span>
        </div>

        {/* Task list */}
        <div className="flex-1 min-h-0 overflow-y-auto min-h-[60px]">
          <TaskList
            tasks={tasks}
            selectedDate={selectedDate}
            loading={loading}
            error={error}
            onToggle={toggleTask}
            onRemove={removeTask}
            onMove={moveTask}
          />
        </div>

        {/* Manual task input */}
        <div className="flex-shrink-0">
          <TaskInput onAdd={addTask} selectedDate={selectedDate} loading={loading} />
        </div>

        {/* AI Agent input — collapsible, pinned to bottom */}
        <AgentInput selectedDate={selectedDate} onTaskCreated={refreshTasks} />
      </div>
    </div>
  );
}

export default App;
