import React, { useEffect, useRef, useState } from 'react';

/**
 * Scroll-reveal wrapper: fades/slides children in when they enter the viewport.
 * props: delay (ms), dir (up|down|left|right|none), as (tag), className, once
 */
export default function Reveal({ children, delay = 0, dir = 'up', className = '', as: Tag = 'div', once = true, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${dir} ${shown ? 'is-shown' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </Tag>
  );
}
