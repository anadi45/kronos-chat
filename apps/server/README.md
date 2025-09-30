# Quark Chat Server

The backend API for the Quark Chat system - a scalable NestJS application with authentication and chat functionality.

## Features

- **RESTful API**: Complete backend API with authentication and chat endpoints
- **JWT Authentication**: Secure user authentication with Passport JWT strategy
- **Database Integration**: PostgreSQL with TypeORM for data persistence
- **Real-time Chat**: WebSocket support for live chat functionality
- **Validation & Security**: Request validation, password hashing, and CORS configuration

## Technology Stack

- **[NestJS](https://nestjs.com/)** - Progressive Node.js framework for scalable applications
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe server-side development
- **[TypeORM](https://typeorm.io/)** - Database ORM with migration support
- **[PostgreSQL](https://postgresql.org/)** - Robust relational database
- **[Passport JWT](https://www.passportjs.org/)** - Authentication middleware
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing
- **[Jest](https://jestjs.io/)** - Testing framework

## Project Structure

```
apps/server/
├── src/
│   ├── app/              # Main application module
│   │   ├── app.controller.ts     # Root controller
│   │   ├── app.module.ts         # Main application module
│   │   └── app.service.ts        # Application service
│   ├── auth/             # Authentication module
│   │   ├── auth.controller.ts    # Auth endpoints
│   │   ├── auth.service.ts       # Authentication logic
│   │   ├── jwt-auth.guard.ts     # JWT guard
│   │   └── jwt.strategy.ts       # JWT strategy
│   ├── users/            # User management module
│   │   ├── users.controller.ts   # User endpoints
│   │   └── users.service.ts      # User business logic
│   ├── chat/             # Chat functionality module
│   │   ├── chat.controller.ts    # Chat endpoints
│   │   └── chat.module.ts        # Chat module
│   ├── entities/         # Database entities
│   │   └── user.entity.ts        # User entity definition
│   ├── dto/              # Data Transfer Objects
│   │   ├── user.dto.ts           # User DTOs
│   ├── config/           # Configuration modules
│   │   ├── config.module.ts      # Configuration setup
│   │   └── database.config.ts    # Database configuration
│   └── main.ts           # Application entry point
├── dist/                 # Build output directory
├── package.json          # Dependencies and scripts
├── project.json          # Nx project configuration
├── tsconfig.json         # TypeScript configuration
├── jest.config.ts        # Jest testing configuration
├── webpack.config.js     # Webpack build configuration
└── Dockerfile            # Production container
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ database
- Optional: Docker and Docker Compose

### Development Setup

1. **Navigate to the server directory:**
   ```bash
   cd apps/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # Or from workspace root: npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file in project root
   cat > ../../.env << EOF
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=quark_user
   DATABASE_PASSWORD=quark_password
   DATABASE_NAME=quark_chat
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=30m
   
   # API Configuration
   PORT=3000
   API_PREFIX=api/v1
   NODE_ENV=development
   
   EOF
   ```

4. **Start PostgreSQL database:**
   ```bash
   # Using Docker
   docker run --name quark-postgres \
     -e POSTGRES_USER=quark_user \
     -e POSTGRES_PASSWORD=quark_password \
     -e POSTGRES_DB=quark_chat \
     -p 5432:5432 \
     -d postgres:15-alpine
   
   # Or use docker-compose from project root
   docker-compose up -d postgres
   ```

5. **Start the development server:**
   ```bash
   # From server directory
   npm run start:dev
   
   # Or from workspace root
   npx nx serve server
   ```

   API will be available at [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

### Production Setup

1. **Build the application:**
   ```bash
   npx nx build server
   ```

2. **Run with Docker:**
   ```bash
   # From project root
   docker-compose up -d
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start production server |
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:debug` | Start server in debug mode |
| `npm run build` | Build production bundle |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Run ESLint |

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | List all users | Yes |
| GET | `/users/me` | Get current user | Yes |
| PATCH | `/users/me` | Update user profile | Yes |

### Chat
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat/message` | Send chat message | Yes |
| GET | `/chat/conversations` | List conversations | Yes |
| POST | `/chat/stream` | Stream chat response | Yes |


### Health & Info
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Application info | No |
| GET | `/health` | Health check | No |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `API_PREFIX` | API route prefix | `api/v1` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Database user | - |
| `DATABASE_PASSWORD` | Database password | - |
| `DATABASE_NAME` | Database name | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | `30m` |

## Database

### Entity Relationships
- **User**: Core user entity with authentication fields
- **Conversations**: Chat conversation tracking (future)
- **Messages**: Individual chat messages (future)
- **Integrations**: User third-party connections (future)

### Migrations
```bash
# Generate migration
npm run typeorm:migration:generate -- CreateUserTable

# Run migrations
npm run typeorm:migration:run

# Revert migration
npm run typeorm:migration:revert
```

## Authentication

The server uses JWT-based authentication with the following flow:

1. **Registration**: User creates account with email/password
2. **Login**: User authenticates with credentials
3. **JWT Token**: Server returns signed JWT token
4. **Protected Routes**: Client sends JWT in Authorization header
5. **Token Validation**: Server validates JWT on protected endpoints

### Password Security
- Passwords are hashed using bcryptjs with salt rounds
- JWT tokens include user ID and email claims
- Tokens expire after configurable time period


## Testing

### Unit Tests
```bash
# Run all tests
npm run test

# Run specific test file
npm run test users.service.spec.ts

# Run tests with coverage
npm run test:cov
```

### E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e
```

### Test Structure
- Unit tests for services and controllers
- Integration tests for database operations
- E2E tests for complete API workflows

## Docker Deployment

### Development
```bash
# Build image
docker build -t quark-server:dev .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  quark-server:dev
```

### Production
```bash
# Use docker-compose from project root
docker-compose up -d server

# Or build production image
docker build -t quark-server:prod --target production .
```

## Monitoring & Logging

### Health Checks
- `/health` endpoint for service health monitoring
- Database connection validation
- External service connectivity checks

### Logging
- Structured logging with NestJS Logger
- Request/response logging middleware
- Error tracking and stack traces

## Security Features

- **CORS**: Configured for frontend origins
- **Helmet**: Security headers middleware
- **Rate Limiting**: Protection against abuse
- **Input Validation**: DTO validation with class-validator
- **SQL Injection Protection**: TypeORM parameterized queries
- **Password Hashing**: bcryptjs with secure salt rounds

## Performance Optimization

- **Connection Pooling**: Database connection management
- **Caching**: Redis caching for frequently accessed data (future)
- **Compression**: gzip compression for responses
- **Static Assets**: Efficient serving of static files

## Development Guidelines

### Code Style
- Use TypeScript for all modules
- Follow NestJS module structure
- Implement proper error handling
- Use DTOs for request/response validation

### API Design
- RESTful endpoint design
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error messages

### Database Operations
- Use TypeORM entities and repositories
- Implement proper relations
- Handle transactions for complex operations
- Use migrations for schema changes

## Troubleshooting

### Common Issues

**Server won't start:**
- Check PostgreSQL connection
- Verify environment variables
- Check port availability

**Database connection errors:**
- Verify PostgreSQL is running
- Check database credentials
- Confirm database exists

**Authentication issues:**
- Verify JWT_SECRET is set
- Check token expiration
- Validate user credentials


### Debug Tools
- NestJS built-in logger
- Database query logging
- Request/response interceptors
- Error handling filters

## Contributing

1. Create feature branch from `main`
2. Follow NestJS conventions and patterns
3. Add proper TypeScript types and DTOs
4. Include unit tests for new features
5. Update API documentation
6. Test with real database connections
7. Submit pull request with clear description

For more details on the overall project architecture, see the main [README.md](../../README.md).
