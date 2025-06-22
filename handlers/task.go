package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/BatuhanAli/microtask-api/db"
	"github.com/gin-gonic/gin"
)

func CreateTask(c *gin.Context) {
	var task db.Task

	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	stmt, err := db.DB.Prepare("INSERT INTO tasks (title, description, due_date, priority, completed) VALUES (?, ?, ?, ?, ?)")
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

	c.JSON(http.StatusCreated, task)
}

func GetTasks(c *gin.Context) {
	completedParam := c.Query("completed") // gets ?completed=true or ?completed=false
	sortParam := c.Query("sort")           // e.g. due_date, priority
	orderParam := c.Query("order")         // e.g. asc, desc   used in unison with sortParam default is desc

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

	rows, err = db.DB.Query(query)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	defer rows.Close()

	var tasks []db.Task
	for rows.Next() {
		var t db.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.DueDate, &t.Priority, &t.Completed)
		if err != nil {
			continue
		}
		tasks = append(tasks, t)
	}

	c.JSON(http.StatusOK, tasks)
}

func GetTaskByID(c *gin.Context) {
	id := c.Param("id")

	var t db.Task
	err := db.DB.QueryRow(`SELECT id, title, description, due_date, priority, completed FROM tasks WHERE id = ?`, id).
		Scan(&t.ID, &t.Title, &t.Description, &t.DueDate, &t.Priority, &t.Completed)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, t)
}

func UpdateTask(c *gin.Context) {
	id := c.Param("id")
	var updated db.Task

	if err := c.ShouldBindJSON(&updated); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := db.DB.Exec(
		`UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, completed = ? WHERE id = ?`,
		updated.Title, updated.Description, updated.DueDate, updated.Priority, updated.Completed, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	updated.ID, _ = strconv.Atoi(id)
	c.JSON(http.StatusOK, updated)
}

func ToggleTaskCompletion(c *gin.Context) {
	id := c.Param("id")

	_, err := db.DB.Exec(`UPDATE tasks SET completed = NOT completed WHERE id = ?`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to toggle task status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task completion status toggled"})
}

func DeleteTask(c *gin.Context) {
	id := c.Param("id")

	_, err := db.DB.Exec(`DELETE FROM tasks WHERE id = ?`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
