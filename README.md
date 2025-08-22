# 📋 MicroTask Manager

A full-stack task management application with drag-and-drop functionality, built with Go (Gin) backend and React frontend.

## 🚀 Features

### Backend API
- RESTful API for task management (CRUD operations)
- SQLite database for data persistence
- Task ordering and priority management
- CORS enabled for frontend integration

### Frontend
- React-based user interface
- Drag-and-drop task reordering
- Real-time task updates
- Responsive design with custom theming
- Modal-based task creation and editing

## 🛠 Tech Stack

**Backend:**
- Go with Gin web framework
- SQLite database
- RESTful API architecture

**Frontend:**
- React
- CSS3 with custom theming
- Drag-and-drop functionality

## 📁 Project Structure

```
microtask-api/
├── db/
│   ├── db.go           # Database connection and models
│   └── models.go       # Data models and schemas
├── handlers/
│   └── task.go         # Task API handlers
├── microtask-frontend/
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   ├── DragDropProvider.js    # Drag-drop context
│   │   ├── SortableComponents.js  # Sortable UI components
│   │   ├── dragUtils.js           # Drag-drop utilities
│   │   ├── api.js      # API client
│   │   └── theme.css   # Custom styling
│   └── package.json    # Frontend dependencies
├── main.go             # Server entry point
├── go.mod              # Go dependencies
└── tasks.db            # SQLite database
```

## 🔧 Setup Instructions

### Prerequisites
- Go 1.19 or higher
- Node.js and npm

### 1. Clone and Setup Backend

```bash
git clone <repository-url>
cd microtask-api
go mod download
go run main.go
```

Backend server starts at: http://localhost:8080

### 2. Setup Frontend

```bash
cd microtask-frontend
npm install
npm start
```

Frontend application starts at: http://localhost:3000

## 🔌 API Endpoints

| Method | Endpoint     | Description                    |
| ------ | ------------ | ------------------------------ |
| GET    | `/`          | Welcome message                |
| GET    | `/tasks`     | Get all tasks (ordered)        |
| GET    | `/tasks/:id` | Get specific task              |
| POST   | `/tasks`     | Create new task                |
| PUT    | `/tasks/:id` | Update task                    |
| DELETE | `/tasks/:id` | Delete task                    |
| PUT    | `/tasks/reorder` | Update task order (drag-drop) |

## 📦 API Data Format

### Task Object
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "due_date": "2025-08-25",
  "priority": "High",
  "completed": false,
  "order_index": 1
}
```

### Create Task
```json
{
  "title": "New Task",
  "description": "Task description",
  "due_date": "2025-08-25",
  "priority": "Medium",
  "completed": false
}
```

## 🎯 Key Features

- **Drag & Drop**: Intuitive task reordering with visual feedback
- **Persistent Order**: Task positions saved to database
- **Real-time Updates**: Changes reflected immediately
- **Responsive Design**: Works on desktop and mobile
- **Clean UI**: Modern interface with custom theming
