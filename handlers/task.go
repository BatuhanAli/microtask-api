package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/BatuhanAli/microtask-api/db"
	"github.com/gin-gonic/gin"
)

// Create a new task with optional steps
func CreateTask(c *gin.Context) {
	var task db.Task

	// Parse JSON from request body
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Start database transaction (rollback if anything fails)
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Insert the main task
	stmt, err := tx.Prepare("INSERT INTO tasks (title, description, due_date, priority, completed) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare query"})
		return
	}
	defer stmt.Close()

	result, err := stmt.Exec(task.Title, task.Description, task.DueDate, task.Priority, task.Completed)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute query"})
		return
	}

	insertedID, _ := result.LastInsertId()
	task.ID = int(insertedID)

	// Insert each step if any were provided
	for i, step := range task.Steps {
		stepStmt, err := tx.Prepare("INSERT INTO task_steps (task_id, title, step_order, completed) VALUES (?, ?, ?, ?)")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare step query"})
			return
		}
		_, err = stepStmt.Exec(task.ID, step.Title, i+1, step.Completed)
		stepStmt.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert step"})
			return
		}
	}

	// Save all changes to database
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Return the complete task with steps
	createdTask, err := getTaskWithSteps(task.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created task"})
		return
	}

	c.JSON(http.StatusCreated, createdTask)
}

// Get all tasks with filtering and sorting options
func GetTasks(c *gin.Context) {
	// Parse URL parameters for filtering/sorting
	completedParam := c.Query("completed") // ?completed=true or ?completed=false
	sortParam := c.Query("sort")           // ?sort=due_date or ?sort=priority
	orderParam := c.Query("order")         // ?order=asc or ?order=desc

	var rows *sql.Rows
	var err error
	var query string = `SELECT id, title, description, due_date, priority, completed FROM tasks`

	if completedParam != "" {
		var completedIntRepresentation int = 0 // default 0 for false, 1 for true
		if completedParam == "true" {
			completedIntRepresentation = 1
		}

		query += ` WHERE completed = ` + strconv.Itoa(completedIntRepresentation)
	}

	if sortParam == "due_date" || sortParam == "priority" {
		query += ` ORDER BY `

		if sortParam == "due_date" {
			query += `due_date`

			if orderParam == "asc" {
				query += ` ASC`
			} else {
				query += ` DESC`
			}
		} else {
			query += " CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END"

			if orderParam == "asc" {
				query += ` DESC`
			} else {
				query += ` ASC`
			}
		}

	}

	// Execute the built query
	rows, err = db.DB.Query(query)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	defer rows.Close()

	// Build list of tasks with their steps
	var tasks []db.Task
	for rows.Next() {
		var t db.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.DueDate, &t.Priority, &t.Completed)
		if err != nil {
			continue
		}
		// Get all steps for this task
		steps, _ := getTaskSteps(t.ID)
		t.Steps = steps
		tasks = append(tasks, t)
	}

	c.JSON(http.StatusOK, tasks)
}

// Get a single task by its ID
func GetTaskByID(c *gin.Context) {
	id := c.Param("id")
	taskID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Fetch task with all its steps
	task, err := getTaskWithSteps(taskID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// Update an existing task and its steps
func UpdateTask(c *gin.Context) {
	id := c.Param("id")
	taskID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Parse updated task data from request
	var updated db.Task
	if err := c.ShouldBindJSON(&updated); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Start transaction for atomic updates
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Update the main task fields
	_, err = tx.Exec(
		`UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, completed = ? WHERE id = ?`,
		updated.Title, updated.Description, updated.DueDate, updated.Priority, updated.Completed, taskID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	// Remove all old steps (we'll replace with new ones)
	_, err = tx.Exec(`DELETE FROM task_steps WHERE task_id = ?`, taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing steps"})
		return
	}

	// Add all the new/updated steps
	for i, step := range updated.Steps {
		stepStmt, err := tx.Prepare("INSERT INTO task_steps (task_id, title, step_order, completed) VALUES (?, ?, ?, ?)")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare step query"})
			return
		}
		_, err = stepStmt.Exec(taskID, step.Title, i+1, step.Completed)
		stepStmt.Close()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert step"})
			return
		}
	}

	// Save all changes
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Return the updated task with steps
	updatedTask, err := getTaskWithSteps(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated task"})
		return
	}

	c.JSON(http.StatusOK, updatedTask)
}

// Toggle task between complete and incomplete
func ToggleTaskCompletion(c *gin.Context) {
	id := c.Param("id")

	// Flip the completed status
	_, err := db.DB.Exec(`UPDATE tasks SET completed = NOT completed WHERE id = ?`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle task status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task completion status toggled"})
}

// Delete a task and all its steps
func DeleteTask(c *gin.Context) {
	id := c.Param("id")

	// Start transaction to ensure atomicity
	tx, err := db.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Explicitly delete task steps first
	_, err = tx.Exec(`DELETE FROM task_steps WHERE task_id = ?`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task steps"})
		return
	}

	// Delete the main task
	result, err := tx.Exec(`DELETE FROM tasks WHERE id = ?`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	// Check if task was actually deleted
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check deletion result"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task and all steps deleted successfully"})
}

// Helper functions

// Get a complete task with all its steps
func getTaskWithSteps(taskID int) (db.Task, error) {
	var task db.Task
	// Get main task data
	err := db.DB.QueryRow(`SELECT id, title, description, due_date, priority, completed FROM tasks WHERE id = ?`, taskID).
		Scan(&task.ID, &task.Title, &task.Description, &task.DueDate, &task.Priority, &task.Completed)
	if err != nil {
		return task, err
	}

	// Get all steps for this task
	steps, err := getTaskSteps(taskID)
	if err != nil {
		return task, err
	}
	task.Steps = steps

	return task, nil
}

// Get all steps for a specific task
func getTaskSteps(taskID int) ([]db.TaskStep, error) {
	rows, err := db.DB.Query(`SELECT id, task_id, title, step_order, completed FROM task_steps WHERE task_id = ? ORDER BY step_order`, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Build list of steps
	var steps []db.TaskStep
	for rows.Next() {
		var step db.TaskStep
		err := rows.Scan(&step.ID, &step.TaskID, &step.Title, &step.Order, &step.Completed)
		if err != nil {
			continue
		}
		steps = append(steps, step)
	}

	return steps, nil
}
