#!/usr/bin/env python3
"""
Connections Game - Web Version

Run this file to start the web server and play the Connections game in your browser.
No pygame dependency - runs completely in the browser!
"""

import sys
import webbrowser
import time
from pathlib import Path

def main():
    print("ConnectionsAI - by Yiming Su")
    print("=" * 50)
    
    # Check if game data exists
    if not Path("fasttext/word_data.npy").exists():
        print("Data not found!")
        print("Need: 'fasttext/word_data.npy' and 'fasttext/data.npy'")
        return
    
    # Import and run server
    try:
        from server import run_server, get_game_count
        
        # Get available port
        port = 8000
        if len(sys.argv) > 1:
            try:
                port = int(sys.argv[1])
            except ValueError:
                print(f"Invalid port number: {sys.argv[1]}")
                return
        
        print(f"{get_game_count()} games available")
        print(f"Starting server on port {port}...")
        print(f"Opening browser to http://localhost:{port}")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f"http://localhost:{port}")
        except:
            pass
        
        # Start the server
        run_server(port)
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Install: pip install numpy")
    except KeyboardInterrupt:
        print("\nBye!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()