import React from 'react';
import Reveal from './Reveal';

export default function SectionHead({ eyebrow, title, sub, center = true, light = false }) {
  return (
    <Reveal className={`section-head ${center ? 'center' : ''} ${light ? 'light' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="section-title">{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
      <span className="section-ornament" aria-hidden="true">
        <i /><b>❖</b><i />
      </span>
    </Reveal>
  );
}
