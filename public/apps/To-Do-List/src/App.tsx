// src/App.tsx
import { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import type { Task } from './types/Task';
import './styles.css';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from localStorage on initial render
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const toggleTask = (index: number) => {
    setTasks(
      tasks.map((task, i) =>
        i === index ? { ...task, complete: !task.complete } : task
      )
    );
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((task) => !task.complete));
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Todo List</h1>
      </header>
      <TodoForm onAdd={addTask} />
      <TodoList tasks={tasks} onToggle={toggleTask} onClear={clearCompleted} />
    </div>
  );
}