"""
Simple web server for Connections Game
Serves the HTML interface and provides API endpoints for game data
"""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
import numpy as np
from pathlib import Path


class ConnectionsHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=Path(__file__).parent, **kwargs)
    
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path.startswith('/api/game/'):
            self.handle_game_api(parsed_path)
        else:
            if parsed_path.path == '/':
                self.path = '/index.html'
            super().do_GET()
    
    def handle_game_api(self, parsed_path):
        try:
            path_parts = parsed_path.path.split('/')
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                game_number = int(path_parts[3])
                
                game_data = self.load_game_data(game_number)
                
                if game_data:
                    self.send_json_response(game_data)
                else:
                    self.send_error_response(404, f"Game {game_number} not found")
            else:
                self.send_error_response(400, "Invalid game number")
                
        except Exception as e:
            print(f"Error handling API request: {e}")
            self.send_error_response(500, f"Server error: {str(e)}")
    
    def load_game_data(self, game_number):
        try:
            word_data_path = Path("fasttext/word_data.npy")
            adj_data_path = Path("fasttext/data.npy")
            
            if not word_data_path.exists() or not adj_data_path.exists():
                return None
            
            word_archive = np.load(word_data_path)
            adj_archive = np.load(adj_data_path, allow_pickle=True)
            
            if game_number < 0 or game_number >= len(word_archive):
                return None
            
            words = word_archive[game_number].tolist()
            adjacency_matrix = adj_archive[game_number].tolist()
            
            return {
                'game_number': game_number,
                'words': words,
                'adjacency_matrix': adjacency_matrix
            }
            
        except Exception as e:
            print(f"Error loading game data for game {game_number}: {e}")
            return None
    
    def send_json_response(self, data):
        response = json.dumps(data).encode('utf-8')
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(response)
    
    def send_error_response(self, code, message):
        error_data = {'error': message}
        response = json.dumps(error_data).encode('utf-8')
        
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        self.wfile.write(response)
    
    def log_message(self, format, *args):
        if not self.path.startswith('/api/'):
            return
        print(f"{self.address_string()} - {format % args}")


def run_server(port=8000):
    """Run the web server on the specified port."""
    server_address = ('', port)
    
    try:
        httpd = HTTPServer(server_address, ConnectionsHTTPRequestHandler)
        print(f"Server starting on http://localhost:{port}")
        print(f"Games available: 0-{get_game_count()-1}")
        print("Press Ctrl+C to stop")
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("Server stopped")
        httpd.server_close()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"Port {port} is already in use. Try a different port:")
            print(f"   python server.py --port {port + 1}")
        else:
            print(f"Server error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")


def get_game_count():
    """Get the number of available games."""
    try:
        word_data_path = Path("fasttext/word_data.npy")
        if word_data_path.exists():
            word_archive = np.load(word_data_path)
            return len(word_archive)
    except:
        pass
    return 0


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Connections Game Web Server')
    parser.add_argument('--port', type=int, default=8000, help='Port to run server on (default: 8000)')
    args = parser.parse_args()
    
    if not Path("fasttext/word_data.npy").exists():
        print("Game data not found")
        print("Need: 'fasttext/word_data.npy' and 'fasttext/data.npy'")
        exit(1)
    
    run_server(args.port)