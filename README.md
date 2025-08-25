# Kronos Chat Server

A FastAPI backend for the Kronos chat application.

## Features

- RESTful API design
- Asynchronous support
- Automatic API documentation (Swagger/OpenAPI)
- Modular architecture
- Virtual environment setup instructions for Windows and macOS

## Setup

1. Create a virtual environment:
   - On Windows:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

4. Visit the API documentation at `http://localhost:8000/docs`

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