# Kronos Chat

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A modern chat application built with an Nx monorepo architecture, featuring a React frontend and NestJS backend with AI integration.

## Architecture

This is an [Nx workspace](https://nx.dev) containing:

- **Frontend**: React + TypeScript with Vite (`apps/client`)
- **Backend**: NestJS + TypeScript API (`apps/server`)
- **Shared Libraries**: Common types and utilities (`libs/`)

## Project Structure

```
kronos-chat/
├── apps/
│   ├── client/          # React frontend application
│   └── server/          # NestJS backend API
├── libs/
│   └── kronos-core/     # Core types and utilities (@kronos/core)
├── docker-compose.yml   # Container orchestration
└── package.json         # Monorepo configuration
```

## Quick Start

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Start the development servers:**
   ```bash
   # Terminal 1: Start the backend API
   npx nx serve server
   # Available at http://localhost:3000/api/v1

   # Terminal 2: Start the frontend
   npx nx serve client
   # Available at http://localhost:4200
   ```

### Production (Docker)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1
   - Database: PostgreSQL on port 5432

## Technology Stack

### Frontend (`apps/client`)
- React 18 with TypeScript
- Vite for build tooling
- Modern chat interface with real-time streaming
- Authentication with JWT

### Backend (`apps/server`)
- NestJS framework with TypeScript
- TypeORM for database operations
- JWT authentication with Passport
- PostgreSQL database

### Shared Libraries
- `@kronos/core`: Core types, utilities, and stream event system
  - **Stream Events**: Type-safe streaming event system for real-time chat
  - **Authentication**: User types and auth utilities
  - **Chat**: Message and conversation types
  - **API**: Request/response type definitions
  - **Utilities**: Common functions for validation, formatting, and API handling

## Available Commands

### Build Commands
```bash
# Build everything
npx nx run-many -t build

# Build specific project
npx nx build server
npx nx build client
```

### Development Commands
```bash
# Serve applications
npx nx serve server    # Backend API
npx nx serve client    # Frontend app

# Run tests
npx nx run-many -t test

# Lint code
npx nx run-many -t lint
```

### Nx Utilities
```bash
# View project dependency graph
npx nx graph

# Show available projects and targets
npx nx show projects

# Check affected projects
npx nx affected:build
```

## Environment Configuration

Required environment variables:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=kronos_user
DATABASE_PASSWORD=kronos_password
DATABASE_NAME=kronos_chat

# Authentication
JWT_SECRET=your-secret-key-here

```

## Features

- **Real-time Chat**: Streaming chat interface with AI integration
- **Authentication**: Secure JWT-based user authentication
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Monorepo Benefits**: Shared code, consistent tooling, and incremental builds
- **Core Package**: Consolidated `@kronos/core` with types, utilities, and stream events

## Development Workflow

1. Use core types and utilities: `import { User, ChatMessage, formatDate, validateEmail } from '@kronos/core'`
2. Use stream events: `import { StreamEventFactory, StartEvent } from '@kronos/core'`
3. Run affected tests: `npx nx affected:test`
4. View dependency graph: `npx nx graph`

## Docker Services

- **postgres**: PostgreSQL 15 database
- **server**: NestJS API server
- **client**: React frontend with Nginx

## Contributing

1. Make changes to the appropriate app or library
2. Run tests: `npx nx affected:test`
3. Run linting: `npx nx affected:lint`
4. Build affected projects: `npx nx affected:build`

## Learn More

- [Nx Documentation](https://nx.dev)
- [NestJS Documentation](https://nestjs.com)
- [React Documentation](https://react.dev)
- [TypeORM Documentation](https://typeorm.io)
