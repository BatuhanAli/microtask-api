import React, { useEffect, useState } from "react";
import "./App.css";
import { createTask, getTasks, updateTask, deleteTask, getTask, toggleTaskCompletion } from "./api.js";
import { DragDropProvider } from './DragDropProvider';
import { SortableStepList } from './SortableComponents';

const API_URL = "http://localhost:8080";

// Hook to manage light/dark theme switching
function useTheme() {
  // Get saved theme from browser storage, default to light
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  // Apply theme to page and save to storage when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Switch between light and dark themes
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}

// Hook to manage task steps (add, remove, edit)
function useSteps(initialSteps = []) {
  const [steps, setSteps] = useState(initialSteps);
  const [newStepTitle, setNewStepTitle] = useState("");

  // Add a new step if title isn't empty
  const addStep = () => {
    if (newStepTitle.trim()) {
      setSteps(prev => [...prev, { 
        id: `step-${Date.now()}-${Math.random()}`, // Add unique ID for drag operations
        title: newStepTitle.trim(), 
        completed: false,
        order: prev.length + 1 
      }]);
      setNewStepTitle("");
    }
  };

  // Remove step at given index
  const removeStep = (index) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  // Update a specific field of a step
  const updateStep = (index, field, value) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ));
  };

  // Move step from one position to another (drag and drop)
  const moveStep = (fromIndex, toIndex) => {
    setSteps(prev => {
      const newSteps = [...prev];
      const [removed] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, removed);
      return newSteps.map((step, i) => ({ ...step, order: i + 1 }));
    });
  };

  // Handle drag end events from @dnd-kit
  const handleDragEnd = (event) => {
    try {
      const { active, over } = event;
      
      // Validate drag operation
      if (!active?.id || !over?.id || active.id === over.id) {
        return; // No change needed
      }
      
      // Find step indices by ID
      const oldIndex = steps.findIndex(step => step.id === active.id);
      const newIndex = steps.findIndex(step => step.id === over.id);
      
      // Validate indices exist
      if (oldIndex === -1 || newIndex === -1) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Drag-Drop] Invalid step indices during drag operation:', { 
            activeId: active.id, 
            overId: over.id,
            availableSteps: steps.map(s => s.id)
          });
        }
        return;
      }
      
      // Perform the move
      moveStep(oldIndex, newIndex);
    } catch (error) {
      console.error('[Drag-Drop] Error during drag operation:', error);
      // Steps remain in original order - graceful degradation
    }
  };

  return {
    steps,
    setSteps,
    newStepTitle,
    setNewStepTitle,
    addStep,
    removeStep,
    updateStep,
    moveStep,
    handleDragEnd
  };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  
  // UI state - which menus/modals are open
  const [activeMenuId, setActiveMenuId] = useState(null); // Which task's menu is open
  const [currentTask, setCurrentTask] = useState(null); // Task being edited
  const [showUpdateTask, setShowUpdateTask] = useState(false); // Show edit modal
  const [showCreateTask, setShowCreateTask] = useState(false); // Show create modal
  
  // Form fields for creating/editing tasks
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState("low");
  
  // Task filtering and sorting
  const [sortCompleted, setSortCompleted] = useState(false); // Show completed or incomplete
  const [tasks, setTasks] = useState([]); // All tasks from database
  const [sortMode, setSortMode] = useState("due_date"); // Sort by date or priority
  const [sortOrder, setSortOrder] = useState("desc"); // Ascending or descending

  // Step management for multi-step tasks
  const stepManager = useSteps();

  // Get all tasks from the server with current filters
  const fetchTasks = async () => {
    try {
      const data = await getTasks(sortCompleted, sortMode, sortOrder);
      setTasks(data || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  };

  // Create a new task with form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        title: title,
        description: description,
        due_date: dueDate,
        priority: priority,
        completed: false,
        steps: stepManager.steps
      });
      resetForm();
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  // Clear all form fields and close modals
  const resetForm = () => {
    setShowCreateTask(false);
    setShowUpdateTask(false);
    setTitle("");
    setDescription("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setPriority("low");
    stepManager.setSteps([]);
    stepManager.setNewStepTitle("");
    setCurrentTask(null);
  };

  // Save changes to an existing task
  const handleUpdate = async (task) => {
    try {
      await updateTask({
        id: task.id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        completed: task.completed,
        steps: stepManager.steps
      });
      resetForm();
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  // Delete a task permanently
  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Toggle the three-dot menu for a task
  const showMiniMenu = (task) => {
    setActiveMenuId(task.id === activeMenuId ? null : task.id);
    setCurrentTask(task);
  };

  // Mark task as complete/incomplete using the checkbox
  const handleToggleCompletion = async (taskId) => {
    try {
      await toggleTaskCompletion(taskId);
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
    }
  };

  // Mark a step as complete/incomplete and auto-complete task if all steps done
  const handleStepToggle = async (taskId, stepIndex) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.steps && task.steps[stepIndex]) {
        // Toggle the specific step
        const updatedSteps = task.steps.map((step, i) => 
          i === stepIndex ? { ...step, completed: !step.completed } : step
        );
        
        // Auto-complete task if all steps are done
        const allStepsCompleted = updatedSteps.every(step => step.completed);
        
        await updateTask({
          ...task,
          steps: updatedSteps,
          completed: allStepsCompleted && updatedSteps.length > 0
        });
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to toggle step completion:", error);
    }
  };

  // Open the edit modal with task data pre-filled
  const openEditModal = (task) => {
    setCurrentTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.due_date);
    setPriority(task.priority);
    stepManager.setSteps(task.steps || []);
    setShowUpdateTask(true);
    setActiveMenuId(null); // Close the menu
  };

  // Count how many steps are completed vs total
  const getCompletedStepsCount = (steps) => {
    if (!steps || steps.length === 0) return { completed: 0, total: 0 };
    const completed = steps.filter(step => step.completed).length;
    return { completed, total: steps.length };
  };

  // Refresh tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [sortCompleted, sortMode, sortOrder]);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the menu button or menu itself
      if (event.target.closest('.more-button') || event.target.closest('.mini-menu')) {
        return;
      }
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="app-container">
      {/* Light/Dark theme toggle button */}
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <h1 className="header">📚 Microtask Manager</h1>

      {/* Switch between completed and incomplete tasks */}
      <div className="filter-buttons">
        <button 
          className={sortCompleted ? "" : "active"} 
          onClick={() => setSortCompleted(false)}
        >
          Incomplete Tasks
        </button>
        <button 
          className={sortCompleted ? "active" : ""} 
          onClick={() => setSortCompleted(true)}
        >
          Completed Tasks
        </button>
      </div>

      {/* Sort options and add new task button */}
      <div className="sort-container">
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

        <button className="add-task-button" onClick={() => setShowCreateTask(true)}>
          Add New Task
        </button>
      </div>

      {/* Modal popup for creating new tasks */}
      {showCreateTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Task</h2>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                placeholder="Task Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              <textarea 
                placeholder="Description (optional)" 
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
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              {/* Multi-step task creation */}
              <div className="steps-section">
                <h3>Task Steps (Optional)</h3>
                <div className="step-input-group">
                  <input
                    type="text"
                    className="step-input"
                    placeholder="Add a step..."
                    value={stepManager.newStepTitle}
                    onChange={(e) => stepManager.setNewStepTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), stepManager.addStep())}
                  />
                  <button
                    type="button"
                    className="add-step-btn"
                    onClick={stepManager.addStep}
                  >
                    Add
                  </button>
                </div>

                {stepManager.steps.length > 0 && (
                  <DragDropProvider onDragEnd={stepManager.handleDragEnd}>
                    <SortableStepList
                      steps={stepManager.steps}
                      onUpdateStep={stepManager.updateStep}
                      onRemoveStep={stepManager.removeStep}
                    />
                  </DragDropProvider>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit">Create Task</button>
                <button type="button" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal popup for editing existing tasks */}
      {showUpdateTask && currentTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Task</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdate({
                ...currentTask,
                title,
                description,
                due_date: dueDate,
                priority,
              });
            }}>
              <input 
                type="text" 
                placeholder="Task Title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              <textarea 
                placeholder="Description (optional)" 
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
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              {/* Edit existing steps or add new ones */}
              <div className="steps-section">
                <h3>Task Steps</h3>
                <div className="step-input-group">
                  <input
                    type="text"
                    className="step-input"
                    placeholder="Add a step..."
                    value={stepManager.newStepTitle}
                    onChange={(e) => stepManager.setNewStepTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), stepManager.addStep())}
                  />
                  <button
                    type="button"
                    className="add-step-btn"
                    onClick={stepManager.addStep}
                  >
                    Add
                  </button>
                </div>

                {stepManager.steps.length > 0 && (
                  <DragDropProvider onDragEnd={stepManager.handleDragEnd}>
                    <SortableStepList
                      steps={stepManager.steps}
                      onUpdateStep={stepManager.updateStep}
                      onRemoveStep={stepManager.removeStep}
                    />
                  </DragDropProvider>
                )}
              </div>

              <div className="modal-actions">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main task list or empty state message */}
      <div className="task-list-container">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No tasks found</div>
            <div className="empty-state-description">
              {sortCompleted ? "No completed tasks yet. Complete some tasks to see them here!" : "Get started by creating your first task!"}
            </div>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const stepStats = getCompletedStepsCount(task.steps);
              return (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? 'task-completed' : 'task-incomplete'}`}
                >
                  <div className="task-header">
                    <div className="task-details">
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        <span className={`task-badge priority-${task.priority}`}>
                          {task.priority} priority
                        </span>
                        {stepStats.total > 0 && (
                          <span className="steps-progress">
                            Steps: {stepStats.completed}/{stepStats.total}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="task-actions">
                      {/* Three-dot menu button */}
                      <button 
                        className="more-button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          showMiniMenu(task);
                        }}
                      >
                        ⋮
                      </button>

                      {/* Complete/incomplete checkbox */}
                      <input
                        type="checkbox"
                        className="checkbox-toggle"
                        checked={task.completed}
                        onChange={() => handleToggleCompletion(task.id)}
                      />

                      {/* Edit/Delete dropdown menu */}
                      {activeMenuId === task.id && (
                        <div className="mini-menu">
                          <button onClick={() => openEditModal(task)}>Edit</button>
                          <button onClick={() => handleDelete(task.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Show individual steps if task has any */}
                  {task.steps && task.steps.length > 0 && (
                    <div className="task-steps">
                      <div className="steps-header">
                        <span className="steps-title">Steps</span>
                        <span className="steps-progress">
                          {stepStats.completed} of {stepStats.total} completed
                        </span>
                      </div>
                      <ul className="step-list">
                        {task.steps.map((step, stepIndex) => (
                          <li
                            key={stepIndex}
                            className={`step-item ${step.completed ? 'completed' : ''}`}
                          >
                            {/* Individual step checkbox */}
                            <input
                              type="checkbox"
                              className="step-checkbox"
                              checked={step.completed}
                              onChange={() => handleStepToggle(task.id, stepIndex)}
                            />
                            <span className="step-title">{step.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;