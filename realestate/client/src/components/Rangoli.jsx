import React, { useEffect, useRef, useState } from 'react';

/**
 * Rangoli (kolam-style) motif that "draws itself" with a stroke animation
 * when it scrolls into view. Procedurally generated petals + dots.
 */
export default function Rangoli({ size = 320, className = '', color = '#e8730f' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const petals = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N;
    petals.push(
      <g key={i} transform={`rotate(${a} 100 100)`}>
        <path
          d="M100 14 C 106 30, 108 46, 100 58 C 92 46, 94 30, 100 14 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="100" cy="26" r="2.6" fill={color} />
      </g>
    );
  }
  const dots = [];
  for (let r = 0; r < 3; r++) {
    const rr = 30 + r * 16;
    for (let i = 0; i < 12; i++) {
      const a = (i * 360) / 12 + r * 7;
      const x = 100 + rr * Math.cos((a * Math.PI) / 180);
      const y = 100 + rr * Math.sin((a * Math.PI) / 180);
      dots.push(<circle key={`${r}-${i}`} cx={x} cy={y} r={1.8} fill={color} opacity="0.65" />);
    }
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`rangoli ${on ? 'is-drawn' : ''} ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" fill="none" stroke={color} strokeWidth="1" opacity="0.35" strokeDasharray="3 5" />
      <g className="rangoli-petals">
        {petals}
        <circle cx="100" cy="100" r="34" fill="none" stroke={color} strokeWidth="1.4" />
        <circle cx="100" cy="100" r="10" fill={color} opacity="0.8" />
        {dots}
      </g>
      <circle cx="100" cy="100" r="70" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" strokeDasharray="1 6" />
    </svg>
  );
}
