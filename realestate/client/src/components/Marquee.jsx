import React from 'react';
import { IconHome } from '../icons';

/**
 * Infinite scrolling marquee strip with city names (Hindi + English).
 */
export default function Marquee({ items = [], sep = '✦' }) {
  const row = items.length ? items : ['जयपुर', 'Jaipur', 'उदयपुर', 'Udaipur'];
  const doubled = [...row, ...row];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span className="marquee-item" key={i}>
            <IconHome size={15} />
            {item}
            <em className="marquee-sep">{sep}</em>
          </span>
        ))}
      </div>
    </div>
  );
}
