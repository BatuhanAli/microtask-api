package db

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title" binding:"required"`                          // required
	Description string `json:"description,omitempty"`                             // optional
	DueDate     string `json:"due_date" binding:"required"`                       // (YYYY-MM-DD)
	Priority    string `json:"priority" binding:"required,oneof=low medium high"` // e.g., "low", "medium", "high"
	Completed   bool   `json:"completed"`
}
