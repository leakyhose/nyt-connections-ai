import React from 'react';

const GameBoard = ({ words, selectedIndices, onWordClick, solvedIndices }) => {
  const heightClasses = "min-h-[22.25rem] md:min-h-[30.25rem]";
  const boardClasses = `grid grid-cols-4 gap-3 mb-6 ${heightClasses} content-start`;

  if (!words || words.length === 0) {
    return (
      <div className={`flex items-center justify-center mb-6 ${heightClasses}`}>
        <div className="text-xl font-bold text-white">No game loaded</div>
      </div>
    );
  }

  return (
    <div className={boardClasses}>
      {words.map((word, index) => {
        const isSelected = selectedIndices.includes(index);
        const isSolved = solvedIndices.includes(index);
        
        if (isSolved) return null;

        return (
          <button
            key={index}
            onClick={() => onWordClick(index)}
            className={`
              h-20 md:h-28 flex items-center justify-center p-1 text-xs sm:text-sm md:text-lg font-bold rounded shadow-md transition-all border break-words leading-tight
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
