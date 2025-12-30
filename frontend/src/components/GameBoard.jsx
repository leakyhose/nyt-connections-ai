import React from 'react';

const GameBoard = ({ words, selectedIndices, onWordClick, solvedIndices }) => {
  if (!words || words.length === 0) {
    return <div className="py-12 text-center text-xl font-bold text-white">No game loaded</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {words.map((word, index) => {
        const isSelected = selectedIndices.includes(index);
        const isSolved = solvedIndices.includes(index);
        
        if (isSolved) return null;

        return (
          <button
            key={index}
            onClick={() => onWordClick(index)}
            className={`
              h-20 flex items-center justify-center p-2 text-lg font-bold rounded shadow-md transition-all border
              ${isSelected 
                ? 'bg-[#f4a259] text-white border-[#f4a259] transform scale-105' 
                : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}
            `}
          >
            {word}
          </button>
        );
      })}
    </div>
  );
};

export default GameBoard;
