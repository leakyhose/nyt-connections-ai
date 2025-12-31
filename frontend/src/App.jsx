import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import SuggestionsPanel from './components/SuggestionsPanel';
import GameControls from './components/GameControls';

function App() {
  const [gameData, setGameData] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [solvedIndices, setSolvedIndices] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [turns, setTurns] = useState(0);
  const [message, setMessage] = useState(null);
  const [badGuesses, setBadGuesses] = useState([]);

  const fetchRandomGame = async () => {
    try {
      const res = await fetch('/api/games/random');
      const data = await res.json();
      setGameData(data);
      resetGameState();
    } catch (err) {
      console.error("Failed to load game", err);
    }
  };

  const resetGameState = () => {
    setSelectedIndices([]);
    setSolvedIndices([]);
    setSuggestions([]);
    setTurns(0);
    setBadGuesses([]);
    setMessage(null);
  };

  const handleWordClick = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else if (selectedIndices.length < 4) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleClear = () => {
    setSelectedIndices([]);
  };

  const handleSubmit = async () => {
    if (selectedIndices.length !== 4) return;

    setTurns(prev => prev + 1);
    
    try {
      const res = await fetch(`/api/games/${gameData.game_number}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guess_indices: selectedIndices,
          seed: gameData.seed
        })
      });
      const result = await res.json();

      if (result.result === 1) {
        // Correct
        const newSolved = [...solvedIndices, ...selectedIndices];
        setSolvedIndices(newSolved);
        setSelectedIndices([]);
        setMessage({ text: "CORRECT", type: "success" });
        // Refresh suggestions
        fetchSuggestions(newSolved, badGuesses);
      } else {
        // One away or Incorrect
        const newBadGuesses = [...badGuesses, selectedIndices];
        setBadGuesses(newBadGuesses);
        
        if (result.result === 0) {
          setMessage({ text: "ONE AWAY", type: "warning" });
        } else {
          setMessage({ text: "INCORRECT", type: "error" });
        }
        setSelectedIndices([]);
        
        // Refresh suggestions with new bad guess
        fetchSuggestions(solvedIndices, newBadGuesses);
      }

    } catch (err) {
      console.error("Error checking guess", err);
    }
  };

  const fetchSuggestions = async (currentSolved = solvedIndices, currentBadGuesses = badGuesses) => {
    if (!gameData) return;
    
    setIsLoadingSuggestions(true);
    const availableIndices = gameData.words.map((_, i) => i).filter(i => !currentSolved.includes(i));
    
    try {
      const res = await fetch(`/api/games/${gameData.game_number}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          available_indices: availableIndices,
          seed: gameData.seed,
          bad_guesses: currentBadGuesses
        })
      });
      const data = await res.json();
      
      // Map indices to words for display
      const suggestionsWithWords = data.map(s => ({
        ...s,
        word_texts: s.words.map(idx => gameData.words[idx])
      }));
      
      setSuggestions(suggestionsWithWords);
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Fetch suggestions when game loads or solved words change
  useEffect(() => {
    if (gameData) {
      fetchSuggestions();
    }
  }, [gameData, solvedIndices]);

  return (
    <div className="min-h-screen p-4 pt-8 md:p-8 md:pt-12">
      <div className="max-w-7xl w-full mx-auto relative">
        <header className="mb-6 md:mb-4 text-center border-b border-white pb-4 md:pb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">NYT Connections <span className="text-[#f4a259]">AI</span></h1>
          <a className="text-sm underline" href="https://github.com/leakyhose" target="_blank">By: Yiming Su</a>
        </header>

        <div className="flex flex-col md:flex-row gap-16 items-start justify-center">
          <div className="flex-1 w-full max-w-2xl">
            <GameControls 
              gameId={gameData?.game_number}
              onRandomGame={fetchRandomGame}
              onSubmit={handleSubmit}
              onClear={handleClear}
              canSubmit={selectedIndices.length === 4}
              turns={turns}
            />

            <GameBoard 
              words={gameData?.words}
              selectedIndices={selectedIndices}
              solvedIndices={solvedIndices}
              onWordClick={handleWordClick}
            />

            {message && (
              <div className={`
                mt-6 py-3 text-center text-sm font-bold rounded border
                ${message.type === 'success' ? 'border-[#8cb369] text-[#8cb369]' : ''}
                ${message.type === 'warning' ? 'border-[#f4a259] text-[#f4a259]' : ''}
                ${message.type === 'error' ? 'border-[#bc4b51] text-[#bc4b51]' : ''}
              `}>
                {message.text}
              </div>
            )}
          </div>

          <div className="w-full md:w-72">
            <SuggestionsPanel 
              suggestions={suggestions}
              onSuggestionClick={(indices) => {
                setSelectedIndices(indices);
              }}
              isLoading={isLoadingSuggestions}
            />
          </div>
        </div>

        <footer className="mt-12 pb-8 text-center">
          <a 
            href="https://github.com/leakyhose" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white hover:text-[#f4a259] transition-colors"
          >
            <span>Check out the github:</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
