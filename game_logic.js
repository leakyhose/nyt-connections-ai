class GameLogic {
    constructor() {
        this.correctSets = [
            new Set([0, 1, 2, 3]),
            new Set([4, 5, 6, 7]),
            new Set([8, 9, 10, 11]),
            new Set([12, 13, 14, 15])
        ];
    }

    calcDensity(arr, adj) {
        let total = 0;
        for (let i of arr) {
            for (let j of arr) {
                total += adj[i][j];
            }
        }
        return total / (arr.length * arr.length);
    }

    calcConductance(arr, adj) {
        let outside = 0;
        let inside = 0;

        for (let i of arr) {
            for (let j = 0; j < adj.length; j++) {
                if (adj[i][j] === -1) continue;

                if (arr.includes(j)) {
                    inside += adj[i][j] / 4;
                } else {
                    outside += adj[i][j];
                }
            }
        }

        if (outside === 0 || inside === 0) return -1;
        return 1 - outside / ((2 * inside) + outside);
    }

    combinations(array, r) {
        const result = [];
        
        function backtrack(start, path) {
            if (path.length === r) {
                result.push([...path]);
                return;
            }
            
            for (let i = start; i < array.length; i++) {
                path.push(array[i]);
                backtrack(i + 1, path);
                path.pop();
            }
        }
        
        backtrack(0, []);
        return result;
    }

    genPriorityQueue(adj, avail, weights) {
        const suggestions = [];
        const combinations = this.combinations(avail, 4);

        for (let combo of combinations) {
            const conductance = this.calcConductance(combo, adj);
            const density = this.calcDensity(combo, adj);
            const score = weights[0] * conductance + weights[1] * density;
            
            suggestions.push({
                words: combo,
                score: score,
                conductance: conductance,
                density: density
            });
        }

        // Sort by score descending
        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    linkPriorityQueue(arr, adj, weights) {
        const suggestions = [];
        const combinations = this.combinations(arr, 3);

        for (let combo of combinations) {
            const conductance = this.calcConductance(combo, adj);
            const density = this.calcDensity(combo, adj);
            const score = weights[0] * conductance + weights[1] * density;
            
            suggestions.push({
                words: combo,
                score: score
            });
        }

        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    /**
     * Generate priority queue of child nodes linked to the given subset
     */
    childPriorityQueue(arr, adj, avail, weights) {
        const suggestions = [];

        for (let i of avail) {
            if (!arr.includes(i)) {
                const combo = [...arr, i];
                const conductance = this.calcConductance(combo, adj);
                const density = this.calcDensity(combo, adj);
                const score = weights[0] * conductance + weights[1] * density;
                
                suggestions.push({
                    words: combo,
                    score: score
                });
            }
        }

        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    purge(adj, indices) {
        const newAdj = adj.map(row => [...row]); // Deep copy
        
        for (let index of indices) {
            for (let i = 0; i < 16; i++) {
                newAdj[index][i] = -1;
                newAdj[i][index] = -1;
            }
        }
        
        return newAdj;
    }

    check(guess) {
        const guessSet = new Set(guess);

        // Check if guess matches any correct group exactly
        for (let correctSet of this.correctSets) {
            if (this.setsEqual(guessSet, correctSet)) {
                return 1; // Correct
            } else if (this.setIntersectionSize(guessSet, correctSet) === 3) {
                return 0; // One away
            }
        }

        return -1; // Incorrect
    }

    /**
     * Check if two sets are equal
     */
    setsEqual(set1, set2) {
        if (set1.size !== set2.size) return false;
        for (let item of set1) {
            if (!set2.has(item)) return false;
        }
        return true;
    }

    /**
     * Get the size of intersection between two sets
     */
    setIntersectionSize(set1, set2) {
        let count = 0;
        for (let item of set1) {
            if (set2.has(item)) count++;
        }
        return count;
    }

    /**
     * Find which correct group a guess belongs to (for one-away scenarios)
     */
    findRelatedGroup(guess) {
        const guessSet = new Set(guess);
        
        for (let i = 0; i < this.correctSets.length; i++) {
            if (this.setIntersectionSize(guessSet, this.correctSets[i]) === 3) {
                return i;
            }
        }
        return -1;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic;
}