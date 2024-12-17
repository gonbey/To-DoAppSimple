# API Endpoints Plan

## User Management
- POST /api/users/register - Register new user
- POST /api/users/login - User login
- POST /api/users/reset-password - Request password reset
- PUT /api/users/reset-password - Reset password with token

## Todo Management
- GET /api/todos - List user's todos
- POST /api/todos - Create new todo
- GET /api/todos/{id} - Get todo details
- PUT /api/todos/{id} - Update todo
- DELETE /api/todos/{id} - Delete todo

## Admin
- GET /api/admin/users - List all users
- PUT /api/admin/users/{id} - Update user
- GET /api/admin/todos - List all todos
- PUT /api/admin/todos/{id} - Update any todo
