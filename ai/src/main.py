"""
ShiftMind AI Module

Main entry point for AI functionality.
"""

import uvicorn
from server import app

def main():
    """Main function for AI module"""
    print("ShiftMind AI Module - Starting server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8085,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
