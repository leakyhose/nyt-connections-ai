import React from 'react';

const GROUP_CONFIG = [
  { colorClass: 'bg-group-yellow' },
  { colorClass: 'bg-group-green' },
  { colorClass: 'bg-group-blue' },
  { colorClass: 'bg-group-purple' },
];

const SolvedGroups = ({ solvedGroups }) => {
  if (!solvedGroups || solvedGroups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-2">
      {solvedGroups.map(({ group, words }) => {
        const config = GROUP_CONFIG[group] || GROUP_CONFIG[0];
        return (
          <div
            key={group}
            className={`
              ${config.colorClass} rounded-lg px-4 text-center
              h-[64px] md:h-[76px] flex items-center justify-center
            `}
          >
            <div className="text-sm font-bold text-black uppercase">
              {words.join(', ')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SolvedGroups;
