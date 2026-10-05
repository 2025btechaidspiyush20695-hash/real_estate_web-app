import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IconQuote, IconStar, IconPin, IconArrowLeft, IconArrowRight } from '../icons';

/**
 * Testimonials Slider — responsive carousel
 * - desktop: 3 cards, tablet: 2, mobile: 1
 * - left/right arrows + drag/swipe + dots
 * - auto-play (pause on hover/drag)
 */
export default function TestimonialsSlider({ items = [] }) {
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(3);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [auto, setAuto] = useState(true);
  const pages = Math.max(1, items.length - perView + 1);

  // responsive per-view
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // clamp page when items/perView change
  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, items.length - perView)));
  }, [items.length, perView]);

  const go = useCallback((dir) => {
    setPage((p) => Math.min(Math.max(0, p + dir), Math.max(0, items.length - perView)));
  }, [items.length, perView]);

  // auto-play
  useEffect(() => {
    if (!auto || items.length <= perView) return;
    const id = setInterval(() => {
      setPage((p) => {
        const max = Math.max(0, items.length - perView);
        return p >= max ? 0 : p + 1;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [auto, items.length, perView]);

  const onMouseDown = (e) => {
    setDragging(true);
    setDragStart(e.clientX);
    setDragX(0);
    setAuto(false);
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setDragX(e.clientX - dragStart);
  };
  const onMouseUp = () => {
    if (!dragging) return;
    if (dragX < -45) go(1);
    else if (dragX > 45) go(-1);
    setDragging(false);
    setDragX(0);
    setTimeout(() => setAuto(true), 3000);
  };

  const cardW = 100 / perView;
  const offset = page * cardW;

  if (!items.length) return null;

  return (
    <div
      className="tslider"
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => setAuto(true)}
    >
      {/* arrows */}
      <button
        type="button"
        className="tslider-arrow prev"
        onClick={() => go(-1)}
        disabled={page <= 0}
        aria-label="Previous reviews"
      >
        <IconArrowLeft size={18} />
      </button>

      <div
        className={`tslider-viewport ${dragging ? 'dragging' : ''}`}
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={(e) => { setDragging(true); setDragStart(e.touches[0].clientX); setDragX(0); setAuto(false); }}
        onTouchMove={(e) => setDragX(e.touches[0].clientX - dragStart)}
        onTouchEnd={onMouseUp}
      >
        <div
          className="tslider-track"
          style={{
            transform: `translateX(-${offset}%)`,
            transition: dragging ? 'none' : 'transform .5s cubic-bezier(.25,.8,.25,1)',
          }}
        >
          {items.map((item, i) => (
            <div className="tslider-slide" style={{ width: `${cardW}%` }} key={i}>
              <div className="testi-card">
                <IconQuote size={28} className="testi-quote" />
                <p className="testi-text">“{item.text}”</p>
                <div className="testi-stars">
                  {Array.from({ length: item.rating || 5 }).map((_, s) => (
                    <IconStar key={s} size={14} />
                  ))}
                </div>
                <div className="testi-who">
                  <span className="testi-avatar">{String(item.name || 'A').charAt(0)}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small><IconPin size={11} /> {item.city}</small>
                    {item.property && <em className="testi-property">🏠 {item.property}</em>}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="tslider-arrow next"
        onClick={() => go(1)}
        disabled={page >= pages - 1}
        aria-label="Next reviews"
      >
        <IconArrowRight size={18} />
      </button>

      {/* dots */}
      {pages > 1 && (
        <div className="tslider-dots">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`tslider-dot ${i === page ? 'on' : ''}`}
              onClick={() => setPage(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
