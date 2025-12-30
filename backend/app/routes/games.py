from flask import Blueprint, jsonify, request
from app.services.dynamo_service import dynamo_service
from app.services.ai_solver import ai_solver
import random

games_bp = Blueprint('games', __name__)

@games_bp.route('/random', methods=['GET'])
def get_random_game():
    game = dynamo_service.get_random_game()
    if not game:
        return jsonify({"error": "No games found"}), 404
    
    return prepare_game_response(game)

@games_bp.route('/<int:game_id>', methods=['GET'])
def get_game(game_id):
    game = dynamo_service.get_game(game_id)
    if not game:
        return jsonify({"error": "Game not found"}), 404
    
    return prepare_game_response(game)

def prepare_game_response(game):
    seed = random.randint(0, 1000000)
    rng = random.Random(seed)
    indices = list(range(16))
    rng.shuffle(indices)
    
    shuffled_words = [game['words'][i] for i in indices]
    
    return jsonify({
        "game_number": game['game_number'],
        "words": shuffled_words,
        "seed": seed
    })

def get_permutation(seed):
    rng = random.Random(seed)
    indices = list(range(16))
    rng.shuffle(indices)
    return indices

@games_bp.route('/<int:game_id>/check', methods=['POST'])
def check_guess(game_id):
    data = request.json
    guess_indices = data.get('guess_indices', [])
    seed = data.get('seed')
    
    if len(guess_indices) != 4 or seed is None:
        return jsonify({"error": "Invalid request"}), 400
        
    perm = get_permutation(seed)
    
    # Map shuffled indices to original indices
    original_indices = [perm[i] for i in guess_indices]
    original_indices.sort()
    
    # Check groups
    if original_indices == [0, 1, 2, 3] or \
       original_indices == [4, 5, 6, 7] or \
       original_indices == [8, 9, 10, 11] or \
       original_indices == [12, 13, 14, 15]:
        result = 1
    else:
        counts = {0:0, 1:0, 2:0, 3:0}
        for idx in original_indices:
            counts[idx // 4] += 1
        if 3 in counts.values():
            result = 0
        else:
            result = -1

    return jsonify({"result": result})

@games_bp.route('/<int:game_id>/solve', methods=['POST'])
def solve_game(game_id):
    data = request.json
    available_indices_shuffled = data.get('available_indices', [])
    bad_guesses_shuffled = data.get('bad_guesses', [])
    seed = data.get('seed')
    
    if seed is None:
        return jsonify({"error": "Missing seed"}), 400
        
    perm = get_permutation(seed)
    available_indices_original = [perm[i] for i in available_indices_shuffled]
    
    # Convert bad guesses to original indices
    bad_guesses_original = []
    for guess in bad_guesses_shuffled:
        bad_guesses_original.append(tuple(sorted([perm[i] for i in guess])))

    game = dynamo_service.get_game(game_id)
    if not game:
        return jsonify({"error": "Game not found"}), 404
        
    matrix = game['adjacency_matrix']
    suggestions = ai_solver.generate_suggestions(matrix, available_indices_original, bad_guesses_original)
    
    inv_perm = {original: shuffled for shuffled, original in enumerate(perm)}
    
    mapped_suggestions = []
    for s in suggestions[:5]:
        mapped_words = [inv_perm[w] for w in s['words']]
        mapped_suggestions.append({
            "words": mapped_words,
            "score": s['score']
        })
        
    return jsonify(mapped_suggestions)
