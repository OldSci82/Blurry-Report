// src/components/TodoItem.tsx
import type { Task } from "../types/Task";

interface TodoItemProps {
  task: Task;
  index: number;
  onToggle: (index: number) => void;
}

export default function TodoItem({ task, index, onToggle }: TodoItemProps) {
  return (
    <li className={`todo-item ${task.complete ? "completed-task" : ""}`}>
      <div className="todo-info">
        <h3>{task.name}</h3>
        <p>
          Difficulty: {task.difficulty} | People: {task.numberPeople} | Time:{" "}
          {task.time} min
        </p>
        {task.supplies.length > 0 && (
          <p>🧰 Supplies: {task.supplies.join(", ")}</p>
        )}
      </div>

      <div className="todo-actions">
        <input
          type="checkbox"
          checked={task.complete}
          onChange={() => onToggle(index)}
        />
      </div>
    </li>
  );
}
