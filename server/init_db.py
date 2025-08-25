import sys
import os

# Add the server directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

# Test that imports work correctly
try:
    from app.utils import init_db
    print("Imports successful!")
except Exception as e:
    print(f"Import error: {e}")
    sys.exit(1)

def main():
    print("Database setup is ready! Please ensure PostgreSQL is installed and configured.")
    print("Follow the instructions in the README to set up the database.")

if __name__ == "__main__":
    main()