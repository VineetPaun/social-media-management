# Social Media Management Application

A full-stack Instagram-like social media platform built with React, Express, and PostgreSQL.

## Features

- **User Authentication** - Signup/signin with JWT tokens and password hashing
- **Post Management** - Create, view, and delete posts with images
- **Social Interactions** - Like/unlike posts and add comments
- **User Profiles** - View user profiles with post galleries
- **Search & Pagination** - Search posts by description with paginated results
- **Soft Delete** - Safe deletion of users, posts, and comments
- **Logging System** - Winston-based logging with database persistence
- **Rate Limiting** - API protection with request throttling

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Vite for build tooling
- CSS for styling

### Backend
- Node.js with Express
- TypeScript
- Drizzle ORM with Neon PostgreSQL
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- Winston for logging
- ValidatorJS for input validation

## Project Structure

```
social-media-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── api.ts         # API client
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── public/
├── server/                # Express backend
│   ├── src/
│   │   ├── configs/       # Database & logger config
│   │   ├── controllers/   # Route handlers
│   │   ├── middlewares/   # Auth, validation, uploads
│   │   ├── models/        # Database schemas
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   └── uploads/           # User-uploaded files
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)

### Environment Variables

Create `.env` file in `server/` directory:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Create `.env` file in `client/` directory (optional):
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Installation

1. **Install server dependencies:**
```bash
cd server
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
```

3. **Run database migrations:**
```bash
cd server
npx drizzle-kit push
```

### Running the Application

1. **Start the server (port 3000):**
```bash
cd server
npm run dev
```

2. **Start the client (port 5173):**
```bash
cd client
npm run dev
```

3. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## API Endpoints

### Authentication
- `POST /user/signup` - Register new user
- `POST /user/signin` - Login user

### User Management
- `GET /user/profile/:userId` - Get user profile
- `DELETE /user/delete` - Delete account

### Posts
- `POST /post/create` - Create new post
- `GET /post` - Get paginated posts (with search)
- `GET /post/:postId` - Get single post
- `PATCH /post/:postId` - Update post
- `DELETE /post/:postId` - Delete post

### Interactions
- `POST /post/:postId/like` - Toggle like/unlike
- `POST /post/:postId/comments` - Add comment
- `GET /post/:postId/comments` - Get comments
- `DELETE /post/comments/:commentId` - Delete comment

## Database Schema

### Users Table
- id, name, email, password (hashed)
- profilePic, createdAt, updatedAt
- isDeleted, deletedAt (soft delete)

### Posts Table
- id, userId, description, image
- createdAt, updatedAt
- isDeleted, deletedAt (soft delete)

### Likes Table
- userId, postId (composite primary key)
- createdAt

### Comments Table
- id, userId, postId, content
- createdAt, updatedAt
- isDeleted, deletedAt (soft delete)

### Logs Table
- id, level, message, timestamp, metadata

## Key Features Implementation

### Authentication Flow
1. User signs up with email/password (optional profile picture)
2. Password is hashed with bcrypt (10 rounds)
3. On signin, JWT token is generated (7-day expiry)
4. Token is stored in localStorage and sent with API requests
5. Server validates token and checks user status on protected routes

### File Upload
- Profile pictures: Max 2MB, stored in `/uploads/profiles/`
- Post images: Max 5MB, stored in `/uploads/posts/`
- Allowed formats: JPEG, PNG, WEBP
- Files named with timestamp + UUID for uniqueness

### Soft Delete
- Users, posts, and comments use soft delete pattern
- Records marked with `isDeleted=true` and `deletedAt` timestamp
- Deleted records excluded from queries but preserved in database
- Cascade behavior: Deleting user soft-deletes all their posts

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- File type and size validation

## Development Notes

### Client-Side State Management
- Authentication state persisted in localStorage
- Post refresh trigger for real-time updates
- Optimistic UI updates for likes/comments

### Error Handling
- Custom ApiError class for structured errors
- Global error handler with logging
- Field-level validation errors
- User-friendly error messages

### Logging System
- Winston logger with custom database transport
- Logs stored in database for persistence
- Color-coded console output
- Request/response logging with user tracking

## Scripts

### Server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

### Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT
