class ConnectionsAI {
    constructor() {
        this.correctSets = [
            new Set([0, 1, 2, 3]),
            new Set([4, 5, 6, 7]),
            new Set([8, 9, 10, 11]),
            new Set([12, 13, 14, 15])
        ];
    }

    calcDensity(indices, adjacencyMatrix) {
        let total = 0;
        for (let i of indices) {
            for (let j of indices) {
                total += adjacencyMatrix[i][j];
            }
        }
        return total / (indices.length * indices.length);
    }

    calcConductance(indices, adjacencyMatrix) {
        let outsideConnections = 0;
        let insideConnections = 0;

        for (let i of indices) {
            for (let j = 0; j < adjacencyMatrix.length; j++) {
                if (adjacencyMatrix[i][j] === -1) continue;

                if (indices.includes(j)) {
                    insideConnections += adjacencyMatrix[i][j] / 4;
                } else {
                    outsideConnections += adjacencyMatrix[i][j];
                }
            }
        }

        if (outsideConnections === 0 || insideConnections === 0) return -1;
        return 1 - outsideConnections / ((2 * insideConnections) + outsideConnections);
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

    /**
     * Generate ranked suggestions for complete groups of 4 words
     */
    generateSuggestions(adjacencyMatrix, availableIndices, weights) {
        const suggestions = [];
        const combos = this.combinations(availableIndices, 4);

        for (let combo of combos) {
            const conductance = this.calcConductance(combo, adjacencyMatrix);
            const density = this.calcDensity(combo, adjacencyMatrix);
            const score = weights[0] * conductance + weights[1] * density;
            
            suggestions.push({
                words: combo,
                score: score,
                conductance: conductance,
                density: density
            });
        }

        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    generateCompletionSuggestions(threeWords, adjacencyMatrix, availableIndices, weights) {
        const suggestions = [];

        for (let i of availableIndices) {
            if (!threeWords.includes(i)) {
                const fourWords = [...threeWords, i];
                const conductance = this.calcConductance(fourWords, adjacencyMatrix);
                const density = this.calcDensity(fourWords, adjacencyMatrix);
                const score = weights[0] * conductance + weights[1] * density;
                
                suggestions.push({
                    words: fourWords,
                    score: score
                });
            }
        }

        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    findBestTrio(fourWords, adjacencyMatrix, weights) {
        const suggestions = [];
        const trios = this.combinations(fourWords, 3);

        for (let trio of trios) {
            const conductance = this.calcConductance(trio, adjacencyMatrix);
            const density = this.calcDensity(trio, adjacencyMatrix);
            const score = weights[0] * conductance + weights[1] * density;
            
            suggestions.push({
                words: trio,
                score: score
            });
        }

        suggestions.sort((a, b) => b.score - a.score);
        return suggestions;
    }

    removeFoundWords(adjacencyMatrix, foundIndices) {
        const newMatrix = adjacencyMatrix.map(row => [...row]);
        
        for (let index of foundIndices) {
            for (let i = 0; i < 16; i++) {
                newMatrix[index][i] = -1;
                newMatrix[i][index] = -1;
            }
        }
        
        return newMatrix;
    }

    checkGuess(guess) {
        const guessSet = new Set(guess);

        for (let correctSet of this.correctSets) {
            if (this.setsEqual(guessSet, correctSet)) {
                return 1; // Correct
            } else if (this.setIntersectionSize(guessSet, correctSet) === 3) {
                return 0; // One away
            }
        }

        return -1; // Incorrect
    }

    setsEqual(set1, set2) {
        if (set1.size !== set2.size) return false;
        for (let item of set1) {
            if (!set2.has(item)) return false;
        }
        return true;
    }

    setIntersectionSize(set1, set2) {
        let count = 0;
        for (let item of set1) {
            if (set2.has(item)) count++;
        }
        return count;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConnectionsAI;
}
