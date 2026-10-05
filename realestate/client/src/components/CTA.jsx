import React from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../SiteContext';
import Reveal from './Reveal';
import { IconArrowRight, IconPhone, IconWhatsapp } from '../icons';

export default function CTABanner() {
  const { blocks } = useSite();
  const banner = blocks.banner || {};
  const contact = blocks.contact || {};
  return (
    <section className="cta-band">
      <Reveal className="cta-inner">
        <p className="cta-hindi">आओ, चाय पीते हैं</p>
        <h2 className="cta-title">{banner.title || 'Sapno ka ghar dhoondh rahe hain?'}</h2>
        <p className="cta-text">{banner.text || 'Book a free site visit this weekend — chai aur site visit, dono humari taraf se!'}</p>
        <div className="cta-actions">
          <Link to={banner.cta?.to || '/contact'} className="btn btn-cream btn-lg">
            {banner.cta?.label || 'Schedule a Site Visit'} <IconArrowRight size={16} />
          </Link>
        </div>
        <div className="cta-contacts">
          {contact.phone && (
            <a className="cta-call" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              <IconPhone size={15} /> {contact.phone}
            </a>
          )}
          {contact.whatsapp && (
            <a className="cta-wa" href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <IconWhatsapp size={15} /> WhatsApp Us
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
