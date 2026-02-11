import React, { useState, useEffect, useRef } from 'react';
import GameBoard from './components/GameBoard';
import SuggestionsPanel from './components/SuggestionsPanel';
import GameControls from './components/GameControls';
import SolvedGroups from './components/SolvedGroups';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [gameData, setGameData] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [solvedIndices, setSolvedIndices] = useState([]);
  const [solvedGroups, setSolvedGroups] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [turns, setTurns] = useState(0);
  const [statusText, setStatusText] = useState(null);
  const [badGuesses, setBadGuesses] = useState([]);
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [shakingIndices, setShakingIndices] = useState([]);
  const [jumpingIndices, setJumpingIndices] = useState([]);
  const [reorderToFront, setReorderToFront] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(false);
  const handleSubmitRef = useRef(null);
  const statusTimerRef = useRef(null);

  const fetchRandomGame = async () => {
    try {
      setIsLoadingGame(true);
      const res = await fetch(`${API_BASE_URL}/api/games/random`);
      const data = await res.json();
      setGameData(data);
      resetGameState();
    } catch (err) {
      console.error("Failed to load game", err);
    } finally {
      setIsLoadingGame(false);
    }
  };

  const resetGameState = () => {
    setSelectedIndices([]);
    setSolvedIndices([]);
    setSolvedGroups([]);
    setSuggestions([]);
    setTurns(0);
    setBadGuesses([]);
    setStatusText(null);
    setShakingIndices([]);
    setJumpingIndices([]);
    setReorderToFront(null);
    setIsSubmitting(false);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
  };

  const showStatus = (text) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusText(text);
    statusTimerRef.current = setTimeout(() => {
      setStatusText(null);
    }, 1500);
  };

  const handleWordClick = (index) => {
    if (isSubmitting || isAutoPlaying) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else if (selectedIndices.length < 4) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleClear = () => {
    if (isSubmitting || isAutoPlaying) return;
    setSelectedIndices([]);
  };

  const handleSubmit = async (overrideIndices) => {
    const indices = Array.isArray(overrideIndices) ? overrideIndices : selectedIndices;
    if (indices.length !== 4 || isSubmitting) return;

    setSelectedIndices(indices);
    setIsSubmitting(true);
    setTurns(prev => prev + 1);

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${gameData.game_number}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guess_indices: indices,
          seed: gameData.seed
        })
      });
      const result = await res.json();

      if (result.result === 1) {
        const guessed = [...indices];
        showStatus('CORRECT!');

        // Phase 1: Sequential subtle jumps (staggered 120ms, 300ms each)
        setJumpingIndices(guessed);

        // Phase 2: Reorder tiles — selected move to first row via FLIP
        setTimeout(() => {
          setJumpingIndices([]);
          setReorderToFront(guessed);
        }, 840);

        // Phase 3: Replace top row with colored banner
        setTimeout(() => {
          setReorderToFront(null);

          const groupWords = guessed.map(i => gameData.words[i]);
          setSolvedGroups(prev => [...prev, {
            group: result.group ?? 0,
            indices: guessed,
            words: groupWords,
          }]);

          const newSolved = [...solvedIndices, ...guessed];
          setSolvedIndices(newSolved);
          setSelectedIndices([]);
          setIsSubmitting(false);
          fetchSuggestions(newSolved, badGuesses);
        }, 1490);

      } else {
        const guessedIndices = [...indices];
        setShakingIndices(guessedIndices);

        if (result.result === 0) {
          showStatus('ONE AWAY!');
        } else {
          showStatus('INCORRECT');
        }

        const newBadGuesses = [...badGuesses, indices];
        setBadGuesses(newBadGuesses);

        setTimeout(() => {
          setShakingIndices([]);
          setSelectedIndices([]);
          setIsSubmitting(false);
        }, 500);

        fetchSuggestions(solvedIndices, newBadGuesses);
      }

    } catch (err) {
      console.error("Error checking guess", err);
      setIsSubmitting(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  const fetchSuggestions = async (currentSolved = solvedIndices, currentBadGuesses = badGuesses) => {
    if (!gameData) return;

    setIsLoadingSuggestions(true);
    const availableIndices = gameData.words.map((_, i) => i).filter(i => !currentSolved.includes(i));

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${gameData.game_number}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          available_indices: availableIndices,
          seed: gameData.seed,
          bad_guesses: currentBadGuesses
        })
      });
      const data = await res.json();

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

  // Load a game on mount
  useEffect(() => {
    fetchRandomGame();
  }, []);

  const toggleAutoPlay = () => {
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      setIsAutoPlaying(false);
    } else {
      autoPlayRef.current = true;
      setIsAutoPlaying(true);
    }
  };

  useEffect(() => {
    if (!autoPlayRef.current) return;
    if (isSubmitting || isLoadingGame || isLoadingSuggestions) return;

    // No game loaded — start one
    if (!gameData) {
      const t = setTimeout(() => {
        if (autoPlayRef.current) fetchRandomGame();
      }, 300);
      return () => clearTimeout(t);
    }

    // Game complete — start new game
    if (solvedGroups.length === 4) {
      const t = setTimeout(() => {
        if (autoPlayRef.current) fetchRandomGame();
      }, 800);
      return () => clearTimeout(t);
    }

    // Have suggestions — select top guess then submit
    if (suggestions.length > 0) {
      const topGuess = suggestions[0].words;
      const t = setTimeout(() => {
        if (!autoPlayRef.current) return;
        setSelectedIndices(topGuess);
        setTimeout(() => {
          if (!autoPlayRef.current) return;
          handleSubmitRef.current(topGuess);
        }, 250);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isAutoPlaying, isSubmitting, isLoadingGame, isLoadingSuggestions, solvedGroups.length, suggestions, gameData]);

  useEffect(() => {
    if (gameData) {
      fetchSuggestions();
    }
  }, [gameData, solvedIndices]);

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-game w-full mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-1 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Connections <span className="font-extrabold">AI</span>
            </h1>
            {gameData && (
              <p className="text-xs text-gray-500 mt-0.5">
                Puzzle #{gameData.game_number} &middot; Turns: {turns}
              </p>
            )}
          </div>
          <button
            onClick={fetchRandomGame}
            disabled={isAutoPlaying}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors
              ${isAutoPlaying
                ? 'border-gray-300 text-gray-300 bg-white cursor-not-allowed'
                : 'border-black text-black bg-white hover:bg-black hover:text-white'}`}
          >
            New Game
          </button>
        </header>

        {/* Status / Instruction line */}
        <div className={`text-center text-sm mt-4 mb-4 font-semibold transition-colors duration-200 ${
          statusText ? 'text-black' : 'text-gray-400'
        }`}>
          {statusText || (
            <span className="inline-flex items-center gap-1.5">
              By: Yiming Su
              <a href="https://github.com/leakyhose" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/yiming-su-b0115418b/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </span>
          )}
        </div>

        {/* Solved Groups */}
        <SolvedGroups solvedGroups={solvedGroups} />

        {/* Game Board */}
        <GameBoard
          words={gameData?.words}
          selectedIndices={selectedIndices}
          solvedIndices={solvedIndices}
          onWordClick={handleWordClick}
          isLoading={isLoadingGame}
          shakingIndices={shakingIndices}
          jumpingIndices={jumpingIndices}
          reorderToFront={reorderToFront}
        />

        {/* Controls */}
        <GameControls
          onSubmit={handleSubmit}
          onClear={handleClear}
          canSubmit={selectedIndices.length === 4 && !isSubmitting && !isAutoPlaying}
          isAutoPlaying={isAutoPlaying}
          onToggleAutoPlay={toggleAutoPlay}
        />

        {/* AI Suggestions */}
        <SuggestionsPanel
          suggestions={suggestions}
          selectedIndices={selectedIndices}
          onSuggestionClick={(indices) => {
            if (!isSubmitting && !isAutoPlaying) setSelectedIndices(indices);
          }}
          isLoading={isLoadingSuggestions}
        />
      </div>
    </div>
  );
}

export default App;
