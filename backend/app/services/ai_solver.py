import itertools

class AISolver:
    def __init__(self):
        self.weights = [0.7441864013671875, 0.06005859375]

    def calc_density(self, indices, adjacency_matrix):
        total = 0
        n = len(indices)
        if n == 0: return 0
        
        for i in indices:
            for j in indices:
                total += adjacency_matrix[i][j]
        
        return total / (n * n)

    def calc_conductance(self, indices, adjacency_matrix):
        outside_connections = 0
        inside_connections = 0
        
        # set for O(1) lookup
        indices_set = set(indices)
        matrix_len = len(adjacency_matrix)

        for i in indices:
            for j in range(matrix_len):
                if adjacency_matrix[i][j] == -1:
                    continue

                if j in indices_set:
                    inside_connections += adjacency_matrix[i][j] / 4
                else:
                    outside_connections += adjacency_matrix[i][j]
        
        if outside_connections == 0 or inside_connections == 0:
            return -1
            
        return 1 - outside_connections / ((2 * inside_connections) + outside_connections)

    def generate_suggestions(self, adjacency_matrix, available_indices, bad_guesses=None):
        if bad_guesses is None:
            bad_guesses = []
            
        bad_guesses_set = set(bad_guesses)
        
        suggestions = []
        # Generates all combinations of 4 words from available indices
        combos = list(itertools.combinations(available_indices, 4))

        for combo in combos:
            # Skip if this combination has already been guessed and was wrong
            if tuple(sorted(combo)) in bad_guesses_set:
                continue
                
            conductance = self.calc_conductance(combo, adjacency_matrix)
            density = self.calc_density(combo, adjacency_matrix)
            score = self.weights[0] * conductance + self.weights[1] * density
            
            suggestions.append({
                "words": list(combo),
                "score": score,
                "conductance": conductance,
                "density": density
            })

        # Sort by score descending
        suggestions.sort(key=lambda x: x['score'], reverse=True)
        return suggestions

ai_solver = AISolver()
