import React, { useRef, useLayoutEffect } from 'react';

const GameBoard = ({ words, selectedIndices, onWordClick, solvedIndices, isLoading, shakingIndices, jumpingIndices, reorderToFront, isAutoPlaying }) => {
  const gridRef = useRef(null);
  const positionsRef = useRef({});
  const didFlipRef = useRef(false);

  const visibleWords = (words || [])
    .map((word, index) => ({ word, index }))
    .filter(({ index }) => !(solvedIndices || []).includes(index));

  // When reorderToFront is set, move those tiles to the first row
  let displayWords = visibleWords;
  if (reorderToFront && reorderToFront.length > 0) {
    const front = visibleWords.filter(({ index }) => reorderToFront.includes(index));
    const rest = visibleWords.filter(({ index }) => !reorderToFront.includes(index));
    displayWords = [...front, ...rest];
  }

  // FLIP animation system
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const tiles = Array.from(grid.querySelectorAll('[data-tile-index]'));
    if (!tiles.length) return;

    const isReordering = reorderToFront && reorderToFront.length > 0;
    const isAnimating = (jumpingIndices && jumpingIndices.length > 0) ||
                        (shakingIndices && shakingIndices.length > 0);

    if (isReordering && !didFlipRef.current && Object.keys(positionsRef.current).length > 0) {
      // FLIP: animate every tile from its old position to its new one
      didFlipRef.current = true;
      tiles.forEach(tile => {
        const idx = parseInt(tile.dataset.tileIndex);
        const old = positionsRef.current[idx];
        if (!old) return;
        const cur = tile.getBoundingClientRect();
        const dx = old.left - cur.left;
        const dy = old.top - cur.top;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        // Kill any lingering transition so inverse transform is instant
        tile.style.transition = 'none';
        tile.style.transform = `translate(${dx}px, ${dy}px)`;
        tile.getBoundingClientRect(); // force reflow
        // Animate to new position
        tile.style.transition = 'transform 0.42s ease-in-out';
        tile.style.transform = '';
      });
    } else if (!isReordering && !isAnimating) {
      // Clean up any inline styles left over from a previous FLIP
      didFlipRef.current = false;
      tiles.forEach(tile => {
        tile.style.transition = '';
        tile.style.transform = '';
      });
      // Save positions when idle (no animations running)
      const pos = {};
      tiles.forEach(tile => {
        const idx = parseInt(tile.dataset.tileIndex);
        if (!isNaN(idx)) {
          const r = tile.getBoundingClientRect();
          pos[idx] = { left: r.left, top: r.top };
        }
      });
      positionsRef.current = pos;
    }
  });

  if (isLoading || !words || words.length === 0) {
    const grid = (
      <div className="grid grid-cols-4 gap-2 relative">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="h-[64px] md:h-[76px] rounded-lg bg-tile"
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-bold text-black animate-pulse">
            {isLoading ? 'Loading...' : 'Press New Game to start'}
          </div>
        </div>
      </div>
    );
    return grid;
  }

  const grid = (
    <div ref={gridRef} className="grid grid-cols-4 gap-2">
      {displayWords.map(({ word, index }) => {
        const isSelected = (selectedIndices || []).includes(index);
        const isShaking = (shakingIndices || []).includes(index);
        const jumpOrder = (jumpingIndices || []).indexOf(index);
        const isJumping = jumpOrder >= 0;
        const isInFront = (reorderToFront || []).includes(index);

        return (
          <button
            key={index}
            data-tile-index={index}
            onClick={() => onWordClick(index)}
            style={isJumping ? { animationDelay: `${jumpOrder * 120}ms` } : undefined}
            className={`
              h-[64px] md:h-[76px] flex items-center justify-center
              rounded-lg text-xs sm:text-sm font-extrabold uppercase select-none
              ${isSelected || isInFront
                ? 'bg-tile-selected text-white'
                : 'bg-tile text-black hover:bg-tile-hover transition-colors duration-150'}
              ${isShaking ? 'animate-shake' : ''}
              ${isJumping ? 'animate-jump' : ''}
            `}
          >
            {word}
          </button>
        );
      })}
    </div>
  );

  return grid;
};

export default GameBoard;
