# Setup instructions for Kronos Chat Server

## Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

## Virtual Environment Setup

A virtual environment is recommended to isolate project dependencies.

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to the project directory:
   ```cmd
   cd path\to\kronos-chat-server
   ```
3. Create a virtual environment:
   ```cmd
   python -m venv venv
   ```
4. Activate the virtual environment:
   ```cmd
   venv\Scripts\activate
   ```
   If you're using PowerShell and get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   Then try activating again.

### macOS/Linux

1. Open Terminal
2. Navigate to the project directory:
   ```bash
   cd path/to/kronos-chat-server
   ```
3. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```
   or
   ```bash
   python -m venv venv
   ```
4. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

### Verifying Activation

When the virtual environment is successfully activated, you'll see `(venv)` at the beginning of your command prompt:
- Windows: `(venv) C:\path\to\kronos-chat-server>`
- macOS/Linux: `(venv) user@computer:path/to/kronos-chat-server$`

## Installing Dependencies

With the virtual environment activated, install the required dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

To start the development server with auto-reload:
```bash
uvicorn main:app --reload
```

The server will start on `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deactivating the Virtual Environment

When you're done working, you can deactivate the virtual environment:
```bash
deactivate
```

This will return you to your system's default Python environment.