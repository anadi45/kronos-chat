# Kronos Chat - Monorepo

This is a monorepo for the Kronos Chat application, containing both the client and server components.

## Project Structure

```
├── client/                 # Frontend application (to be implemented)
├── server/                 # Backend server
│   ├── app/                # Main application code
│   │   ├── main.py         # Application factory
│   │   ├── config.py       # Configuration settings
│   │   ├── routes/         # API route definitions
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── database/       # Database connection and setup
│   │   └── utils/          # Utility functions
│   ├── main.py             # Application entry point
│   ├── requirements.txt    # Python dependencies
│   ├── README.md           # Server-specific documentation
│   └── SETUP.md           # Server setup instructions
├── .gitignore
└── README.md              # This file
```

## Components

### Server

The server is a FastAPI backend for the Kronos chat application.

**Technology Stack:**
- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast (high-performance) web framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI server implementation
- [Pydantic](https://docs.pydantic.dev/) - Data validation and settings management

**Key Features:**
- RESTful API design
- Asynchronous support
- Automatic API documentation (Swagger/OpenAPI)
- Modular architecture

For detailed information about the server, see [server/README.md](server/README.md).

### Client

The client directory is reserved for the frontend application which will be implemented later.

## Development Setup

### Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

5. Visit the API documentation at `http://localhost:8000/docs`

### Client

Client setup instructions will be added when the frontend implementation begins.

## Monorepo Benefits

This monorepo structure provides several advantages:

1. **Shared Configuration**: Common tooling and configuration can be shared across components
2. **Atomic Changes**: Cross-cutting changes can be made in a single commit
3. **Simplified Dependency Management**: Easier to manage dependencies between client and server
4. **Streamlined CI/CD**: Unified pipeline for testing and deployment