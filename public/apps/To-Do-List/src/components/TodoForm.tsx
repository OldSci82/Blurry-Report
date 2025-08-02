// src/components/TodoForm.tsx
import { useState } from "react";
import type { Task } from "../types/Task";

interface TodoFormProps {
  onAdd: (task: Task) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    supplies: "",
    numberPeople: 1,
    time: 0,
    difficulty: "",
    complete: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
    const { name, value, type } = e.target;

    const fieldValue =
        type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;

    setFormState((prev) => ({
        ...prev,
        [name]: fieldValue,
    }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      name: formState.name.trim(),
      supplies: formState.supplies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      numberPeople: Number(formState.numberPeople),
      time: Number(formState.time),
      difficulty: formState.difficulty,
      complete: formState.complete,
    };
    onAdd(newTask);
    setFormState({
      name: "",
      supplies: "",
      numberPeople: 1,
      time: 0,
      difficulty: "",
      complete: false,
    });
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <h2>Add a New Task</h2>

      <input
        name="name"
        placeholder="Task Name"
        value={formState.name}
        onChange={handleChange}
        required
      />

      <input
        name="supplies"
        placeholder="Supplies (comma separated)"
        value={formState.supplies}
        onChange={handleChange}
      />

      <input
        type="number"
        name="numberPeople"
        placeholder="People"
        value={formState.numberPeople}
        onChange={handleChange}
        min={1}
        required
      />

      <input
        type="number"
        name="time"
        placeholder="Time (min)"
        value={formState.time}
        onChange={handleChange}
        min={0}
        required
      />

      <select
        name="difficulty"
        value={formState.difficulty}
        onChange={handleChange}
        required
      >
        <option value="">-- Select Difficulty --</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <label>
        <input
          type="checkbox"
          name="complete"
          checked={formState.complete}
          onChange={handleChange}
        />
        Completed?
      </label>

      <button type="submit">Add Task</button>
    </form>
  );
}
