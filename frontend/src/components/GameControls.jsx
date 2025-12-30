import React from 'react';

const GameControls = ({ gameId, onRandomGame, onSubmit, onClear, canSubmit, turns }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex gap-6 text-base font-bold text-white">
        <div>Game: <span className="text-white">{gameId || '---'}</span></div>
        <div>Turns: <span className="text-white">{turns}</span></div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onRandomGame}
          className="border border-white text-white hover:bg-[#5b8e7d] hover:border-[#5b8e7d] hover:text-white px-4 py-2 text-sm font-bold transition-all"
        >
          New Game
        </button>
        <button
          onClick={onClear}
          className="border border-white text-white hover:bg-[#bc4b51] hover:border-[#bc4b51] hover:text-white px-4 py-2 text-sm font-bold transition-all"
        >
          Clear
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`
            px-4 py-2 text-sm font-bold transition-all border
            ${canSubmit 
              ? 'border-white text-white hover:bg-[#f4a259] hover:border-[#f4a259] hover:text-white' 
              : 'border-gray-600 text-gray-600 cursor-not-allowed'}
          `}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default GameControls;
