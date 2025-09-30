# Quark Chat Client

The frontend application for the Quark Chat system - a modern React-based chat interface with real-time AI interactions and third-party integrations.

## Features

- **Real-time Chat Interface**: ChatGPT-like streaming responses
- **Authentication**: Secure JWT-based user login and registration
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface with loading states and error handling

## Technology Stack

- **[React 19](https://react.dev/)** - Modern UI library with hooks and concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Axios](https://axios-http.com/)** - HTTP client for API communication

## Project Structure

```
apps/client/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── AuthWrapper.tsx           # Authentication provider
│   │   ├── ChatInterface.tsx         # Main chat interface
│   │   ├── LoginForm.tsx             # User login form
│   │   ├── SignupForm.tsx            # User registration form
│   │   ├── OAuthIntegrationManager.tsx  # OAuth connections
│   │   ├── IntegrationDashboard.tsx  # Integration management
│   │   └── ToolExecutor.tsx          # Execute third-party tools
│   ├── services/           # API service layer
│   │   ├── apiService.ts             # Main API client
│   │   └── index.ts                  # Service exports
│   ├── config/             # Configuration files
│   ├── assets/             # Images and static assets
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite environment types
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── Dockerfile              # Production container
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see `../server/README.md`)

### Development Setup

1. **Navigate to the client directory:**
   ```bash
   cd apps/client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env.local file
   echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # Or from workspace root:
   npx nx serve client
   ```

   App will be available at [http://localhost:4200](http://localhost:4200)

### Production Build

1. **Build the application:**
   ```bash
   npm run build
   # Or from workspace root:
   npx nx build client
   ```

2. **Preview the build:**
   ```bash
   npm run preview
   # Or from workspace root:
   npx nx preview client
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run preview` | Preview production build locally |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api/v1` |

## Core Components

### Authentication Flow
- `AuthWrapper.tsx`: Handles authentication state and routing
- `LoginForm.tsx`: User login interface
- `SignupForm.tsx`: New user registration

### Chat Interface
- `ChatInterface.tsx`: Main chat component with streaming responses
- Real-time message streaming from AI backend
- Conversation history and context management

### Integration Management
- `OAuthIntegrationManager.tsx`: Connect/disconnect third-party services
- `IntegrationDashboard.tsx`: View and manage active connections
- `ToolExecutor.tsx`: Execute actions on connected services


## API Integration

The client communicates with the NestJS backend via:
- **Authentication**: JWT tokens for secure API access
- **Chat API**: Real-time streaming chat responses
- **User Management**: Profile and account operations

## Docker Deployment

**Development:**
```bash
# Build development image
docker build -t quark-client:dev .

# Run container
docker run -p 3000:80 quark-client:dev
```

**Production (via docker-compose):**
```bash
# From project root
docker-compose up -d client
```

## Development Guidelines

### Code Style
- Use TypeScript for all components and services
- Follow React hooks patterns
- Implement proper error boundaries
- Use meaningful component and variable names

### State Management
- Use React hooks (`useState`, `useEffect`, `useCallback`)
- Lift state up when sharing between components
- Consider context for global state (authentication)

### API Communication
- Use the centralized `apiService` for all backend calls
- Handle loading states and error conditions
- Implement proper TypeScript types for requests/responses

### Testing
```bash
# Run tests
npx nx test client

# Run tests with coverage
npx nx test client --coverage
```

## Common Development Tasks

### Adding a New Component
1. Create component in `src/components/`
2. Export from appropriate index file
3. Add proper TypeScript interfaces
4. Include error handling and loading states

### Adding an API Integration
1. Add methods to `apiService.ts`
2. Define TypeScript interfaces for request/response
3. Handle authentication and error states
4. Update components to use new service methods

### Styling Guidelines
- Use CSS modules or styled components
- Follow responsive design principles
- Maintain consistent spacing and typography
- Test on multiple screen sizes

## Troubleshooting

### Common Issues

**Development server won't start:**
- Check Node.js version (18+ required)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check port 4200 availability

**API calls failing:**
- Verify backend server is running
- Check `VITE_API_BASE_URL` environment variable
- Verify JWT token is valid and not expired

**Build errors:**
- Run TypeScript check: `npx tsc --noEmit`
- Fix ESLint issues: `npm run lint`
- Clear Vite cache: `rm -rf dist`


### Debug Tools
- React Developer Tools browser extension
- Network tab for API request debugging
- Console logs for error tracking
- Vite development server error overlay

## Contributing

1. Create feature branch from `main`
2. Follow existing code patterns and conventions
3. Add proper TypeScript types
4. Test changes thoroughly
5. Run linting and fix any issues
6. Submit pull request with clear description

For more details on the overall project architecture, see the main [README.md](../../README.md).