package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

var DB *sql.DB // Global database connection

// Connect to SQLite database and create tables if they don't exist
func InitDB() {
	var err error
	// Open SQLite database file (creates if doesn't exist)
	DB, err = sql.Open("sqlite", "./tasks.db")
	if err != nil {
		panic(err)
	}

	// Main tasks table
	createTasksTable := `
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0
    );
    `

	// Steps table - linked to tasks table
	createStepsTable := `
    CREATE TABLE IF NOT EXISTS task_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    `

	// Create the tables
	_, err = DB.Exec(createTasksTable)
	if err != nil {
		panic(fmt.Sprintf("Error creating tasks table: %v", err))
	}

	_, err = DB.Exec(createStepsTable)
	if err != nil {
		panic(fmt.Sprintf("Error creating task_steps table: %v", err))
	}

	fmt.Println("✅ Connected to SQLite and ensured tasks table exists.")
}
