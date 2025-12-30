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
        setSolvedIndices([...solvedIndices, ...selectedIndices]);
        setSelectedIndices([]);
        setMessage({ text: "CORRECT", type: "success" });
        // Refresh suggestions
        fetchSuggestions([...solvedIndices, ...selectedIndices]);
      } else if (result.result === 0) {
        // One away
        setMessage({ text: "ONE AWAY", type: "warning" });
      } else {
        // Incorrect
        setMessage({ text: "INCORRECT", type: "error" });
        setSelectedIndices([]);
      }

      setTimeout(() => setMessage(null), 2000);

    } catch (err) {
      console.error("Error checking guess", err);
    }
  };

  const fetchSuggestions = async (currentSolved = solvedIndices) => {
    if (!gameData) return;
    
    setIsLoadingSuggestions(true);
    const availableIndices = gameData.words.map((_, i) => i).filter(i => !currentSolved.includes(i));
    
    try {
      const res = await fetch(`/api/games/${gameData.game_number}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          available_indices: availableIndices,
          seed: gameData.seed
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
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center border-b border-white pb-6">
          <h1 className="text-4xl font-bold text-white">NYT Connections AI</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 w-full max-w-2xl">
            <GameControls 
              gameId={gameData?.game_number}
              onRandomGame={fetchRandomGame}
              onSubmit={handleSubmit}
              onClear={handleClear}
              canSubmit={selectedIndices.length === 4}
              turns={turns}
            />

            {message && (
              <div className={`
                mb-4 py-3 text-center text-sm font-bold rounded border border-white text-white
              `}>
                {message.text}
              </div>
            )}

            <GameBoard 
              words={gameData?.words}
              selectedIndices={selectedIndices}
              solvedIndices={solvedIndices}
              onWordClick={handleWordClick}
            />
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
      </div>
    </div>
  );
}

export default App;
