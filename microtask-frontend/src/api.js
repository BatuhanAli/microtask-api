const API_URL = "http://localhost:8080";

export const getTasks = async (sortCompleted, sortField, sortValue) => {
  try {
    const res = await fetch("http://localhost:8080/tasks?sort=" + sortField + "&order=" + sortValue + "&completed=" + sortCompleted);
    const data = await res.json();
    return data || []; // Ensure fallback to empty array
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    return [];
  }
};

export const createTask = async (task) => {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  console.log("Creating task:", task);
  return res.json();
};

export const updateTask = async (task) => {
  const res = await fetch(`${API_URL}/tasks/${task.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return res.json();
}

export const deleteTask = async (taskId) => {
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete task");
  }
  return res.json();
}

export const getTask = async (taskId) => {
  const res = await fetch(`${API_URL}/tasks/${taskId}`);
  if (!res.ok) {
    throw new Error("Task not found");
  }
  return res.json();
}

export const toggleTaskCompletion = async (taskId) => {
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PATCH",
  });
  if (!res.ok) {
    throw new Error("Failed to toggle task completion");
  }
  return res.json();
}