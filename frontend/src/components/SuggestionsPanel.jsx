import React from 'react';

const SuggestionsPanel = ({ suggestions, onSuggestionClick, isLoading }) => {
  return (
    <div className="bg-[#2e3532] border-l-2 border-white pl-4 h-full">
      <h3 className="text-sm font-bold mb-4 text-white tracking-wider">AI Suggestions</h3>
      
      {isLoading ? (
        <div className="text-sm text-white animate-pulse">Thinking...</div>
      ) : (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-sm opacity-40 italic text-white">Load a game to see suggestions</div>
          ) : (
            suggestions.map((suggestion, idx) => (
              <div 
                key={idx}
                onClick={() => onSuggestionClick(suggestion.words)}
                className="cursor-pointer border border-transparent hover:bg-white hover:text-black p-2 rounded transition-colors group"
              >
                <div className="flex justify-between text-xs mb-1 text-white group-hover:text-black">
                  <span className="font-bold">#{idx + 1}</span>
                  <span>{suggestion.score.toFixed(3)}</span>
                </div>
                <div className="text-sm leading-snug text-white group-hover:text-black">
                  {suggestion.word_texts.join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
