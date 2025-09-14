/**
 * Connections Game - Main JavaScript Interface
 */

class ConnectionsGame {
    constructor() {
        this.gameLogic = new GameLogic();
        this.currentGame = null;
        this.words = [];
        this.adjacencyMatrix = [];
        this.availableIndices = [];
        this.selectedWords = [];
        this.foundGroups = 0;
        this.turns = 0;
        this.weights = [0.7441864013671875, 0.06005859375];
        this.triedSuggestions = new Set(); // Track tried suggestions to remove them
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Word card selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-card') && !e.target.classList.contains('found')) {
                this.toggleWordSelection(e.target);
            }
        });

        // Suggestion clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.suggestion-item')) {
                this.selectSuggestion(e.target.closest('.suggestion-item'));
            }
        });
    }

    async loadGame(gameNumber = 1) {
        try {
            console.log(`Loading game ${gameNumber}`);
            
            // Trigger intro animation if in intro mode
            this.exitIntroMode();
            
            // Show loading state
            document.getElementById('wordGrid').innerHTML = '<div class="loading">Loading game...</div>';
            document.getElementById('suggestionsList').innerHTML = '<div class="loading">Loading suggestions...</div>';
            
            // Load game data using the client-side data loader
            const gameData = await window.gameDataLoader.loadGame(gameNumber);
            this.words = gameData.words;
            this.adjacencyMatrix = gameData.adjacency_matrix;
            
            // Reset game state
            this.currentGame = gameNumber;
            this.availableIndices = Array.from({length: 16}, (_, i) => i);
            this.selectedWords = [];
            this.foundGroups = 0;
            this.turns = 0;
            this.triedSuggestions = new Set(); // Reset tried suggestions
            
            // Update UI
            this.updateDisplay();
            this.generateSuggestionsWithThinking();
            this.updateCounters();
            this.resetGroupIndicators();
            
            console.log('Game loaded');
            
        } catch (error) {
            console.error('Error loading game:', error);
            document.getElementById('wordGrid').innerHTML = `<div class="loading">Error loading game: ${error.message}</div>`;
            document.getElementById('suggestionsList').innerHTML = `<div class="loading">Failed to load</div>`;
        }
    }

    newRandomGame() {
        const totalGames = window.gameDataLoader.getTotalGames();
        const randomGame = window.gameDataLoader.getRandomGameNumber();
        document.getElementById('gameNumber').value = randomGame;
        this.loadGame(randomGame);
    }

    exitIntroMode() {
        const gameInfo = document.getElementById('gameInfo');
        const mainContent = document.getElementById('mainContent');
        
        if (gameInfo.classList.contains('intro-mode')) {
            gameInfo.classList.remove('intro-mode');
            setTimeout(() => {
                mainContent.classList.remove('hidden');
            }, 200);
        }
    }

    updateDisplay() {
        const grid = document.getElementById('wordGrid');
        grid.innerHTML = '';
        
        // Shuffle available words for display
        const availableWords = this.availableIndices.map(i => ({index: i, word: this.words[i]}));
        this.shuffleArray(availableWords);
        
        availableWords.forEach(item => {
            const wordCard = document.createElement('div');
            wordCard.className = 'word-card';
            wordCard.dataset.index = item.index;
            wordCard.textContent = item.word;
            
            if (this.selectedWords.includes(item.index)) {
                wordCard.classList.add('selected');
            }
            
            grid.appendChild(wordCard);
        });
    }

    toggleWordSelection(wordCard) {
        const index = parseInt(wordCard.dataset.index);
        
        if (this.selectedWords.includes(index)) {
            // Deselect
            this.selectedWords = this.selectedWords.filter(i => i !== index);
            wordCard.classList.remove('selected');
        } else if (this.selectedWords.length < 4) {
            // Select
            this.selectedWords.push(index);
            wordCard.classList.add('selected');
        }
        
        this.updateSubmitButton();
    }

    updateSubmitButton() {
        const submitBtn = document.getElementById('submitBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (this.selectedWords.length === 4) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Guess';
            submitBtn.style.background = '#4CAF50';
        } else {
            submitBtn.disabled = true;
            submitBtn.textContent = `Submit Guess (Select ${4 - this.selectedWords.length} more)`;
            submitBtn.style.background = '#666';
        }
        
        clearBtn.style.display = this.selectedWords.length > 0 ? 'inline-block' : 'none';
    }

    clearSelection() {
        this.selectedWords = [];
        document.querySelectorAll('.word-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        this.updateSubmitButton();
    }

    async submitGuess() {
        if (this.selectedWords.length !== 4) return;
        
        // Add the current guess to tried suggestions if it's wrong
        const guessKey = [...this.selectedWords].sort().join(',');
        
        this.turns++;
        const result = this.gameLogic.check(this.selectedWords);
        
        this.showResult(result, this.selectedWords);
        
        if (result === 1) {
            // Correct guess - will trigger list reset
            this.handleCorrectGuess();
        } else if (result === 0) {
            // One away - might trigger list reset
            this.triedSuggestions.add(guessKey);
            this.removeTriedSuggestionWithAnimation(guessKey);
            this.clearSelection(); // Clear selection after one away
            this.handleOneAway();
        } else {
            // Incorrect - just remove this suggestion, no reset
            this.triedSuggestions.add(guessKey);
            this.removeTriedSuggestionWithAnimation(guessKey);
            this.clearSelection();
        }
        
        this.updateCounters();
    }

    handleCorrectGuess() {
        // Remove correct words from available indices immediately
        this.availableIndices = this.availableIndices.filter(i => !this.selectedWords.includes(i));
        
        // Update adjacency matrix
        this.adjacencyMatrix = this.gameLogic.purge(this.adjacencyMatrix, this.selectedWords);
        
        // Update game state
        this.foundGroups++;
        this.selectedWords = [];
        
        // Update display to show remaining words only
        this.updateDisplay();
        
        // Update UI
        this.updateGroupIndicator(this.foundGroups);
        this.updateSubmitButton();
        
        if (this.foundGroups === 4) {
            this.handleGameComplete();
        } else {
            // LIST RESET - show thinking and regenerate suggestions
            this.generateSuggestionsWithThinking();
        }
    }

    handleOneAway() {
        // Generate suggestions for completing the group
        const trios = this.gameLogic.linkPriorityQueue(this.selectedWords, this.adjacencyMatrix, this.weights);
        
        if (trios.length > 0) {
            const bestTrio = trios[0].words;
            const childSuggestions = this.gameLogic.childPriorityQueue(bestTrio, this.adjacencyMatrix, this.availableIndices, this.weights);
            
            if (childSuggestions.length > 0) {
                this.displayChildSuggestions(childSuggestions);
                return;
            }
        }
        
        // If no valid child suggestions, reset the list with thinking
        this.generateSuggestionsWithThinking();
    }

    displayChildSuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '<div class="suggestions-title">Suggestions</div>';
        
        // Filter out tried suggestions for child suggestions too
        const filteredSuggestions = suggestions.filter(suggestion => {
            const suggestionKey = [...suggestion.words].sort().join(',');
            return !this.triedSuggestions.has(suggestionKey);
        });
        
        if (filteredSuggestions.length === 0) {
            const noSuggestions = document.createElement('div');
            noSuggestions.className = 'loading';
            noSuggestions.textContent = 'No more completion suggestions available';
            suggestionsList.appendChild(noSuggestions);
            return;
        }
        
        filteredSuggestions.slice(0, 5).forEach((suggestion, index) => {
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

    handleGameComplete() {
        setTimeout(() => {
            const mistakes = this.turns - 4;
            this.showCompletionMessage(this.turns, mistakes);
        }, 2000);
    }

    returnToIntroState() {
        const gameInfo = document.getElementById('gameInfo');
        const mainContent = document.getElementById('mainContent');
        
        // Hide main content first
        mainContent.classList.add('hidden');
        
        // After main content is hidden, return to intro mode
        setTimeout(() => {
            gameInfo.classList.add('intro-mode');
            
            // Reset game state
            this.currentGame = null;
            this.words = [];
            this.selectedWords = [];
            this.foundGroups = 0;
            this.turns = 0;
            this.triedSuggestions.clear();
            
            // Update counters
            document.getElementById('turnsCounter').textContent = 'Turns: 0';
            document.getElementById('groupsCounter').textContent = 'Groups: 0/4';
            
            // Clear game area
            document.getElementById('wordGrid').innerHTML = '';
            document.getElementById('suggestionsList').innerHTML = '<div class="suggestions-title">Suggestions</div><div class="loading">Load a game to see suggestions!</div>';
            
        }, 300);
    }

    showCompletionMessage(totalTurns, mistakes) {
        // Show overlay for completion message too
        this.showPopupOverlay();
        
        const message = document.createElement('div');
        message.className = 'result-message result-completion';
        
        let performanceText = '';
        if (mistakes === 0) {
            performanceText = 'Perfect Game!';
        } else if (mistakes <= 2) {
            performanceText = 'Great Job!';
        } else if (mistakes <= 4) {
            performanceText = 'Good Work!';
        } else {
            performanceText = 'Game Complete!';
        }
        
        message.innerHTML = `
            <div style="font-size: 1.2em; margin-bottom: 10px;">${performanceText}</div>
            <div>Total turns: ${totalTurns}</div>
            <div>Mistakes: ${mistakes}</div>
        `;
        
        document.body.appendChild(message);
        
        // Remove the message and overlay after animation completes
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
            this.hidePopupOverlay();
            // Return to intro state immediately when popup disappears
            this.returnToIntroState();
        }, 1250); // Match the CSS animation duration
    }

    showPopupOverlay() {
        const overlay = document.getElementById('popupOverlay');
        overlay.classList.add('active');
    }

    hidePopupOverlay() {
        const overlay = document.getElementById('popupOverlay');
        overlay.classList.remove('active');
    }

    selectSuggestion(suggestionElement) {
        const words = JSON.parse(suggestionElement.dataset.words);
        
        // Clear current selection
        this.clearSelection();
        
        // Select the suggested words
        this.selectedWords = [...words];
        
        // Update UI to show selection
        words.forEach(index => {
            const wordCard = document.querySelector(`[data-index="${index}"]`);
            if (wordCard) {
                wordCard.classList.add('selected');
            }
        });
        
        this.updateSubmitButton();
    }

    generateSuggestionsWithThinking() {
        if (this.availableIndices.length === 0) return;
        
        // Show thinking indicator and dim screen
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '<div class="suggestions-title">Thinking...</div><div class="loading">Finding connections...</div>';
        
        // Dim screen while AI is thinking
        this.showPopupOverlay();
        
        // Random timing: thinking can finish before or after undimming
        const baseThinkingDelay = Math.random() * 700 + 800; // 800-1500ms base
        const undimDelay = Math.random() * 400 + 800; // 800-1200ms for undimming (longer)
        
        // Sometimes thinking finishes first, sometimes undimming happens first
        const thinkingDelay = Math.random() < 0.5 ? 
            Math.min(baseThinkingDelay, undimDelay - 50) : // Thinking finishes 50ms before undim
            Math.max(baseThinkingDelay, undimDelay + 50);  // Thinking finishes 50ms after undim
        
        setTimeout(() => {
            this.generateSuggestions();
        }, thinkingDelay);
        
        // Remove dimming with separate timing
        setTimeout(() => {
            this.hidePopupOverlay();
        }, undimDelay);
    }

    generateSuggestions() {
        if (this.availableIndices.length === 0) return;
        
        const suggestions = this.gameLogic.genPriorityQueue(
            this.adjacencyMatrix, 
            this.availableIndices, 
            this.weights
        );
        
        // Filter out tried suggestions
        const filteredSuggestions = suggestions.filter(suggestion => {
            const suggestionKey = [...suggestion.words].sort().join(',');
            return !this.triedSuggestions.has(suggestionKey);
        });
        
        this.displaySuggestions(filteredSuggestions.slice(0, 10));
    }

    displaySuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '<div class="suggestions-title">Suggestions</div>';
        
        if (suggestions.length === 0) {
            const noSuggestions = document.createElement('div');
            noSuggestions.className = 'loading';
            noSuggestions.textContent = 'No more suggestions available';
            suggestionsList.appendChild(noSuggestions);
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

    showResult(result, words) {
        // Show overlay and dim background
        this.showPopupOverlay();
        
        const message = document.createElement('div');
        message.className = 'result-message';
        
        if (result === 1) {
            message.className += ' result-correct';
            message.textContent = 'CORRECT';
        } else if (result === 0) {
            message.className += ' result-one-away';
            message.textContent = 'ONE AWAY';
        } else {
            message.className += ' result-incorrect';
            message.textContent = 'INCORRECT';
        }
        
        document.body.appendChild(message);
        
        // Remove the message and overlay after animation completes
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
            this.hidePopupOverlay();
        }, 1250);
    }

    removeTriedSuggestionWithAnimation(suggestionKey) {
        // Find the suggestion item to remove
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        
        suggestionItems.forEach(item => {
            const words = JSON.parse(item.dataset.words);
            const itemKey = [...words].sort().join(',');
            
            if (itemKey === suggestionKey) {
                // Add removing class to trigger animation
                item.classList.add('removing');
                
                // Remove the element after animation completes (150ms + small buffer)
                setTimeout(() => {
                    if (item.parentNode) {
                        item.parentNode.removeChild(item);
                    }
                }, 200);
            }
        });
    }

    updateCounters() {
        document.getElementById('turnsCounter').textContent = `Turns: ${this.turns}`;
        document.getElementById('groupsCounter').textContent = `Groups: ${this.foundGroups}/4`;
    }

    updateGroupIndicator(groupNumber) {
        const indicator = document.getElementById(`group${groupNumber}`);
        if (indicator) {
            indicator.classList.add('found');
        }
    }

    resetGroupIndicators() {
        for (let i = 1; i <= 4; i++) {
            const indicator = document.getElementById(`group${i}`);
            if (indicator) {
                indicator.classList.remove('found');
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Global functions for HTML onclick handlers
let game;

function loadRandomGame() {
    game.newRandomGame();
}

function newRandomGame() {
    game.newRandomGame();
}

function submitGuess() {
    game.submitGuess();
}

function clearSelection() {
    game.clearSelection();
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the game data loader first
    const success = await window.gameDataLoader.initialize();
    if (!success) {
        console.error('Failed to initialize game data loader');
        document.getElementById('wordGrid').innerHTML = '<div class="loading">Error: Failed to load game data</div>';
        return;
    }
    
    game = new ConnectionsGame();
    console.log('Game ready');
    
    // Check if this is the first visit and show info modal
    checkFirstVisit();
});

// Info Modal Functions
function showInfoModal() {
    console.log('showInfoModal called');
    alert('Button clicked!'); // Temporary test
    const modal = document.getElementById('infoModal');
    console.log('Modal element:', modal);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('Modal should now be visible');
    } else {
        console.error('Modal element not found!');
    }
}

function hideInfoModal() {
    console.log('hideInfoModal called');
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Mark that user has seen the info
        localStorage.setItem('connectionsai-info-seen', 'true');
    }
}

function checkFirstVisit() {
    const hasSeenInfo = localStorage.getItem('connectionsai-info-seen');
    if (!hasSeenInfo) {
        // Show info modal after a short delay to let the page load
        setTimeout(() => {
            showInfoModal();
        }, 500);
    }
}

// Close modal when clicking outside of it
document.addEventListener('click', (e) => {
    const modal = document.getElementById('infoModal');
    const modalContent = modal.querySelector('.info-modal-content');
    
    if (modal.classList.contains('show') && !modalContent.contains(e.target)) {
        hideInfoModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('infoModal');
        if (modal.classList.contains('show')) {
            hideInfoModal();
        }
    }
});