import json
import random
import os
from tqdm import tqdm


class GeneticAlgorithm:
    def __init__(self, population_size=50, mutation_rate=0.1, crossover_rate=0.7):
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.population = []
        
    def initialize_population(self):
        """Create random initial population of weight pairs [w1, w2]"""
        self.population = []
        for _ in range(self.population_size):
            w1 = random.random()
            w2 = random.random()
            self.population.append([w1, w2])
    
    def calc_density(self, indices, adjacency_matrix):
        """Calculate density metric for a group of words"""
        total = 0
        for i in indices:
            for j in indices:
                total += adjacency_matrix[i][j]
        return total / (len(indices) * len(indices))
    
    def calc_conductance(self, indices, adjacency_matrix):
        """Calculate conductance metric for a group of words"""
        outside_connections = 0
        inside_connections = 0
        
        for i in indices:
            for j in range(len(adjacency_matrix)):
                if adjacency_matrix[i][j] == -1:
                    continue
                
                if j in indices:
                    inside_connections += adjacency_matrix[i][j] / 4
                else:
                    outside_connections += adjacency_matrix[i][j]
        
        if outside_connections == 0 or inside_connections == 0:
            return -1
        return 1 - outside_connections / ((2 * inside_connections) + outside_connections)
    
    def generate_combinations(self, arr, r):
        """Generate all combinations of r elements from arr"""
        result = []
        
        def backtrack(start, path):
            if len(path) == r:
                result.append(path[:])
                return
            for i in range(start, len(arr)):
                path.append(arr[i])
                backtrack(i + 1, path)
                path.pop()
        
        backtrack(0, [])
        return result
    
    def solve_game(self, game_data, weights, max_tries=100):
        """Attempt to solve a game with given weights"""
        adjacency_matrix = [row[:] for row in game_data['adjacency_matrix']]
        available_indices = list(range(16))
        found_groups = 0
        tries = 0
        tried_suggestions = set()
        
        correct_sets = [
            set([0, 1, 2, 3]),
            set([4, 5, 6, 7]),
            set([8, 9, 10, 11]),
            set([12, 13, 14, 15])
        ]
        
        while found_groups < 4 and tries < max_tries:
            tries += 1
            
            suggestions = []
            combos = self.generate_combinations(available_indices, 4)
            
            for combo in combos:
                conductance = self.calc_conductance(combo, adjacency_matrix)
                density = self.calc_density(combo, adjacency_matrix)
                score = weights[0] * conductance + weights[1] * density
                suggestions.append({'words': combo, 'score': score})
            
            suggestions.sort(key=lambda x: x['score'], reverse=True)
            
            filtered = [s for s in suggestions if tuple(sorted(s['words'])) not in tried_suggestions]
            if not filtered:
                break
            
            guess = filtered[0]['words']
            guess_key = tuple(sorted(guess))
            
            guess_set = set(guess)
            is_correct = any(guess_set == correct_set for correct_set in correct_sets)
            
            if is_correct:
                found_groups += 1
                available_indices = [i for i in available_indices if i not in guess]
                for idx in guess:
                    for i in range(16):
                        adjacency_matrix[idx][i] = -1
                        adjacency_matrix[i][idx] = -1
                tried_suggestions.clear()
            else:
                tried_suggestions.add(guess_key)
        
        return tries if found_groups == 4 else max_tries
    
    def fitness(self, weights, game_files, data_dir='data'):
        """Calculate fitness as average number of tries across all games (lower is better)"""
        total_tries = 0
        games_count = 0
        
        for game_file in game_files:
            filepath = os.path.join(data_dir, game_file)
            if not os.path.exists(filepath):
                continue
            
            with open(filepath, 'r') as f:
                game_data = json.load(f)
            
            tries = self.solve_game(game_data, weights)
            total_tries += tries
            games_count += 1
        
        if games_count == 0:
            return float('inf')
        
        return total_tries / games_count
    
    def tournament_selection(self, fitnesses, tournament_size=3):
        """Select parent using tournament selection"""
        tournament_indices = random.sample(range(len(self.population)), tournament_size)
        tournament_fitnesses = [fitnesses[i] for i in tournament_indices]
        winner_idx = tournament_indices[tournament_fitnesses.index(min(tournament_fitnesses))]
        return self.population[winner_idx]
    
    def crossover(self, parent1, parent2):
        """Single-point crossover"""
        if random.random() < self.crossover_rate:
            return [parent1[0], parent2[1]]
        return parent1[:]
    
    def mutate(self, individual):
        """Mutate weights with small random changes"""
        mutated = individual[:]
        for i in range(len(mutated)):
            if random.random() < self.mutation_rate:
                mutated[i] += random.gauss(0, 0.1)
                mutated[i] = max(0, min(1, mutated[i]))  # Keep in [0, 1]
        return mutated
    
    def evolve(self, game_files, generations=50, data_dir='data'):
        """Run genetic algorithm for specified number of generations"""
        self.initialize_population()
        
        best_individual = None
        best_fitness = float('inf')
        
        for generation in range(generations):
            fitnesses = []
            for individual in tqdm(self.population, desc=f"Gen {generation+1}/{generations}", leave=False):
                fit = self.fitness(individual, game_files, data_dir)
                fitnesses.append(fit)
            
            min_fitness = min(fitnesses)
            if min_fitness < best_fitness:
                best_fitness = min_fitness
                best_individual = self.population[fitnesses.index(min_fitness)][:]
            
            print(f"Generation {generation+1}: Best fitness = {best_fitness:.2f} tries, Best weights = {best_individual}")
            
            new_population = []
            
            new_population.append(best_individual[:])
            
            while len(new_population) < self.population_size:
                parent1 = self.tournament_selection(fitnesses)
                parent2 = self.tournament_selection(fitnesses)
                child = self.crossover(parent1, parent2)
                child = self.mutate(child)
                new_population.append(child)
            
            self.population = new_population
        
        return best_individual, best_fitness


def main():
    data_dir = 'data'
    all_files = [f for f in os.listdir(data_dir) if f.startswith('game_') and f.endswith('.json')]
    
    training_files = random.sample(all_files, min(50, len(all_files)))
    
    print(f"Training on {len(training_files)} games")
    
    ga = GeneticAlgorithm(population_size=30, mutation_rate=0.15, crossover_rate=0.7)
    best_weights, best_fitness = ga.evolve(training_files, generations=20, data_dir=data_dir)
    
    print(f"\nFinal best weights: {best_weights}")
    print(f"Final best fitness: {best_fitness:.2f} average tries")


if __name__ == "__main__":
    main()
