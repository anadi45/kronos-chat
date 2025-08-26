# Authentication Setup Guide

This guide will help you set up the authentication system for Kronos Chat.

## Backend Setup

1. **Install new dependencies:**
```bash
cd server
pip install passlib[bcrypt] python-jose[cryptography] python-multipart
```

2. **Create and run the database migration:**
```bash
# Create the migration for password field
python create_auth_migration.py

# Run the migration
python run_migrations.py
```

3. **Start the backend server:**
```bash
python main.py
```

## Frontend Setup

1. **Install any new dependencies (if needed):**
```bash
cd client
npm install
```

2. **Start the frontend development server:**
```bash
npm run dev
```

## Testing the Authentication Flow

1. **Access the application** at `http://localhost:5173`

2. **Sign up a new user:**
   - You'll see the signup form
   - Fill in email, password, and optional name fields
   - Click "Create account"
   - You'll be automatically logged in

3. **Test login:**
   - Logout using the logout button in the header
   - Try logging in with your credentials

4. **Test protected routes:**
   - All the existing functionality (OAuth connections, auth configs, etc.) now requires authentication
   - Your user ID is automatically used for user-specific operations

## API Endpoints

The following authentication endpoints are now available:

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Login with email/password
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/logout` - Logout (clears token)

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Tokens expire after 30 minutes (configurable)
- Protected routes require valid JWT token
- Frontend automatically manages token storage and expiration

## Environment Variables

Add these to your `.env` file if you want to customize:

```env
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_ALGORITHM=HS256
```

## Database Schema

The user table now includes:
- `id` (UUID) - Primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `first_name`, `last_name` - Optional name fields
- `is_active` - Account status
- `created_at`, `updated_at` - Timestamps
- `last_login` - Last login timestamp
