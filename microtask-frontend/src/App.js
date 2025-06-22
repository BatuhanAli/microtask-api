// File: src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";
import "./api.js";
import { createTask, getTasks, updateTask, deleteTask, getTask, toggleTaskCompletion } from "./api.js";

const API_URL = "http://localhost:8080";

function App() {
  // State variables for task creation and management
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [showUpdateTask, setShowUpdateTask] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState("Low");
  // Sorting options
  const [sortCompleted, setSortCompleted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [sortMode, setSortMode] = useState("due_date");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchTasks = async () => {
    const data = await getTasks(sortCompleted, sortMode, sortOrder);
    setTasks(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        title: title,
        description: description,
        due_date: dueDate,
        priority: priority.toLocaleLowerCase(),
        completed: false,
      });
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const resetForm = () => {
    setShowCreateTask(false);
    setTitle("");
    setDescription("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setPriority("Low");
  };

  const handleUpdate = async (task) => {
    try {
      await updateTask({
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority.toLocaleLowerCase(),
        completed: task.completed,
      });
      setShowUpdateTask(false);
      setCurrentTask(null);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const showMiniMenu = (task) => {
    setActiveMenuId(task.id === activeMenuId ? null : task.id);
    setCurrentTask(task);
  };

  const handleToggleCompletion = async (taskId) => {
    try {
      await toggleTaskCompletion(taskId);
      fetchTasks();
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [sortCompleted, sortMode, sortOrder]);

return (
  <div className="app-container">
    <h1 className="header">Microtask Manager</h1>

    <div className="top-controls">
      <button className="add-task-button" onClick={() => setShowCreateTask(true)}>
        Add New Task
      </button>

      {showCreateTask && (
        <div className="modal-overlay">
          <div className="modal">
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Task Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                required 
              />
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <div className="modal-actions">
                <button type="submit">Create Task</button>
                <button type="button" onClick={() => setShowCreateTask(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    <div className="sort-controls">
      <label>Sort By:</label>
      <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
        <option value="due_date">Due Date</option>
        <option value="priority">Priority</option>
      </select>
      <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>

    <div className="filter-buttons">
      <button onClick={() => setSortCompleted(false)}>Incomplete Tasks</button>
      <button onClick={() => setSortCompleted(true)}>Completed Tasks</button>
    </div>

    <div className="task-list-container">
      <h2>Tasks</h2>
      <ul className="task-list">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`task-item ${sortCompleted ? 'task-complete' : 'task-incomplete'}`}
          >
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>
            <p>Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>
            <p>Status: {task.completed ? "Completed" : "Incomplete"}</p>
            <button onClick={() => handleToggleCompletion(task.id)}>
              {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
            </button>
            <button onClick={() => showMiniMenu(task)}>More</button>
            {activeMenuId === task.id && (
              <div className="mini-menu">
                <button onClick={() => {
                  setShowUpdateTask(true);
                  setCurrentTask(task);
                  setTitle(task.title);
                  setDescription(task.description);
                  setDueDate(task.due_date);
                  setPriority(task.priority.charAt(0).toUpperCase() + task.priority.slice(1));
                }}>Edit</button>
                <button onClick={() => handleDelete(task.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>

    <div>
      {showUpdateTask && (
        <div className="modal-overlay">
          <div className="modal">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdate({
                ...currentTask,
                title,
                description,
                due_date: dueDate,
                priority: priority.toLowerCase(),
              });
            }}>
              <input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowUpdateTask(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default App;
