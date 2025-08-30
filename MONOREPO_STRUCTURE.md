# 🏗️ Kronos Chat - Nx Monorepo Structure

## 📁 Directory Structure

```
kronos-chat/
├── apps/                    # Applications
│   ├── client/             # React TypeScript app (Frontend)
│   └── server/             # NestJS API (Backend)
├── libs/                   # Shared libraries
│   ├── shared-types/       # Common TypeScript interfaces
│   └── utils/              # Shared utilities
├── server/                 # OLD Python server (can be removed)
├── docker-compose.yml      # Container orchestration
├── nx.json                 # Nx workspace configuration
├── package.json            # Root dependencies
└── tsconfig.base.json      # Base TypeScript configuration
```

## 🚀 Applications

### `apps/client` - React Frontend
- **Type**: React + TypeScript + Vite
- **Port**: 3000 (dev), 80 (production)
- **Purpose**: User interface for the chat application

### `apps/server` - NestJS Backend  
- **Type**: NestJS + TypeScript + TypeORM
- **Port**: 3000 (dev), mapped to 8000 (production)
- **Purpose**: API server with authentication, chat, and Composio integration

## 📚 Libraries

### `libs/shared-types` - Shared Type Definitions
- **Exports**: Common interfaces and types
- **Usage**: `import { User, LoginDto } from '@kronos/shared-types'`
- **Types Available**:
  - User management types
  - Authentication interfaces
  - Chat message types
  - Composio integration types
  - API response types

### `libs/utils` - Shared Utilities
- **Exports**: Utility functions used across apps
- **Usage**: `import { isValidEmail, formatDate } from '@kronos/utils'`
- **Utilities Available**:
  - Authentication helpers
  - Date formatting
  - Validation functions
  - API utilities

## 🛠️ Development Commands

### Build Commands
```bash
# Build everything
npx nx run-many -t build

# Build specific app
npx nx build server
npx nx build client

# Build specific library
npx nx build shared-types
npx nx build utils
```

### Serve Commands
```bash
# Serve server (API)
npx nx serve server
# Available at http://localhost:3000/api/v1

# Serve client (Frontend)
npx nx serve client
# Available at http://localhost:4200
```

### Test Commands
```bash
# Test everything
npx nx run-many -t test

# Test specific project
npx nx test server
npx nx test shared-types
```

### Lint Commands
```bash
# Lint everything
npx nx run-many -t lint

# Lint specific project
npx nx lint server
npx nx lint client
```

## 🐳 Docker Configuration

### Development
```bash
# Start only database
docker-compose up postgres -d

# Run apps locally
npx nx serve server    # Terminal 1
npx nx serve client    # Terminal 2
```

### Production
```bash
# Start everything
docker-compose up -d

# Services available:
# - API: http://localhost:8000/api/v1
# - Frontend: http://localhost:3000
# - Database: localhost:5432
```

## 📦 Package Management

### Adding Dependencies

**To a specific app:**
```bash
# Server dependencies
npm install <package> --workspace=apps/server

# Client dependencies  
npm install <package> --workspace=apps/client
```

**To a library:**
```bash
npm install <package> --workspace=libs/shared-types
```

**To root (affects all):**
```bash
npm install <package>
```

## 🔗 Import Paths

### Using Shared Libraries

**In apps/server:**
```typescript
import { User, LoginDto } from '@kronos/shared-types';
import { isValidEmail, formatDate } from '@kronos/utils';
```

**In apps/client:**
```typescript
import { ChatMessage, ApiResponse } from '@kronos/shared-types';
import { formatDateTime, handleApiError } from '@kronos/utils';
```

## 🧪 Project Dependencies

### Dependency Graph
```
apps/server  ──┐
               ├── libs/shared-types
apps/client ──┘    └── libs/utils
```

### View Dependency Graph
```bash
npx nx graph
```

## 📋 Project Tags

- **Apps**: `type:app`, `scope:server` | `scope:client`
- **Libs**: `type:lib`, `scope:shared`

### Enforce Boundaries
```bash
npx nx lint --fix
```

## 🔄 Migration Status

✅ **Completed**:
- Restructured to standard Nx layout
- Moved client to `apps/client`
- Moved NestJS API to `apps/server`
- Created shared type library
- Created utilities library
- Updated Docker configurations
- Updated Nx configuration
- Set up TypeScript path mapping

⚠️ **Note**: The old Python server (`server/`) can be safely removed when ready.

## 🎯 Benefits of This Structure

1. **Separation of Concerns**: Clear boundaries between apps and libs
2. **Code Reuse**: Shared types and utilities across projects
3. **Type Safety**: Consistent interfaces between frontend and backend
4. **Scalability**: Easy to add new apps or libraries
5. **Developer Experience**: Better tooling and IntelliSense
6. **Build Optimization**: Only rebuild affected projects
7. **Testing**: Isolated and shared test utilities

---

**Your monorepo is now perfectly structured and ready for development! 🎉**
