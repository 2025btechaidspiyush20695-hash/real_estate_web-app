import React from 'react';
import { Link } from 'react-router-dom';
import { IconPhone, IconMail, IconPin, IconClock, IconWhatsapp, IconArrowRight, IconFacebook, IconInstagram } from '../icons';
import { useSite } from '../SiteContext';

export default function Footer() {
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const footer = blocks.footer || {};
  const cities = blocks.extras?.footerCities?.length ? blocks.extras.footerCities : ['Jaipur', 'Udaipur', 'Jodhpur', 'Ajmer', 'Kota'];

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo light">
              <span className="logo-mark">
                <img src="/logo.png" alt="Gurukripa Estate logo" width="36" height="36" />
              </span>
              <span className="logo-text">
                <strong>{footer.company || 'GURUKRIPA'}</strong>
                <small>ESTATES</small>
              </span>
            </div>
            <p className="footer-tagline">{footer.tagline || 'Trusted Real Estate Since 2008'}</p>
            <p className="footer-about">{footer.about || ''}</p>
            {(footer.rera || footer.gstin) && (
              <div className="footer-reg">
                {footer.rera && <span>RERA Reg. No.: {footer.rera}</span>}
                {footer.gstin && <span>GSTIN: {footer.gstin}</span>}
              </div>
            )}
            {(footer.facebook || footer.instagram) && (
              <div className="footer-social">
                {footer.facebook && (
                  <a href={footer.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><IconFacebook size={17} /></a>
                )}
                {footer.instagram && (
                  <a href={footer.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><IconInstagram size={17} /></a>
                )}
              </div>
            )}
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/properties">Properties</Link>
            <Link to="/find-a-home">Find a Home</Link>
            <Link to="/#why">Why Gurukripa</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-col">
            <h4>Top Cities</h4>
            {cities.map((c) => <span key={c}>{c}</span>)}
          </div>

          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            {contact.phone && <a href={`tel:${contact.phone.replace(/\s/g, '')}`}><IconPhone size={15} /> {contact.phone}</a>}
            {contact.email && <a href={`mailto:${contact.email}`}><IconMail size={15} /> {contact.email}</a>}
            {contact.whatsapp && (
              <a href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                <IconWhatsapp size={15} /> WhatsApp Us
              </a>
            )}
            {contact.address && <p><IconPin size={15} /> {contact.address}</p>}
            {contact.hours && <p><IconClock size={15} /> {contact.hours}</p>}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} {footer.company || 'Gurukripa Estate'}. All rights reserved.</p>
          <p className="footer-links">
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
