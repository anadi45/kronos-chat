# @kronos/core

Core types and utilities for the Kronos chat application.

## Installation

```bash
npm install @kronos/core
```

## Features

- **Stream Events**: Type-safe streaming event system for real-time chat
- **Authentication**: User authentication types and utilities
- **Chat**: Chat message and conversation types
- **API**: API request/response type definitions
- **Integrations**: Third-party integration types
- **Utilities**: Common utility functions for validation, formatting, and API handling

## Usage

### Stream Events

```typescript
import { 
  StreamEventFactory, 
  StreamEventParser,
  StartEvent,
  TokenEvent 
} from '@kronos/core';

// Create events
const startEvent = StreamEventFactory.createStartEvent('conv-123', true);
const tokenEvent = StreamEventFactory.createTokenEvent('Hello');

// Parse events
const parser = new StreamEventParser();
const event = parser.parse('data: {"type":"start","data":{"conversationId":"conv-123"}}');
```

### Authentication

```typescript
import { User, AuthToken, LoginRequest } from '@kronos/core';

const user: User = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe'
};
```

### Chat

```typescript
import { ChatMessage, Conversation } from '@kronos/core';

const message: ChatMessage = {
  id: 'msg-123',
  content: 'Hello, world!',
  userId: 'user-123',
  conversationId: 'conv-123',
  timestamp: new Date().toISOString()
};
```

### Utilities

```typescript
import { 
  formatDate, 
  getRelativeTime, 
  isValidEmail, 
  validateRequired,
  createApiUrl 
} from '@kronos/core';

// Date formatting
const formatted = formatDate(new Date());
const relative = getRelativeTime('2024-01-01T10:00:00Z');

// Validation
const emailValid = isValidEmail('user@example.com');
const error = validateRequired('', 'Name');

// API utilities
const url = createApiUrl('https://api.example.com', '/users');
```

## API Reference

### Stream Events

- `StreamEventType` - Event type enumeration
- `StreamEvent` - Abstract base class for all events
- `StartEvent` - Conversation start event
- `EndEvent` - Conversation end event
- `TokenEvent` - Regular token streaming event
- `MarkdownTokenEvent` - Markdown-formatted token event
- `StreamEventFactory` - Factory for creating events
- `StreamEventParser` - Parser for incoming events
- `StreamEventValidator` - Event validation utilities

### Utilities

- `StreamEventFilter` - Filter events by type, time range, etc.
- `StreamEventAggregator` - Aggregate tokens and extract data
- `StreamEventTransformer` - Transform events to SSE format
- `StreamEventStatistics` - Generate event statistics
- `StreamEventDebugger` - Debug and logging utilities

### Utility Functions

- **API Utilities**: `createApiUrl`, `getErrorMessage`, `handleApiError`, `formatApiResponse`
- **Auth Utilities**: `isValidEmail`, `isStrongPassword`, `getPasswordStrength`, `sanitizeUserData`
- **Date Utilities**: `formatDate`, `formatDateTime`, `getRelativeTime`, `isToday`
- **Validation Utilities**: `isEmpty`, `isUUID`, `sanitizeInput`, `validateRequired`, `validateEmail`

## Development

```bash
# Build the package
npm run build

# Watch for changes
npm run dev

# Clean build artifacts
npm run clean
```

## License

MIT
