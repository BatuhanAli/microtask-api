package main

import (
	"github.com/BatuhanAli/microtask-api/db"
	"github.com/BatuhanAli/microtask-api/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db.InitDB()

	r := gin.Default()

	r.Use(cors.Default())

	r.GET("/", func(c *gin.Context) {
		c.String(200, "🚀 API is running! Welcome to MicroTask Manager.")
	})

	r.POST("/tasks", handlers.CreateTask)
	r.GET("/tasks", handlers.GetTasks)
	r.GET("/tasks/:id", handlers.GetTaskByID)
	r.PUT("/tasks/:id", handlers.UpdateTask)
	r.PATCH("/tasks/:id", handlers.ToggleTaskCompletion)
	r.DELETE("/tasks/:id", handlers.DeleteTask)

	r.Run(":8080")
}
