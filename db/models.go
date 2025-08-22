package db

// Individual step within a task (e.g., "Cut vegetables", "Cook ingredients")
type TaskStep struct {
	ID        int    `json:"id"`
	TaskID    int    `json:"task_id"`     // Which task this step belongs to
	Title     string `json:"title" binding:"required"`
	Order     int    `json:"order"`       // Step order (1, 2, 3...)
	Completed bool   `json:"completed"`   // Whether this step is done
}

// Main task with optional multi-step breakdown
type Task struct {
	ID          int        `json:"id"`
	Title       string     `json:"title" binding:"required"`                          // Task name (required)
	Description string     `json:"description,omitempty"`                             // Extra details (optional)
	DueDate     string     `json:"due_date" binding:"required"`                       // Date format: YYYY-MM-DD
	Priority    string     `json:"priority" binding:"required,oneof=low medium high"` // low, medium, or high
	Completed   bool       `json:"completed"`                                         // Overall task completion
	Steps       []TaskStep `json:"steps,omitempty"`                                   // List of steps (optional)
}
