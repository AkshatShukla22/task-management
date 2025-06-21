# Task Management Backend

A robust task management backend API built with Express.js and MongoDB, converted from Supabase PostgreSQL schema.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **Task Management**: Full CRUD operations for tasks with filtering, pagination, and bulk operations
- **Role-Based Access**: User and Admin roles with appropriate permissions
- **Data Validation**: Comprehensive input validation using express-validator
- **Security**: Helmet for security headers, CORS, rate limiting, and password hashing
- **Error Handling**: Centralized error handling with custom error responses
- **Database**: MongoDB with Mongoose ODM

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /me` - Get current user
- `PUT /me` - Update current user
- `PUT /updatepassword` - Update password
- `POST /logout` - Logout user

### Profile Routes (`/api/profiles`)
- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `GET /me/stats` - Get profile statistics
- `DELETE /me` - Deactivate account
- `GET /` - Get all profiles (Admin only)
- `GET /:id` - Get single profile (Admin only)
- `PUT /:id` - Update profile (Admin only)

### Task Routes (`/api/tasks`)
- `GET /` - Get user's tasks with filtering and pagination
- `POST /` - Create new task
- `GET /:id` - Get single task
- `PUT /:id` - Update task
- `DELETE /:id` - Delete task
- `GET /stats/overview` - Get task statistics
- `PATCH /bulk/status` - Bulk update task status
- `GET /admin/all` - Get all tasks (Admin only)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/taskmanagement
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   ```

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Database Schema

### User Model
- `name`: String (required, 2-100 chars)
- `email`: String (required, unique, validated)
- `password`: String (required, min 6 chars, hashed)
- `role`: String (enum: 'user', 'admin', default: 'user')
- `isActive`: Boolean (default: true)
- `timestamps`: createdAt, updatedAt

### Task Model
- `user`: ObjectId (ref to User, required)
- `title`: String (required, max 200 chars)
- `description`: String (required, max 1000 chars)
- `status`: String (enum: 'Pending', 'In Progress', 'Completed')
- `deadline`: Date (required, must be future)
- `priority`: String (enum: 'Low', 'Medium', 'High')
- `tags`: Array of Strings (max 50 chars each)
- `completedAt`: Date (auto-set when status = 'Completed')
- `timestamps`: createdAt, updatedAt

## Key Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Account deactivation instead of deletion

### Task Management
- Full CRUD operations
- Status tracking with automatic completion timestamps
- Priority levels and tagging system
- Deadline validation and overdue detection
- Bulk operations for efficiency

### Data Validation
- Comprehensive input validation
- Custom error messages
- Sanitization and normalization
- Future date validation for deadlines

### Security Features
- Helmet for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Password hashing with salt rounds
- JWT token expiration

### Error Handling
- Centralized error handling middleware
- Custom error responses
- Mongoose error transformation
- Development vs production error details

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // Validation errors if applicable
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "pagination": {
    "next": { "page": 2, "limit": 25 },
    "prev": { "page": 1, "limit": 25 }
  },
  "data": []
}
```

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task management API",
    "deadline": "2025-07-01T10:00:00.000Z",
    "priority": "High"
  }'
```

### Get Tasks with Filters
```bash
curl "http://localhost:5000/api/tasks?status=Pending&priority=High&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development

### Project Structure
```
├── models/
│   ├── User.js
│   └── Task.js
├── routes/
│   ├── auth.js
│   ├── profiles.js
│   └── tasks.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── server.js
├── package.json
└── README.md
```

### Adding New Features
1. Create/update models in `models/` directory
2. Add routes in `routes/` directory
3. Create middleware if needed in `middleware/` directory
4. Update server.js to include new routes
5. Add validation using express-validator
6. Update this README

## Migration from Supabase

This backend replicates the functionality of your original Supabase setup:

- **Row Level Security** → JWT authentication + route protection
- **Triggers for updated_at** → Mongoose middleware
- **User profile creation trigger** → Handled in registration
- **PostgreSQL** → MongoDB with equivalent schema
- **Supabase Auth** → Custom JWT authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License