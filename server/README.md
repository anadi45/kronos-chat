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
│   └── utils/           # Utility functions
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── README.md            # This file
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /api/v1/chat/` - Chat operations
- `GET /api/v1/users/` - User operations

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