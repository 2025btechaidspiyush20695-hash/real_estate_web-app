import React from 'react';

/**
 * Decorative rotating mandala (Indian motif), drawn procedurally.
 */
export default function Mandala({ size = 420, className = '', speed = 60, color = 'currentColor', stroke = 1.4 }) {
  const petals = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N;
    petals.push(
      <g key={i} transform={`rotate(${a} 100 100)`}>
        <path
          d="M100 12 C 108 30, 112 44, 100 62 C 88 44, 92 30, 100 12 Z"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          opacity="0.5"
        />
        <circle cx="100" cy="34" r="3" fill={color} opacity="0.35" />
      </g>
    );
  }
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`mandala ${className}`}
      style={{ animationDuration: `${speed}s` }}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth={stroke * 0.7} opacity="0.35" />
      <circle cx="100" cy="100" r="72" fill="none" stroke={color} strokeWidth={stroke * 0.7} opacity="0.3" strokeDasharray="4 6" />
      {petals}
      <circle cx="100" cy="100" r="30" fill="none" stroke={color} strokeWidth={stroke} opacity="0.55" />
      <circle cx="100" cy="100" r="14" fill="none" stroke={color} strokeWidth={stroke} opacity="0.6" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="4" fill={color} opacity="0.6" />
    </svg>
  );
}
