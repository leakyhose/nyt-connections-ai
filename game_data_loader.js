class GameDataLoader {
    constructor() {
        this.gamesIndex = null;
        this.gameCache = new Map();
        this.availableGames = null;
    }

    async initialize() {
        try {
            const possiblePaths = [
                'data/games_index.json',
                './data/games_index.json',
                '/ConnectionsAI/data/games_index.json'
            ];
            
            let response;
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) break;
                } catch (error) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error('Failed to load games index');
            }
            
            this.gamesIndex = await response.json();
            await this.loadAvailableGames();
            return true;
        } catch (error) {
            console.error('Failed to initialize game data loader:', error);
            return false;
        }
    }

    async loadAvailableGames() {
        this.availableGames = [
            1, 2, 4, 12, 19, 22, 26, 27, 31, 32, 35, 39, 40, 43, 48, 49, 53, 54, 55, 58, 61, 62, 64, 65, 68, 69, 71, 72, 74, 78, 82, 84, 86, 89, 90, 94, 95, 99, 100, 104, 105, 108, 114, 118, 120, 127, 128, 131, 132, 133, 135, 136, 140, 142, 145, 147, 148, 149, 152, 157, 161, 163, 165, 172, 176, 180, 182, 187, 190, 193, 195, 196, 199, 202, 205, 206, 209, 212, 214, 216, 218, 221, 223, 224, 225, 227, 229, 230, 233, 236, 237, 239, 242, 243, 245, 250, 251, 257, 261, 263, 264, 265, 267, 268, 269, 270, 274, 275, 279, 281, 286, 295, 296, 298, 299, 305, 308, 309, 312, 317, 318, 323, 324, 325, 326, 329, 335, 336, 339, 340, 342, 343, 346, 351, 352, 357, 361, 363, 364, 365, 367, 368, 369, 371, 372, 374, 377, 379, 381, 382, 383, 384, 386, 389, 391, 392, 393, 394, 400, 403, 407, 408, 409, 410, 413, 414, 417, 418, 420, 421, 423, 424, 430, 431, 435, 444, 446, 447, 453, 454, 456, 457, 459, 460, 461, 469, 471, 476, 478, 479, 480, 481, 485, 486, 487, 489, 490, 493, 496, 497, 498, 501, 503, 504, 505, 510, 511, 512, 513, 515, 516, 518, 522, 524, 525, 527, 529, 531, 532, 534, 535, 541, 542, 543, 545, 551, 555, 556, 557, 564, 565, 566, 567, 568, 569, 572, 575, 578, 583, 586, 590, 593, 595, 596, 600, 601, 602, 603, 605, 610, 612, 613, 614, 615, 618, 620, 621, 623, 626, 632, 634, 635, 638, 639
        ];
    }

    getTotalGames() {
        return this.gamesIndex ? this.gamesIndex.total_games : 0;
    }

    isValidGameNumber(gameNumber) {
        return gameNumber >= 0 && gameNumber < this.getTotalGames();
    }

    async loadGame(gameNumber) {
        if (!this.gamesIndex) {
            throw new Error('Game data loader not initialized');
        }

        if (!this.isValidGameNumber(gameNumber)) {
            throw new Error(`Invalid game number: ${gameNumber}`);
        }

        if (this.gameCache.has(gameNumber)) {
            return this.gameCache.get(gameNumber);
        }

        try {
            const gameInfo = this.gamesIndex.games[gameNumber];
            const possiblePaths = [
                `data/${gameInfo.filename}`,
                `./data/${gameInfo.filename}`,
                `/ConnectionsAI/data/${gameInfo.filename}`
            ];
            
            let response;
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) break;
                } catch (error) {
                    continue;
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Failed to load game ${gameNumber}`);
            }

            const gameData = await response.json();
            
            if (!gameData.words || !gameData.adjacency_matrix) {
                throw new Error(`Invalid game data for game ${gameNumber}`);
            }

            if (gameData.words.length !== 16 || gameData.adjacency_matrix.length !== 16) {
                throw new Error(`Invalid game data structure for game ${gameNumber}`);
            }

            this.gameCache.set(gameNumber, gameData);
            return gameData;

        } catch (error) {
            console.error(`Error loading game ${gameNumber}:`, error);
            throw error;
        }
    }

    getRandomGameNumber() {
        if (!this.availableGames || this.availableGames.length === 0) {
            return 0;
        }
        const randomIndex = Math.floor(Math.random() * this.availableGames.length);
        return this.availableGames[randomIndex];
    }

    async preloadGames(gameNumbers) {
        const promises = gameNumbers.map(async (gameNumber) => {
            if (!this.gameCache.has(gameNumber) && this.isValidGameNumber(gameNumber)) {
                try {
                    await this.loadGame(gameNumber);
                } catch (error) {
                    // Silent fail
                }
            }
        });
        await Promise.all(promises);
    }

    clearCache() {
        this.gameCache.clear();
    }

    getCacheStats() {
        return {
            totalGames: this.getTotalGames(),
            cachedGames: this.gameCache.size,
            cacheHitRatio: this.gameCache.size / Math.max(1, this.getTotalGames())
        };
    }
}

window.gameDataLoader = new GameDataLoader();