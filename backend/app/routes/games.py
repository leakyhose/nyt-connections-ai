from flask import Blueprint, jsonify

games_bp = Blueprint('games', __name__)

@games_bp.route('/random', methods=['GET'])
def get_random_game():
    # Placeholder for random game logic
    return jsonify({"message": "Random game endpoint", "game_id": 123})

@games_bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    # Placeholder for specific game logic
    return jsonify({"message": f"Game {game_id} endpoint", "game_id": game_id})
