import React, { useEffect, useRef, useState } from 'react';

function Counter({ value, suffix = '', duration = 1600 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const step = (t) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(Math.round(value * eased));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className="stat-num">
      {n.toLocaleString('en-IN')}
      <em>{suffix}</em>
    </span>
  );
}

export default function StatsBand({ items }) {
  if (!items?.length) items = [
    { value: 2500, suffix: '+', label: 'Families Housed' },
    { value: 15, suffix: '+', label: 'Years of Trust' },
    { value: 9, suffix: '', label: 'Cities Covered' },
    { value: 98, suffix: '%', label: 'Happy Clients' },
  ];
  return (
    <div className="stats-band">
      <div className="container stats-grid">
        {items.map((s, i) => (
          <div className="stat" key={i}>
            <Counter value={Number(s.value) || 0} suffix={s.suffix || ''} />
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
