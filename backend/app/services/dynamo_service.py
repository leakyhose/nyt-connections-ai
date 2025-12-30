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
            available_games = [
                1, 2, 4, 12, 19, 22, 26, 27, 31, 32, 35, 39, 40, 43, 48, 49, 53, 54, 55, 58, 61, 62, 64, 65, 68, 69, 71, 72, 74, 78, 82, 84, 86, 89, 90, 94, 95, 99, 100, 104, 105, 108, 114, 118, 120, 127, 128, 131, 132, 133, 135, 136, 140, 142, 145, 147, 148, 149, 152, 157, 161, 163, 165, 172, 176, 180, 182, 187, 190, 193, 195, 196, 199, 202, 205, 206, 209, 212, 214, 216, 218, 221, 223, 224, 225, 227, 229, 230, 233, 236, 237, 239, 242, 243, 245, 250, 251, 257, 261, 263, 264, 265, 267, 268, 269, 270, 274, 275, 279, 281, 286, 295, 296, 298, 299, 305, 308, 309, 312, 317, 318, 323, 324, 325, 326, 329, 335, 336, 339, 340, 342, 343, 346, 351, 352, 357, 361, 363, 364, 365, 367, 368, 369, 371, 372, 374, 377, 379, 381, 382, 383, 384, 386, 389, 391, 392, 393, 394, 400, 403, 407, 408, 409, 410, 413, 414, 417, 418, 420, 421, 423, 424, 430, 431, 435, 444, 446, 447, 453, 454, 456, 457, 459, 460, 461, 469, 471, 476, 478, 479, 480, 481, 485, 486, 487, 489, 490, 493, 496, 497, 498, 501, 503, 504, 505, 510, 511, 512, 513, 515, 516, 518, 522, 524, 525, 527, 529, 531, 532, 534, 535, 541, 542, 543, 545, 551, 555, 556, 557, 564, 565, 566, 567, 568, 569, 572, 575, 578, 583, 586, 590, 593, 595, 596, 600, 601, 602, 603, 605, 610, 612, 613, 614, 615, 618, 620, 621, 623, 626, 632, 634, 635, 638, 639
            ]
            random_id = random.choice(available_games)
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
