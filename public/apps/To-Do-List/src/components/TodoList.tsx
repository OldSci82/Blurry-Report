// src/components/TodoList.tsx
import type { Task } from "../types/Task";
import TodoItem from "./TodoItem";

interface TodoListProps {
  tasks: Task[];
  onToggle: (index: number) => void;
  onClear: () => void;
}

export default function TodoList({ tasks, onToggle, onClear }: TodoListProps) {
  return (
    <div className="listDisplay">
      {tasks.length === 0 ? (
        <p className="empty-message">🕹️ No current tasks. Add something to get started!</p>
      ) : (
        <>
          <ul id="todo-list">
            {tasks.map((task, index) => (
              <TodoItem
                key={index}
                task={task}
                index={index}
                onToggle={onToggle}
              />
            ))}
          </ul>
          <button className="clear-btn" onClick={onClear}>
            🧹 Remove Completed
          </button>
        </>
      )}
    </div>
  );
}
