import ConnectionsAI from './ai-solver.js';

class WebApp {
    constructor() {
        this.ai = new ConnectionsAI();
        this.data = new DataLoader();
        
        // Game state
        this.currentGameNumber = null;
        this.words = [];
        this.adjacencyMatrix = [];
        this.availableIndices = [];
        this.selectedIndices = [];
        this.turns = 0;
        
        // AI configuration
        this.weights = [0.7441864013671875, 0.06005859375];
        this.triedSuggestions = new Set();
        
        this.initializeEventListeners();
        this.initializeModal();
    }


    

    async loadGlobalStats() {
        try {
            const docRef = db.collection('global-stats').doc('counter');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('globalCounter').textContent = 
                    (data.totalGamesPlayed || 0).toLocaleString();
            } else {
                document.getElementById('globalCounter').textContent = '0';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            document.getElementById('globalCounter').textContent = '---';
        }
    }

    async incrementGlobalStats() {
        try {
            const docRef = db.collection('global-stats').doc('counter');
            
            // Try to update existing document
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                
                if (doc.exists) {
                    const newCount = (doc.data().totalGamesPlayed || 0) + 1;
                    transaction.update(docRef, {
                        totalGamesPlayed: newCount,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Create document if it doesn't exist
                    transaction.set(docRef, {
                        totalGamesPlayed: 1,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            
            // Reload stats to show updated count
            await this.loadGlobalStats();
            
        } catch (error) {
            console.error('Error incrementing stats:', error);
        }
    }
    initializeModal() {
        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showInfoModal();
            });
        }

        const closeBtn = document.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideInfoModal());
        }
        
        window.addEventListener('resize', () => this.fixOverlaySize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.fixOverlaySize(), 100);
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('infoModal');
            const modalContent = modal?.querySelector('.info-modal-content');
            
            if (modal?.classList.contains('show') && modalContent && !modalContent.contains(e.target)) {
                this.hideInfoModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('infoModal');
                if (modal?.classList.contains('show')) {
                    this.hideInfoModal();
                }
            }
        });
    }

    fixOverlaySize() {
        const overlays = document.querySelectorAll('.popup-overlay, .info-modal');
        overlays.forEach(overlay => {
            overlay.style.width = '';
            overlay.style.height = '';
            overlay.style.top = '';
            overlay.style.left = '';
            overlay.style.right = '';
            overlay.style.bottom = '';
            
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.minWidth = '100vw';
            overlay.style.minHeight = '100vh';
            overlay.style.maxWidth = 'none';
            overlay.style.maxHeight = 'none';
        });
    }

    showInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            this.fixOverlaySize();
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            localStorage.setItem('connectionsai-info-seen', 'true');
        }
    }

    initializeEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-card') && !e.target.classList.contains('found')) {
                this.toggleWordSelection(e.target);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.suggestion-item')) {
                this.selectSuggestion(e.target.closest('.suggestion-item'));
            }
        });
    }

    async loadGame(gameNumber) {
        try {
            this.exitIntroMode();
            
            document.getElementById('wordGrid').innerHTML = '<div class="loading">Loading game...</div>';
            document.getElementById('suggestionsList').innerHTML = '<div class="loading">Loading suggestions...</div>';
            
            const gameData = await this.data.loadGame(gameNumber);
            this.words = gameData.words;
            this.adjacencyMatrix = gameData.adjacency_matrix;
            
            this.currentGameNumber = gameNumber;
            document.getElementById('gameNumber').textContent = gameNumber;
                this.availableIndices = Array.from({length: 16}, (_, i) => i);
                this.selectedIndices = [];
                this.turns = 0;
            this.triedSuggestions.clear();
            
            this.updateDisplay();
            this.generateSuggestionsWithAnimation();
            this.updateCounters();
            
        } catch (error) {
            console.error('Error loading game:', error);
            document.getElementById('wordGrid').innerHTML = `<div class="loading">Error: ${error.message}</div>`;
            document.getElementById('suggestionsList').innerHTML = `<div class="loading">Failed to load</div>`;
        }
    }

    loadRandomGame() {
        const randomGame = this.data.getRandomGameNumber();
        document.getElementById('gameNumber').textContent = randomGame;
        this.loadGame(randomGame);
    }

    exitIntroMode() {
        const gameInfo = document.getElementById('gameInfo');
        const mainContent = document.getElementById('mainContent');
        const titleContainer = document.querySelector('.title-container');
        
        if (gameInfo.classList.contains('intro-mode')) {
            gameInfo.classList.remove('intro-mode');
            titleContainer.classList.remove('intro-mode');
            document.body.classList.remove('intro-mode');
            setTimeout(() => mainContent.classList.remove('hidden'), 200);
        }
    }

    returnToIntroMode() {
        const gameInfo = document.getElementById('gameInfo');
        const mainContent = document.getElementById('mainContent');
        const titleContainer = document.querySelector('.title-container');
        
        mainContent.classList.add('hidden');
        
        setTimeout(() => {
            gameInfo.classList.add('intro-mode');
            titleContainer.classList.add('intro-mode');
            document.body.classList.add('intro-mode');
            this.resetGame();
        }, 300);
    }

    resetGame() {
        this.currentGameNumber = null;
        this.words = [];
    this.selectedIndices = [];
    this.turns = 0;
        this.triedSuggestions.clear();
        
    document.getElementById('turnsCounter').textContent = 'Turns: 0';
        document.getElementById('wordGrid').innerHTML = '';
        document.getElementById('suggestionsList').innerHTML = 
            '<div class="suggestions-title">Suggestions</div><div class="loading">Load a game to see suggestions!</div>';
    }

    updateDisplay() {
        const grid = document.getElementById('wordGrid');
        grid.innerHTML = '';
        
        const availableWords = this.availableIndices.map(i => ({index: i, word: this.words[i]}));
        this.shuffleArray(availableWords);
        
        availableWords.forEach(item => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.dataset.index = item.index;
            
            const wordLength = item.word.length;
            if (wordLength > 12) {
                card.style.fontSize = '0.7em';
            } else if (wordLength > 10) {
                card.style.fontSize = '0.8em';
            } else if (wordLength > 8) {
                card.style.fontSize = '0.85em';
            }
            
            card.textContent = item.word;
            
            if (this.selectedIndices.includes(item.index)) {
                card.classList.add('selected');
            }
            
            grid.appendChild(card);
        });
    }

    updateCounters() {
        document.getElementById('turnsCounter').textContent = `Turns: ${this.turns}`;
    }

    toggleWordSelection(card) {
        const index = parseInt(card.dataset.index);
        
        if (this.selectedIndices.includes(index)) {
            this.selectedIndices = this.selectedIndices.filter(i => i !== index);
            card.classList.remove('selected');
        } else if (this.selectedIndices.length < 4) {
            this.selectedIndices.push(index);
            card.classList.add('selected');
        }
        
        this.updateSubmitButton();
    }

    clearSelection() {
        this.selectedIndices = [];
        document.querySelectorAll('.word-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        this.updateSubmitButton();
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('submitBtn');
        const gameStats = document.getElementById('gameStats');
        
        gameStats.classList.toggle('hidden', this.selectedIndices.length === 0);
        
        if (this.selectedIndices.length === 4) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Guess';
            submitBtn.style.background = 'linear-gradient(135deg, rgba(60, 150, 60, 0.9), rgba(40, 130, 40, 0.9))';
        } else {
            submitBtn.disabled = true;
            submitBtn.textContent = `Submit Guess (Select ${4 - this.selectedIndices.length} more)`;
            submitBtn.style.background = '';
        }
    }

    submitGuess() {
        if (this.selectedIndices.length !== 4) return;
        
        const guessKey = [...this.selectedIndices].sort().join(',');
        this.turns++;
        
        const result = this.ai.checkGuess(this.selectedIndices);
        this.showResultPopup(result);
        
        if (result === 1) {
            this.handleCorrectGuess();
        } else {
            this.triedSuggestions.add(guessKey);
            this.removeSuggestionWithAnimation(guessKey);
            this.clearSelection();
            
            if (result === 0) {
                this.handleOneAway();
            }
        }
        
        this.updateCounters();
    }

    handleCorrectGuess() {
        this.availableIndices = this.availableIndices.filter(i => !this.selectedIndices.includes(i));
        this.adjacencyMatrix = this.ai.removeFoundWords(this.adjacencyMatrix, this.selectedIndices);
        
    this.selectedIndices = [];

    this.updateDisplay();
        this.updateSubmitButton();
        
        if (this.availableIndices.length === 0) {
            setTimeout(() => this.showCompletionPopup(), 1000);
        } else {
            this.generateSuggestionsWithAnimation();
        }
    }

    handleOneAway() {
        const trios = this.ai.findBestTrio(this.selectedIndices, this.adjacencyMatrix, this.weights);
        
        if (trios.length > 0) {
            const bestTrio = trios[0].words;
            const completions = this.ai.generateCompletionSuggestions(
                bestTrio, this.adjacencyMatrix, this.availableIndices, this.weights
            );
            
            if (completions.length > 0) {
                this.displaySuggestions(completions.slice(0, 5), 'Completion Suggestions');
                return;
            }
        }
        
        this.generateSuggestionsWithAnimation();
    }

    generateSuggestionsWithAnimation() {
        if (this.availableIndices.length === 0) return;
        
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = 
            '<div class="suggestions-title">Thinking...</div><div class="loading">Finding connections...</div>';
        
        this.showOverlay();
        
        const thinkingDelay = Math.random() * 560 + 640;
        const overlayDelay = Math.random() * 320 + 640;
        
        setTimeout(() => this.generateSuggestions(), thinkingDelay);
        setTimeout(() => this.hideOverlay(), overlayDelay);
    }

    generateSuggestions() {
        if (this.availableIndices.length === 0) return;
        
        const suggestions = this.ai.generateSuggestions(
            this.adjacencyMatrix, 
            this.availableIndices, 
            this.weights
        );
        
        const filtered = suggestions.filter(s => {
            const key = [...s.words].sort().join(',');
            return !this.triedSuggestions.has(key);
        });
        
        this.displaySuggestions(filtered.slice(0, 10), 'Suggestions');
    }

    displaySuggestions(suggestions, title = 'Suggestions') {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = `<div class="suggestions-title">${title}</div>`;
        
        if (suggestions.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'loading';
            msg.textContent = 'No more suggestions available';
            suggestionsList.appendChild(msg);
            return;
        }
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.dataset.words = JSON.stringify(suggestion.words);
            item.innerHTML = `
                <div class="suggestion-rank">#${index + 1}</div>
                <div class="suggestion-words">${suggestion.words.map(i => this.words[i]).join(', ')}</div>
                <div class="suggestion-score">Score: ${suggestion.score.toFixed(3)}</div>
            `;
            suggestionsList.appendChild(item);
        });
    }

    selectSuggestion(element) {
        const words = JSON.parse(element.dataset.words);
        this.clearSelection();
        this.selectedIndices = [...words];
        
        words.forEach(index => {
            const card = document.querySelector(`[data-index="${index}"]`);
            if (card) card.classList.add('selected');
        });
        
        this.updateSubmitButton();
    }

    removeSuggestionWithAnimation(guessKey) {
        document.querySelectorAll('.suggestion-item').forEach(item => {
            const words = JSON.parse(item.dataset.words);
            const itemKey = [...words].sort().join(',');
            
            if (itemKey === guessKey) {
                item.classList.add('removing');
                setTimeout(() => item.remove(), 200);
            }
        });
    }

    showOverlay() {
        document.getElementById('popupOverlay').classList.add('active');
    }

    hideOverlay() {
        document.getElementById('popupOverlay').classList.remove('active');
    }

    showResultPopup(result) {
        this.showOverlay();
        
        const popup = document.createElement('div');
        popup.className = 'result-message';
        
        if (result === 1) {
            popup.className += ' result-correct';
            popup.textContent = 'CORRECT';
        } else if (result === 0) {
            popup.className += ' result-one-away';
            popup.textContent = 'ONE AWAY';
        } else {
            popup.className += ' result-incorrect';
            popup.textContent = 'INCORRECT';
        }
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
            if (this.availableIndices.length > 0) {
                this.hideOverlay();
            }
        }, 1000);
    }

    showCompletionPopup() {
    this.showOverlay();
    
    const mistakes = this.turns - 4;
    const popup = document.createElement('div');
    popup.className = 'result-message result-completion';
    
    let message = 'Game Complete!';
    if (mistakes === 0) message = 'Perfect Game!';
    else if (mistakes <= 2) message = 'Great Job!';
    else if (mistakes <= 4) message = 'Good Work!';
    
    popup.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 10px;">${message}</div>
        <div>Total turns: ${this.turns}</div>
        <div>Mistakes: ${mistakes}</div>
    `;
    
    document.body.appendChild(popup);
    
    this.incrementGlobalStats();
    
    setTimeout(() => {
        popup.remove();
        this.hideOverlay();
        this.returnToIntroMode();
    }, 1000);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

class DataLoader {
    constructor() {
        this.gamesIndex = null;
        this.gameCache = new Map();
        this.availableGames = [
            1, 2, 4, 12, 19, 22, 26, 27, 31, 32, 35, 39, 40, 43, 48, 49, 53, 54, 55, 58, 61, 62, 64, 65, 68, 69, 71, 72, 74, 78, 82, 84, 86, 89, 90, 94, 95, 99, 100, 104, 105, 108, 114, 118, 120, 127, 128, 131, 132, 133, 135, 136, 140, 142, 145, 147, 148, 149, 152, 157, 161, 163, 165, 172, 176, 180, 182, 187, 190, 193, 195, 196, 199, 202, 205, 206, 209, 212, 214, 216, 218, 221, 223, 224, 225, 227, 229, 230, 233, 236, 237, 239, 242, 243, 245, 250, 251, 257, 261, 263, 264, 265, 267, 268, 269, 270, 274, 275, 279, 281, 286, 295, 296, 298, 299, 305, 308, 309, 312, 317, 318, 323, 324, 325, 326, 329, 335, 336, 339, 340, 342, 343, 346, 351, 352, 357, 361, 363, 364, 365, 367, 368, 369, 371, 372, 374, 377, 379, 381, 382, 383, 384, 386, 389, 391, 392, 393, 394, 400, 403, 407, 408, 409, 410, 413, 414, 417, 418, 420, 421, 423, 424, 430, 431, 435, 444, 446, 447, 453, 454, 456, 457, 459, 460, 461, 469, 471, 476, 478, 479, 480, 481, 485, 486, 487, 489, 490, 493, 496, 497, 498, 501, 503, 504, 505, 510, 511, 512, 513, 515, 516, 518, 522, 524, 525, 527, 529, 531, 532, 534, 535, 541, 542, 543, 545, 551, 555, 556, 557, 564, 565, 566, 567, 568, 569, 572, 575, 578, 583, 586, 590, 593, 595, 596, 600, 601, 602, 603, 605, 610, 612, 613, 614, 615, 618, 620, 621, 623, 626, 632, 634, 635, 638, 639
        ];
    }

    async initialize() {
        try {
            const response = await fetch('data/games_index.json');
            if (!response.ok) throw new Error('Failed to load games index');
            
            this.gamesIndex = await response.json();
            return true;
        } catch (error) {
            console.error('Failed to initialize data loader:', error);
            
            if (window.location.protocol === 'file:') {
                alert('Cannot load from file:// protocol\n\nRun a local server:\npython3 -m http.server 8000\n\nThen visit: http://localhost:8000');
            }
            
            return false;
        }
    }

    async loadGame(gameNumber) {
        if (!this.gamesIndex) {
            throw new Error('Data loader not initialized');
        }

        if (gameNumber < 0 || gameNumber >= this.gamesIndex.total_games) {
            throw new Error(`Invalid game number: ${gameNumber}`);
        }

        if (this.gameCache.has(gameNumber)) {
            return this.gameCache.get(gameNumber);
        }

        const gameInfo = this.gamesIndex.games[gameNumber];
        const response = await fetch(`data/${gameInfo.filename}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load game ${gameNumber}`);
        }

        const gameData = await response.json();
        
        if (!gameData.words || !gameData.adjacency_matrix || 
            gameData.words.length !== 16 || gameData.adjacency_matrix.length !== 16) {
            throw new Error(`Invalid game data for game ${gameNumber}`);
        }

        this.gameCache.set(gameNumber, gameData);
        return gameData;
    }

    getRandomGameNumber() {
        const index = Math.floor(Math.random() * this.availableGames.length);
        return this.availableGames[index];
    }
}

let app;

function loadRandomGame() {
    app.loadRandomGame();
}

function submitGuess() {
    app.submitGuess();
}

function clearSelection() {
    app.clearSelection();
}

window.loadRandomGame = loadRandomGame;
window.submitGuess = submitGuess;
window.clearSelection = clearSelection;

document.addEventListener('DOMContentLoaded', async () => {
    app = new WebApp();
    
    const success = await app.data.initialize();
    if (!success) {
        document.getElementById('wordGrid').innerHTML = 
            '<div class="loading">Error: Failed to load game data</div>';
        return;
    }
    
    await app.loadGlobalStats();
});
