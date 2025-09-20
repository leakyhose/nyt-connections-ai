const fs = require('fs');
const path = require('path');

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

    // Returns: 1 = correct, 0 = one away, -1 = incorrect
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

class GameSolver {
    constructor() {
        this.gameLogic = new GameLogic();
        this.weights = [0.7441864013671875, 0.06005859375]; // Same weights as web version
        this.maxTries = 100; // Safety limit
    }

    loadGameData(gameNumber) {
        try {
            const filePath = path.join(__dirname, 'data', `game_${gameNumber}.json`);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data;
        } catch (error) {
            console.error(`Error loading game ${gameNumber}:`, error.message);
            return null;
        }
    }

    solveGame(gameData, gameNumber) {
        const words = gameData.words;
        let adjacencyMatrix = gameData.adjacency_matrix;
        let availableIndices = Array.from({length: 16}, (_, i) => i);
        let foundGroups = 0;
        let tries = 0;
        const triedSuggestions = new Set();
        
        console.log(`\nSolving Game ${gameNumber}: [${words.join(', ')}]`);
        
        while (foundGroups < 4 && tries < this.maxTries) {
            tries++;
            
            // Generate suggestions using the same logic as the web interface
            const suggestions = this.gameLogic.genPriorityQueue(
                adjacencyMatrix, 
                availableIndices, 
                this.weights
            );

            // Filter out tried suggestions
            const filteredSuggestions = suggestions.filter(suggestion => {
                const suggestionKey = [...suggestion.words].sort().join(',');
                return !triedSuggestions.has(suggestionKey);
            });

            if (filteredSuggestions.length === 0) {
                console.log(`Game ${gameNumber}: No more suggestions available after ${tries} tries`);
                break;
            }

            // Try the best suggestion
            const bestSuggestion = filteredSuggestions[0];
            const guess = bestSuggestion.words;
            const suggestionKey = [...guess].sort().join(',');
            
            console.log(`  Try ${tries}: [${guess.map(i => words[i]).join(', ')}] (Score: ${bestSuggestion.score.toFixed(3)})`);
            
            // Check the guess
            const result = this.gameLogic.check(guess);
            
            if (result === 1) {
                // Correct guess
                console.log(`    Correct`);
                foundGroups++;
                
                // Remove correct words from available indices
                availableIndices = availableIndices.filter(i => !guess.includes(i));
                
                // Update adjacency matrix
                adjacencyMatrix = this.gameLogic.purge(adjacencyMatrix, guess);
                
                // Clear tried suggestions for fresh start
                triedSuggestions.clear();
                
            } else if (result === 0) {
                // One away
                console.log(`    One away`);
                triedSuggestions.add(suggestionKey);
                
            } else {
                // Incorrect
                console.log(`    Incorrect`);
                triedSuggestions.add(suggestionKey);
            }
        }
        
        const solved = foundGroups === 4;
        console.log(`Game ${gameNumber} ${solved ? 'SOLVED' : 'FAILED'} in ${tries} tries (${foundGroups}/4 groups found)`);
        
        return {
            gameNumber,
            tries,
            solved,
            foundGroups
        };
    }

    getAvailableGames() {
        const dataDir = path.join(__dirname, 'data');
        const files = fs.readdirSync(dataDir);
        const gameNumbers = [];
        
        for (const file of files) {
            const match = file.match(/^game_(\d+)\.json$/);
            if (match) {
                gameNumbers.push(parseInt(match[1]));
            }
        }
        
        return gameNumbers.sort((a, b) => a - b);
    }

    async runAllGames() {
        const gameNumbers = this.getAvailableGames();
        console.log(`Found ${gameNumbers.length} games to solve`);
        
        const results = [];
        let solvedCount = 0;
        let totalTries = 0;
        
        for (const gameNumber of gameNumbers) {
            const gameData = this.loadGameData(gameNumber);
            if (!gameData) {
                console.log(`Skipping game ${gameNumber} - failed to load`);
                continue;
            }
            
            const result = this.solveGame(gameData, gameNumber);
            results.push(result);
            
            if (result.solved) {
                solvedCount++;
            }
            totalTries += result.tries;
        }
        
        // Generate summary report
        console.log('\n' + '='.repeat(60));
        console.log('FINAL RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total games: ${results.length}`);
        console.log(`Games solved: ${solvedCount} (${(solvedCount/results.length*100).toFixed(1)}%)`);
        console.log(`Games failed: ${results.length - solvedCount}`);
        console.log(`Total tries: ${totalTries}`);
        console.log(`Average tries per game: ${(totalTries/results.length).toFixed(2)}`);
        
        if (solvedCount > 0) {
            const solvedTries = results.filter(r => r.solved).map(r => r.tries);
            const avgSolvedTries = solvedTries.reduce((a, b) => a + b, 0) / solvedTries.length;
            console.log(`Average tries for solved games: ${avgSolvedTries.toFixed(2)}`);
            console.log(`Min tries: ${Math.min(...solvedTries)}`);
            console.log(`Max tries: ${Math.max(...solvedTries)}`);
        }
        
        // Save detailed results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `game_results_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify({
            summary: {
                totalGames: results.length,
                gamesSolved: solvedCount,
                gamesFailed: results.length - solvedCount,
                totalTries: totalTries,
                averageTriesPerGame: totalTries/results.length,
                timestamp: new Date().toISOString()
            },
            results: results
        }, null, 2));
        
        console.log('\nDetailed results saved to: ' + resultsFile);
        
        return results;
    }
}

// Main execution
if (require.main === module) {
    const solver = new GameSolver();
    solver.runAllGames()
        .then(() => {
            console.log('\nSolver completed successfully!');
        })
        .catch((error) => {
            console.error('Error running solver:', error);
            process.exit(1);
        });
}

module.exports = GameSolver;