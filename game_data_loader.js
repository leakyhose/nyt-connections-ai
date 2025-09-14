/**
 * Client-side Game Data Loader for GitHub Pages
 * Replaces server-side API with direct JSON file loading
 */

class GameDataLoader {
    constructor() {
        this.gamesIndex = null;
        this.gameCache = new Map(); // Cache loaded games
    }

    /**
     * Initialize the data loader by loading the games index
     */
    async initialize() {
        try {
            // Try multiple possible paths for GitHub Pages compatibility
            const possiblePaths = [
                'data/games_index.json',
                './data/games_index.json',
                '/ConnectionsAI/data/games_index.json'
            ];
            
            let response;
            let lastError;
            
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        console.log(`Successfully loaded games index from: ${path}`);
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    console.warn(`Failed to load from ${path}:`, error.message);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Failed to load games index from any path. Last error: ${lastError?.message || 'Unknown error'}`);
            }
            
            this.gamesIndex = await response.json();
            console.log(`Initialized with ${this.gamesIndex.total_games} games available`);
            return true;
        } catch (error) {
            console.error('Failed to initialize game data loader:', error);
            return false;
        }
    }

    /**
     * Get the total number of available games
     */
    getTotalGames() {
        return this.gamesIndex ? this.gamesIndex.total_games : 0;
    }

    /**
     * Check if a game number is valid
     */
    isValidGameNumber(gameNumber) {
        return gameNumber >= 0 && gameNumber < this.getTotalGames();
    }

    /**
     * Load game data for a specific game number
     */
    async loadGame(gameNumber) {
        // Validate game number
        if (!this.gamesIndex) {
            throw new Error('Game data loader not initialized. Call initialize() first.');
        }

        if (!this.isValidGameNumber(gameNumber)) {
            throw new Error(`Invalid game number: ${gameNumber}. Must be between 0 and ${this.getTotalGames() - 1}`);
        }

        // Check cache first
        if (this.gameCache.has(gameNumber)) {
            console.log(`Loading game ${gameNumber} from cache`);
            return this.gameCache.get(gameNumber);
        }

        try {
            // Load game data from JSON file
            const gameInfo = this.gamesIndex.games[gameNumber];
            
            // Try multiple possible paths for GitHub Pages compatibility
            const possiblePaths = [
                `data/${gameInfo.filename}`,
                `./data/${gameInfo.filename}`,
                `/ConnectionsAI/data/${gameInfo.filename}`
            ];
            
            let response;
            let lastError;
            
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        break;
                    }
                } catch (error) {
                    lastError = error;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Failed to load game ${gameNumber} from any path. Status: ${response?.status}. Last error: ${lastError?.message || 'Unknown error'}`);
            }

            const gameData = await response.json();
            
            // Validate game data structure
            if (!gameData.words || !gameData.adjacency_matrix) {
                throw new Error(`Invalid game data structure for game ${gameNumber}`);
            }

            if (gameData.words.length !== 16) {
                throw new Error(`Invalid number of words: expected 16, got ${gameData.words.length}`);
            }

            if (gameData.adjacency_matrix.length !== 16) {
                throw new Error(`Invalid adjacency matrix size: expected 16x16`);
            }

            // Cache the game data
            this.gameCache.set(gameNumber, gameData);
            
            console.log(`Loaded game ${gameNumber}: [${gameData.words.join(', ')}]`);
            return gameData;

        } catch (error) {
            console.error(`Error loading game ${gameNumber}:`, error);
            throw error;
        }
    }

    /**
     * Get a random game number
     */
    getRandomGameNumber() {
        if (!this.gamesIndex) {
            return 0;
        }
        return Math.floor(Math.random() * this.getTotalGames());
    }

    /**
     * Preload multiple games for better performance
     */
    async preloadGames(gameNumbers) {
        const promises = gameNumbers.map(async (gameNumber) => {
            if (!this.gameCache.has(gameNumber) && this.isValidGameNumber(gameNumber)) {
                try {
                    await this.loadGame(gameNumber);
                } catch (error) {
                    console.warn(`Failed to preload game ${gameNumber}:`, error.message);
                }
            }
        });

        await Promise.all(promises);
        console.log(`Preloaded ${promises.length} games`);
    }

    /**
     * Clear the game cache to free memory
     */
    clearCache() {
        this.gameCache.clear();
        console.log('Game cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            totalGames: this.getTotalGames(),
            cachedGames: this.gameCache.size,
            cacheHitRatio: this.gameCache.size / Math.max(1, this.getTotalGames())
        };
    }
}

// Create global instance
window.gameDataLoader = new GameDataLoader();