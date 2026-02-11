import React from 'react';

const GameControls = ({ onSubmit, onClear, canSubmit }) => {
  return (
    <div className="flex items-center justify-center gap-3 mt-4 mb-2">
      <button
        onClick={onClear}
        className="rounded-full border border-black text-black bg-white
                   hover:bg-black hover:text-white
                   px-6 py-2 text-sm font-semibold transition-colors"
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
    </div>
  );
};

export default GameControls;
