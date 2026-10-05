import React from 'react';

/**
 * Brass diya with a flickering flame + glow. Purely CSS/SVG animated.
 */
export default function Diya({ size = 64, className = '', flame = '#ffb84d', glow = 'rgba(255,150,40,.55)' }) {
  return (
    <div className={`diya ${className}`} style={{ width: size, height: size * 1.05 }} aria-hidden="true">
      <svg viewBox="0 0 64 68" width={size} height={size * 1.05} style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`dglow-${glow.length}`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor={glow} />
            <stop offset="100%" stopColor="rgba(255,150,40,0)" />
          </radialGradient>
        </defs>
        <circle className="diya-glow" cx="32" cy="26" r="22" fill={`url(#dglow-${glow.length})`} />
        {/* flame */}
        <g className="diya-flame">
          <path d="M32 8 C38 16, 41 21, 38 27 C35 32, 29 32, 26 27 C23 21, 26 16, 32 8 Z" fill={flame} />
          <path d="M32 16 C35 21, 36 24, 34 27 C32 29, 30 29, 30 27 C28 24, 29 21, 32 16 Z" fill="#ffe9b0" />
        </g>
        {/* wick */}
        <rect x="30.6" y="27" width="2.8" height="6" rx="1" fill="#5b3a1e" />
        {/* bowl */}
        <path d="M6 42 C6 52, 14 58, 32 58 C50 58, 58 52, 58 42 C58 38, 54 35, 49 34 C46 40, 40 44, 32 44 C24 44, 18 40, 15 34 C10 35, 6 38, 6 42 Z" fill="#a86a1f" />
        <path d="M15 34 C18 40, 24 44, 32 44 C40 44, 46 40, 49 34 C45 30, 38 28, 32 28 C26 28, 19 30, 15 34 Z" fill="#7c4a12" />
        <ellipse cx="32" cy="58" rx="26" ry="4" fill="#8a5a1c" />
        <path d="M49 34 C49 34, 50 40, 49 44 C48 48, 45 50, 42 51" fill="none" stroke="#d9942f" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M15 34 C15 34, 14 40, 15 44 C16 48, 19 50, 22 51" fill="none" stroke="#d9942f" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
