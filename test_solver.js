/**
 * Test script for the Connections Game Solver
 */

const GameSolver = require('./game_solver');

class GameSolverTester {
    constructor() {
        this.solver = new GameSolver();
    }

    async testSubset(maxGames = 5) {
        const allGames = this.solver.getAvailableGames();
        const testGames = allGames.slice(0, maxGames);
        
        console.log(`Testing solver on first ${testGames.length} games: [${testGames.join(', ')}]`);
        console.log('='.repeat(60));
        
        const results = [];
        
        for (const gameNumber of testGames) {
            const gameData = this.solver.loadGameData(gameNumber);
            if (!gameData) {
                console.log(`Skipping game ${gameNumber} - failed to load`);
                continue;
            }
            
            const result = this.solver.solveGame(gameData, gameNumber);
            results.push(result);
        }
        
        // Print test summary
        console.log('\n' + '='.repeat(40));
        console.log('TEST RESULTS SUMMARY');
        console.log('='.repeat(40));
        const solvedCount = results.filter(r => r.solved).length;
        const totalTries = results.reduce((sum, r) => sum + r.tries, 0);
        
        console.log(`Test games: ${results.length}`);
        console.log(`Games solved: ${solvedCount} (${(solvedCount/results.length*100).toFixed(1)}%)`);
        console.log(`Average tries: ${(totalTries/results.length).toFixed(2)}`);
        
        if (solvedCount > 0) {
            const solvedTries = results.filter(r => r.solved).map(r => r.tries);
            console.log(`Average tries for solved: ${(solvedTries.reduce((a,b) => a+b, 0)/solvedTries.length).toFixed(2)}`);
        }
        
        return results;
    }
}

// Run the test
if (require.main === module) {
    const tester = new GameSolverTester();
    
    tester.testSubset(5)
        .then((results) => {
            console.log('\nTest completed successfully!');
            if (results.length > 0 && results.some(r => r.solved)) {
                console.log('Solver appears to be working correctly');
                console.log('You can now run the full solver with: node game_solver.js');
            } else {
                console.log('Warning: No games were solved in the test');
                console.log('You may want to check the solver logic before running on all games');
            }
        })
        .catch((error) => {
            console.error('Error during testing:', error);
            process.exit(1);
        });
}

module.exports = GameSolverTester;