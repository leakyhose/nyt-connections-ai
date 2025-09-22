import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
from pathlib import Path


class ConnectionsHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=Path(__file__).parent, **kwargs)
        self.available_games = self.load_available_games()
    
    def load_available_games(self):
        return [
            1, 2, 4, 12, 19, 22, 26, 27, 31, 32, 35, 39, 40, 43, 48, 49, 53, 54, 55, 58, 61, 62, 64, 65, 68, 69, 71, 72, 74, 78, 82, 84, 86, 89, 90, 94, 95, 99, 100, 104, 105, 108, 114, 118, 120, 127, 128, 131, 132, 133, 135, 136, 140, 142, 145, 147, 148, 149, 152, 157, 161, 163, 165, 172, 176, 180, 182, 187, 190, 193, 195, 196, 199, 202, 205, 206, 209, 212, 214, 216, 218, 221, 223, 224, 225, 227, 229, 230, 233, 236, 237, 239, 242, 243, 245, 250, 251, 257, 261, 263, 264, 265, 267, 268, 269, 270, 274, 275, 279, 281, 286, 295, 296, 298, 299, 305, 308, 309, 312, 317, 318, 323, 324, 325, 326, 329, 335, 336, 339, 340, 342, 343, 346, 351, 352, 357, 361, 363, 364, 365, 367, 368, 369, 371, 372, 374, 377, 379, 381, 382, 383, 384, 386, 389, 391, 392, 393, 394, 400, 403, 407, 408, 409, 410, 413, 414, 417, 418, 420, 421, 423, 424, 430, 431, 435, 444, 446, 447, 453, 454, 456, 457, 459, 460, 461, 469, 471, 476, 478, 479, 480, 481, 485, 486, 487, 489, 490, 493, 496, 497, 498, 501, 503, 504, 505, 510, 511, 512, 513, 515, 516, 518, 522, 524, 525, 527, 529, 531, 532, 534, 535, 541, 542, 543, 545, 551, 555, 556, 557, 564, 565, 566, 567, 568, 569, 572, 575, 578, 583, 586, 590, 593, 595, 596, 600, 601, 602, 603, 605, 610, 612, 613, 614, 615, 618, 620, 621, 623, 626, 632, 634, 635, 638, 639
        ]
    
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
                    self.send_error_response(404, "Game not found")
            else:
                self.send_error_response(400, "Invalid game number")
        except Exception:
            self.send_error_response(500, "Server error")
    
    def load_game_data(self, game_number):
        try:
            if game_number not in self.available_games:
                return None
            game_file_path = Path(f"data/game_{game_number}.json")
            if not game_file_path.exists():
                return None
            with open(game_file_path, 'r') as f:
                game_data = json.load(f)
            return {
                'game_number': game_number,
                'words': game_data['words'],
                'adjacency_matrix': game_data['adjacency_matrix']
            }
        except Exception:
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
        if self.path.startswith('/api/'):
            print(f"{self.address_string()} - {format % args}")


def get_game_count():
    try:
        data_dir = Path("data")
        if data_dir.exists():
            return len(list(data_dir.glob("game_*.json")))
    except:
        pass
    return 0


def run_server(port=8000):
    server_address = ('', port)
    try:
        httpd = HTTPServer(server_address, ConnectionsHTTPRequestHandler)
        print(f"Server running on http://localhost:{port}")
        print(f"Games: 0-{get_game_count()-1}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"Port {port} in use. Try: python server.py --port {port + 1}")
        else:
            print(f"Error: {e}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    
    if not Path("data").exists():
        print("Error: data/ directory not found")
        exit(1)
    
    run_server(args.port)