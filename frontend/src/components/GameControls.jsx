import React from 'react';

const GameControls = ({ onSubmit, onClear, canSubmit, isAutoPlaying, onToggleAutoPlay }) => {
  return (
    <div className="flex items-center justify-center gap-3 mt-4 mb-2">
      <button
        onClick={onClear}
        disabled={isAutoPlaying}
        className={`
          rounded-full border px-6 py-2 text-sm font-semibold transition-colors
          ${isAutoPlaying
            ? 'border-gray-300 text-gray-300 bg-white cursor-not-allowed'
            : 'border-black text-black bg-white hover:bg-black hover:text-white'}
        `}
      >
        Deselect All
      </button>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`
          rounded-full border px-6 py-2 text-sm font-semibold transition-colors
          ${canSubmit
            ? 'border-black text-black bg-white hover:bg-black hover:text-white'
            : 'border-gray-300 text-gray-300 bg-white cursor-not-allowed'}
        `}
      >
        Submit
      </button>
      <button
        onClick={onToggleAutoPlay}
        className={`
          rounded-full border px-6 py-2 text-sm font-semibold transition-colors
          ${isAutoPlaying
            ? 'border-red-400 text-red-500 bg-white hover:bg-red-500 hover:text-white'
            : 'border-green-400 text-green-500 bg-white hover:bg-green-500 hover:text-white'}
        `}
      >
        {isAutoPlaying ? 'Stop' : 'Auto Play'}
      </button>
    </div>
  );
};

export default GameControls;
