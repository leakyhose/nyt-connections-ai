import React, { useState } from 'react';

const arraysMatch = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
};

const SuggestionsPanel = ({ suggestions, selectedIndices, onSuggestionClick, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm font-bold text-black mb-3"
      >
        <span>AI Suggestions</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-xs text-gray-500 animate-pulse py-2 text-center">Thinking...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-xs text-gray-400 italic py-2 text-center">Load a game to see suggestions</div>
          ) : (
            suggestions.slice(0, 3).map((suggestion, idx) => {
              const isActive = arraysMatch(selectedIndices, suggestion.words);
              return (
                <div
                  key={idx}
                  onClick={() => onSuggestionClick(suggestion.words)}
                  className={`
                    cursor-pointer rounded-lg px-3 py-2 transition-all
                    ${isActive
                      ? 'bg-gray-200'
                      : 'bg-gray-50 hover:bg-gray-100'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Score: {suggestion.score.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-black">
                    {suggestion.word_texts.join(', ')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
