# Docker Setup Guide for Kronos Chat

This guide explains how to run the Kronos Chat application using Docker Compose.

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose V2
- At least 2GB of available RAM

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd kronos-chat
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env file with your actual API keys
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Services

The Docker Compose setup includes:

### PostgreSQL Database (`postgres`)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: kronos_chat
- **User**: kronos_user
- **Data**: Persisted in Docker volume `postgres_data`

### FastAPI Server (`server`)
- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **Dependencies**: PostgreSQL

### React Client (`client`)
- **Port**: 3000 (mapped to container port 80)
- **Web Server**: Nginx
- **Dependencies**: Server
- **Proxy**: API calls automatically routed to backend

## Environment Variables

Required variables in `.env` file:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
SECRET_KEY=your-secret-jwt-key-here
COMPOSIO_API_KEY=your_composio_api_key_here
```

## Common Commands

### Start services
```bash
# Start all services in background
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d postgres
```

### Stop services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
```

### Database operations
```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U kronos_user -d kronos_chat

# Run database migrations
docker-compose exec server python -c "from app.utils.database import init_db; init_db()"
```

### Development
```bash
# Rebuild services after code changes
docker-compose build

# Restart specific service
docker-compose restart server

# Shell access to container
docker-compose exec server bash
```

## Troubleshooting

### Services won't start
1. Check if ports are available:
   ```bash
   netstat -an | findstr "3000\|8000\|5432"
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs
   ```

### Database connection issues
1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check database connectivity:
   ```bash
   docker-compose exec server python -c "from app.database.database import test_connection; test_connection()"
   ```

### Client can't reach server
1. Verify server is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Check nginx configuration:
   ```bash
   docker-compose logs client
   ```

## Production Deployment

For production deployment:

1. **Set environment to production**:
   ```env
   DEBUG=false
   SECRET_KEY=strong-random-secret-key
   ```

2. **Use environment-specific compose file**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy** (nginx/traefik) for SSL termination

4. **Configure backup** for PostgreSQL data volume

## Data Persistence

- Database data is stored in Docker volume `postgres_data`
- To backup: `docker-compose exec postgres pg_dump -U kronos_user kronos_chat > backup.sql`
- To restore: `docker-compose exec -T postgres psql -U kronos_user kronos_chat < backup.sql`

## Monitoring

Health checks are configured for all services:
- **postgres**: `pg_isready` check every 10s
- **server**: HTTP check on `/health` every 30s  
- **client**: HTTP check on `/` every 30s

Check health status:
```bash
docker-compose ps
```
