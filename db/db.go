package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB sets up the database connection and schema
func InitDB() {
	var err error
	DB, err = sql.Open("sqlite", "./tasks.db")
	if err != nil {
		panic(err)
	}

	createTable := `
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0
    );
    `

	_, err = DB.Exec(createTable)
	if err != nil {
		panic(fmt.Sprintf("Error creating tasks table: %v", err))
	}

	fmt.Println("✅ Connected to SQLite and ensured tasks table exists.")
}
