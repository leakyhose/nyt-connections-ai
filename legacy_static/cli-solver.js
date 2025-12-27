const fs = require('fs');
const path = require('path');
const ConnectionsAI = require('./ai-solver.js');

class CLISolver {
    constructor() {
        this.ai = new ConnectionsAI();
        this.weights = [0.7441864013671875, 0.06005859375];
        this.maxTries = 100;
    }

    loadGameData(gameNumber) {
        try {
            const filePath = path.join(__dirname, 'data', `game_${gameNumber}.json`);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(`Error loading game ${gameNumber}:`, error.message);
            return null;
        }
    }

    solveGame(gameData, gameNumber) {
        let adjacencyMatrix = gameData.adjacency_matrix;
        let availableIndices = Array.from({length: 16}, (_, i) => i);
        let foundGroups = 0;
        let tries = 0;
        const triedSuggestions = new Set();
        
        while (foundGroups < 4 && tries < this.maxTries) {
            tries++;
            
            const suggestions = this.ai.generateSuggestions(
                adjacencyMatrix, 
                availableIndices, 
                this.weights
            );

            const filteredSuggestions = suggestions.filter(suggestion => {
                const key = [...suggestion.words].sort().join(',');
                return !triedSuggestions.has(key);
            });

            if (filteredSuggestions.length === 0) break;

            const guess = filteredSuggestions[0].words;
            const guessKey = [...guess].sort().join(',');
            
            const result = this.ai.checkGuess(guess);
            
            if (result === 1) {
                foundGroups++;
                availableIndices = availableIndices.filter(i => !guess.includes(i));
                adjacencyMatrix = this.ai.removeFoundWords(adjacencyMatrix, guess);
                triedSuggestions.clear();
            } else {
                triedSuggestions.add(guessKey);
            }
        }
        
        return {
            gameNumber,
            tries,
            solved: foundGroups === 4,
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
        
        const results = [];
        let solvedCount = 0;
        let totalTries = 0;
        
        console.log(`Running solver on ${gameNumbers.length} games...\n`);
        
        for (const gameNumber of gameNumbers) {
            const gameData = this.loadGameData(gameNumber);
            if (!gameData) continue;
            
            const result = this.solveGame(gameData, gameNumber);
            results.push(result);
            
            if (result.solved) {
                solvedCount++;
            }
            totalTries += result.tries;
            
            // Show progress every 50 games
            if (results.length % 50 === 0) {
                console.log(`Processed ${results.length}/${gameNumbers.length} games...`);
            }
        }
        
        console.log('\n=== RESULTS ===');
        console.log(`Solved: ${solvedCount}/${results.length} games (${(solvedCount/results.length*100).toFixed(1)}%)`);
        console.log(`Average tries: ${(totalTries/results.length).toFixed(2)}`);
        
        if (solvedCount > 0) {
            const solvedTries = results.filter(r => r.solved).map(r => r.tries);
            const avgSolvedTries = solvedTries.reduce((a, b) => a + b, 0) / solvedTries.length;
            console.log(`Solved games average: ${avgSolvedTries.toFixed(2)} tries`);
            console.log(`Best solve: ${Math.min(...solvedTries)} tries`);
            console.log(`Worst solve: ${Math.max(...solvedTries)} tries`);
        }
        
        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const solver = new CLISolver();
    solver.runAllGames()
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = CLISolver;
