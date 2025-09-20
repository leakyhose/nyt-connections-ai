class GameDataLoader {
    constructor() {
        this.gamesIndex = null;
        this.gameCache = new Map();
        this.fastGames = [2,4,5,9,11,15,20,21,23,24,29,31,35,36,44,45,46,48,50,52,53,54,55,56,65,69,71,72,75,79,80,85,91,92,93,95,97,99,101,102,105,106,107,111,113,114,116,117,120,122,123,124,125,130,132,134,138,140,141,143,145,146,149,150,152,153,156,162,163,167,176,178,179,185,186,188,189,191,192,193,201,203,208,210,211,213,217,221,222,228,229,231,235,236,237,242,243,244,245,247,248,250,254,256,259,260,261,263,264,265,267,269,273,274,275,277,284,286,288,289,291,296,297,298,299,300,301,302,308,311,312,317,320,325,327,331,336,337,338,339,341,345,346,348,350,351,356,357,359,361,364,367,370,373,377];
    }

    async initialize() {
        try {
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
        if (!this.gamesIndex || this.fastGames.length === 0) {
            return 0;
        }
        const randomIndex = Math.floor(Math.random() * this.fastGames.length);
        return this.fastGames[randomIndex];
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