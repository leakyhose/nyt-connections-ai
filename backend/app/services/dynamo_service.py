import boto3
import random
from decimal import Decimal
import os

class DynamoService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        self.table = self.dynamodb.Table('ConnectionsGames')

    def get_game(self, game_id):
        try:
            response = self.table.get_item(Key={'game_number': int(game_id)})
            item = response.get('Item')
            if item:
                return self._decimal_to_float(item)
            return None
        except Exception as e:
            print(f"Error fetching game {game_id}: {e}")
            return None

    def get_random_game(self):
        try:
            # Fetch metadata to get list of available games
            response = self.table.get_item(Key={'game_number': -1})
            metadata = response.get('Item')
            
            if metadata and 'available_games' in metadata:
                available_games = [int(g) for g in metadata['available_games']]
                if not available_games:
                    return None
                random_id = random.choice(available_games)
                return self.get_game(random_id)
            else:
                # Fallback if metadata is missing
                # Try a random number between 0 and 500
                random_id = random.randint(0, 500)
                return self.get_game(random_id)
        except Exception as e:
            print(f"Error fetching random game: {e}")
            return None

    def _decimal_to_float(self, obj):
        if isinstance(obj, list):
            return [self._decimal_to_float(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: self._decimal_to_float(v) for k, v in obj.items()}
        elif isinstance(obj, Decimal):
            return float(obj)
        else:
            return obj

dynamo_service = DynamoService()
