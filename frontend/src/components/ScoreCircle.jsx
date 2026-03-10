import React from 'react';

export default function ScoreCircle({ score, size = 120 }) {
  const radius = 45;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const color = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute" style={{ marginTop: `-${size / 2 + 16}px` }}>
        <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}
