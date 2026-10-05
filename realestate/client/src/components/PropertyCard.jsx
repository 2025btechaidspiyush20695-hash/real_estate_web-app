import React from 'react';
import { Link } from 'react-router-dom';
import { IconBed, IconBath, IconArea, IconPin, IconArrowRight, IconSparkle, IconWhatsapp } from '../icons';
import { formatINRCompact } from '../api';
import { useSite } from '../SiteContext';

export default function PropertyCard({ p, index = 0 }) {
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const wa = contact.whatsapp ? String(contact.whatsapp).replace(/\D/g, '') : '';
  const img = p.images?.[0] || '/uploads/seed/hero.jpg';
  const waMsg = encodeURIComponent(`Hello! I am interested in "${p.title}" (${formatINRCompact(p.price)}). Please share more details.`);

  return (
    <div
      className="prop-card"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <Link to={`/properties/${p.slug}`} className="prop-card-img">
        <img src={img} alt={p.title} loading="lazy" />
        <span className={`chip chip-${p.status}`}>{p.status === 'rent' ? 'FOR RENT' : 'FOR SALE'}</span>
        <span className={`avail avail-${p.availability || 'available'}`}>
          {p.availability === 'sold' ? '● Sold' : p.availability === 'limited' ? '● Limited' : '● Available'}
        </span>
        {p.featured && (
          <span className="chip chip-featured"><IconSparkle size={12} /> Featured</span>
        )}
        <span className="prop-card-price">{formatINRCompact(p.price)}{p.status === 'rent' ? <small>/mo</small> : ''}</span>
      </Link>
      <div className="prop-card-body">
        <Link to={`/properties/${p.slug}`} className="prop-card-title">
          <h3>{p.title}</h3>
        </Link>
        <p className="prop-card-loc"><IconPin size={14} /> {p.locality || p.city}, {p.city}</p>
        <div className="prop-card-facts">
          <span><IconBed size={16} /> {p.bedrooms} BHK</span>
          <span><IconBath size={16} /> {p.bathrooms}</span>
          <span><IconArea size={16} /> {p.area ? `${p.area} sq.ft` : '—'}</span>
        </div>
        <div className="prop-card-actions">
          <Link to={`/properties/${p.slug}`} className="prop-card-link">
            View Details <IconArrowRight size={15} />
          </Link>
          {wa && (
            <a
              className="prop-card-wa"
              href={`https://wa.me/${wa}?text=${waMsg}`}
              target="_blank"
              rel="noreferrer"
              title="Enquire on WhatsApp"
            >
              <IconWhatsapp size={15} /> Enquire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
