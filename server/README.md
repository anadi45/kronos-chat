# Kronos Chat Server

A FastAPI backend for the Kronos chat application.

## Features

- RESTful API design
- Asynchronous support
- Automatic API documentation (Swagger/OpenAPI)
- Modular architecture
- Health check endpoints
- Comprehensive error handling

## Technology Stack

- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast (high-performance) web framework
- [Uvicorn](https://www.uvicorn.org/) - ASGI server implementation
- [Pydantic](https://docs.pydantic.dev/) - Data validation and settings management

## Setup

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)
- PostgreSQL database server

### PostgreSQL Setup

1. Install PostgreSQL on your system:
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS**: `brew install postgresql`
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`

2. Start the PostgreSQL service:
   - **Windows**: Start the PostgreSQL service from Services
   - **macOS**: `brew services start postgresql`
   - **Ubuntu/Debian**: `sudo systemctl start postgresql`

3. Create a database and user for the application:
   ```sql
   CREATE DATABASE kronos_chat;
   CREATE USER kronos_user WITH PASSWORD 'kronos_password';
   GRANT ALL PRIVILEGES ON DATABASE kronos_chat TO kronos_user;
   ```

4. Update the database connection string in your `.env` file:
   ```
   DATABASE_URL=postgresql://kronos_user:kronos_password@localhost:5432/kronos_chat
   ```

### Virtual Environment Setup

A virtual environment is recommended to isolate project dependencies.

1. Navigate to the server directory (from the root of the monorepo):
   ```bash
   cd server
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```cmd
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

   When successfully activated, you'll see `(venv)` at the beginning of your command prompt.

### Installing Dependencies

With the virtual environment activated, install the required dependencies:
```bash
pip install -r requirements.txt
```

### Database Initialization

Initialize the database tables:
```bash
python init_db.py
```

### Starting the Server

To start the development server with auto-reload:
```bash
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`

### API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
├── app/
│   ├── main.py          # Application factory
│   ├── config.py        # Configuration settings
│   ├── routes/          # API route definitions
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── database/        # Database connection and setup
│   ├── agent/           # LangGraph agent with Gemini integration
│   └── utils/           # Utility functions
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## Project Structure

```
├── app/
│   ├── main.py          # Application factory
│   ├── config.py        # Configuration settings
│   ├── routes/          # API route definitions
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── database/        # Database connection and setup
│   ├── agent/           # LangGraph agent with Gemini integration
│   └── utils/           # Utility functions
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/v1/chat/` - Chat operations
- `GET /api/v1/users/` - List users
- `POST /api/v1/users/` - Create a new user
- `GET /api/v1/users/{user_id}` - Get a specific user
- `PUT /api/v1/users/{user_id}` - Update a specific user
- `DELETE /api/v1/users/{user_id}` - Delete a specific user
- `POST /api/v1/agent/invoke` - Invoke the LangGraph agent with Gemini
- `POST /api/v1/agent/stream` - Stream the LangGraph agent response with Gemini

## Agent Functionality

The server includes a LangGraph agent powered by Google's Gemini model. The agent is equipped with a simple `add` tool that can perform addition operations.

### Agent API

- **Endpoint**: `POST /api/v1/agent/invoke`
- **Request Body**: 
  ```json
  {
    "message": "What is 2 + 3?"
  }
  ```
- **Response**:
  ```json
  {
    "response": "2 + 3 = 5"
  }
  ```

### Streaming API

- **Endpoint**: `POST /api/v1/agent/stream`
- **Request Body**: 
  ```json
  {
    "message": "What is 2 + 3?"
  }
  ```
- **Response**: Streams the agent's response in real-time as plain text

### Agent Components

1. **LangGraph Framework**: Used to create the agent's decision-making workflow
2. **Gemini Integration**: Uses Google's Gemini 1.5 Flash model for natural language understanding
3. **Tools**: Currently includes a simple `add` function tool
4. **Streaming Support**: Real-time streaming of agent responses and tool usage

### Adding New Tools

To add new tools to the agent:
1. Create a new tool function in `app/agent/tools.py` using the `@tool` decorator
2. Import and bind the tool in `app/agent/agent.py`
3. The agent will automatically be able to use the new tool

## Development

To run the development server with auto-reload:

```bash
uvicorn main:app --reload
```

The API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

For detailed setup instructions including virtual environment creation, see [SETUP.md](SETUP.md).

## Deployment

For production deployment, it's recommended to:

1. Not use the `--reload` flag
2. Use a process manager like Gunicorn
3. Set up proper logging
4. Configure environment variables for sensitive data

Example production command:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request