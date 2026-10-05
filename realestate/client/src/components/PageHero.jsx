import React from 'react';
import Reveal from './Reveal';

export default function PageHero({ eyebrow, title, sub }) {
  return (
    <section className="page-hero">
      <Reveal className="page-hero-content">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </Reveal>
    </section>
  );
}
