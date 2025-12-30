import json
import random
import os
from pathlib import Path

class GameService:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent.parent / 'public' / 'data'

    def get_game(self, game_id):
        file_path = self.data_dir / f'game_{game_id}.json'
        if not file_path.exists():
            return None
        
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data

    def get_random_game_id(self):
        files = list(self.data_dir.glob('game_*.json'))
        if not files:
            return None
        
        random_file = random.choice(files)
        # Extract ID from filename game_123.json
        try:
            game_id = int(random_file.stem.split('_')[1])
            return game_id
        except (IndexError, ValueError):
            return None

    def check_guess(self, game_id, guess_words):
        game_data = self.get_game(game_id)
        if not game_data:
            return {"error": "Game not found"}
        return {}

game_service = GameService()
