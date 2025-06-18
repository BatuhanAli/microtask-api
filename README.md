# 📋 MicroTask Manager API

A simple yet powerful RESTful API built with [Go](https://golang.org/) and the [Gin](https://github.com/gin-gonic/gin) web framework. This API allows you to manage tasks, track their completion status, set priorities, and more.

---

## 🚀 Features

- Create, Read, Update, and Delete tasks
- Track task completion
- Set due dates and priorities
- Toggle completion status
- Built with SQLite (lightweight and fast)
- CORS enabled for frontend integration

---

## 🛠 Tech Stack

- **Language:** Go
- **Framework:** Gin
- **Database:** SQLite
- **Architecture:** REST API

---

## 📁 Project Structure

```
microtask-api/
├── db/
│   └── db.go           # Database connection and initialization
├── handlers/
│   └── task.go         # All task-related handler logic
├── main.go             # Entry point, route definitions
├── go.mod              # Go module definition
├── go.sum              # Dependency checksums
└── README.md           # Project documentation
```

---

## 🔧 Setup Instructions

### 1. Clone the Repository

bash
```
git clone https://github.com/YOUR_USERNAME/microtask-api.git
cd microtask-api
```

### 2. Run the API

```
go run main.go
```

The server will start at: http://localhost:8080

---

## 🔌 API Endpoints

| Method | Endpoint     | Description       |
| ------ | ------------ | ----------------- |
| GET    | `/`          | Welcome message   |
| GET    | `/tasks`     | List all tasks    |
| GET    | `/tasks/:id` | Get task by ID    |
| POST   | `/tasks`     | Create a new task |
| PUT    | `/tasks/:id` | Update a task     |
| DELETE | `/tasks/:id` | Delete a task     |

---

## 📦 Example JSON Payload

```
{
  "title": "Build a frontend",
  "description": "React or Svelte frontend for the API",
  "due_date": "2025-06-20",
  "priority": "High",
  "completed": false
}
```
