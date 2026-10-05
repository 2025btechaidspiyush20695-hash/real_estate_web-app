import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IconMenu, IconX, IconPhone } from '../icons';
import { useSite } from '../SiteContext';

function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'light' : ''}`}>
      <span className="logo-mark">
        <img src="/logo.png" alt="Gurukripa Estate logo" width="38" height="38" />
      </span>
      <span className="logo-text">
        <strong>GURUKRIPA</strong>
        <small>ESTATE</small>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/properties', label: 'Properties' },
    { to: '/#why', label: 'Why Gurukripa' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''} ${open ? 'open' : ''}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          {contact.phone && (
            <a className="nav-phone" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              <IconPhone size={16} />
              <span>{contact.phone}</span>
            </a>
          )}
          <Link to="/find-a-home" className="btn btn-gold nav-cta">
            Find a Home
          </Link>
          <button className="nav-burger" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="nav-drawer">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/find-a-home" className="btn btn-gold">Find a Home</Link>
          <Link to="/contact" className="btn btn-outline">Talk to an Advisor</Link>
        </div>
      )}
    </header>
  );
}
