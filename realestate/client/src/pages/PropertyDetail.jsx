import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import PropertyCard from '../components/PropertyCard';
import Reveal from '../components/Reveal';
import { getProperty, postEnquiry, formatINR, formatINRCompact } from '../api';
import { useSite } from '../SiteContext';
import {
  IconBed, IconBath, IconArea, IconRupee, IconPin, IconPhone, IconMail, IconCheck,
  IconCalendar, IconKey, IconBuilding, IconGrid, IconArrowRight, IconSend, IconEye, IconHome,
} from '../icons';

const TYPE_ICONS = { House: IconHome, Bungalow: IconHome, Flat: IconBuilding, Villa: IconHome, Haveli: IconBuilding, Duplex: IconBuilding, Townhouse: IconBuilding };

export default function PropertyDetail() {
  const { slug } = useParams();
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const xtra = blocks.extras?.detail || {};
  const adminPhone = contact.phone || '';
  const [data, setData] = useState(null);
  const [img, setImg] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null);
    setImg(0);
    getProperty(slug).then(setData).catch(() => setData(null));
    window.scrollTo(0, 0);
  }, [slug]);

  if (!data) {
    return (
      <>
        <PageHero eyebrow="Property" title="Loading…" />
        <div className="section container"><p className="empty-hint">Loading home details…</p></div>
      </>
    );
  }

  const { property: p, similar } = data;
  const images = p.images?.length ? p.images : ['/uploads/seed/hero.jpg'];
  const TypeIcon = TYPE_ICONS[p.type] || IconHome;

  const facts = [
    { icon: IconBed, label: 'Bedrooms', value: `${p.bedrooms} BHK` },
    { icon: IconBath, label: 'Bathrooms', value: String(p.bathrooms) },
    { icon: IconArea, label: 'Carpet Area', value: p.area ? `${p.area} sq.ft` : '—' },
    { icon: IconGrid, label: 'Floors', value: String(p.floors || 1) },
    { icon: IconKey, label: 'Possession', value: p.possession || 'Ready' },
    { icon: IconCalendar, label: 'Built In', value: String(p.yearBuilt || '—') },
    { icon: IconBuilding, label: 'Furnishing', value: p.furnishing || '—' },
    { icon: IconArea, label: 'Plot Area', value: p.plotArea ? `${p.plotArea} sq.yd` : '—' },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await postEnquiry({ ...form, property: p._id, propertyTitle: p.title });
      setSent(true);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <>
      <section className="detail-hero">
        <div className="container">
          <nav className="crumbs">
            <Link to="/">Home</Link> <span>/</span> <Link to="/properties">Properties</Link> <span>/</span> <em>{p.title}</em>
          </nav>
          <Reveal>
            <h1>{p.title}</h1>
            <p className="detail-loc"><IconPin size={16} /> {p.address || `${p.locality}, ${p.city}`}</p>
          </Reveal>
        </div>
      </section>

      <section className="section detail">
        <div className="container detail-grid">
          <div className="detail-main">
            {/* Gallery */}
            <Reveal className="gallery">
              <div className="gallery-main">
                <img src={images[img]} alt={p.title} />
                <span className={`chip chip-${p.status}`}>{p.status === 'rent' ? 'For Rent' : 'For Sale'}</span>
                {p.availability && p.availability !== 'available' && (
                  <span className={`avail-lg avail-lg-${p.availability}`}>
                    {p.availability === 'sold' ? '🔴 Sold' : '🟠 Limited Availability'}
                  </span>
                )}
                <span className="gallery-views"><IconEye size={14} /> {p.views} views</span>
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((src, i) => (
                    <button key={i} className={i === img ? 'on' : ''} onClick={() => setImg(i)}>
                      <img src={src} alt={`${p.title} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </Reveal>

            {/* Price block */}
            <Reveal className="detail-price-box">
              <div>
                <span className="eyebrow">{p.status === 'rent' ? 'Monthly Rent' : 'Asking Price'}</span>
                <strong className="detail-price">
                  {formatINRCompact(p.price)} {p.status === 'rent' && <small>/ month</small>}
                </strong>
              </div>
              <span className="detail-price-tag"><TypeIcon size={18} /> {p.type}</span>
            </Reveal>

            {/* Facts */}
            <Reveal className="detail-facts">
              {facts.map((f, i) => (
                <div className="fact" key={i}>
                  <f.icon size={20} />
                  <span><small>{f.label}</small><strong>{f.value}</strong></span>
                </div>
              ))}
            </Reveal>

            {/* Description */}
            <Reveal className="detail-block">
              <h2>{xtra.detailsHeading || 'Property Details'}</h2>
              <p className="detail-desc">{p.description}</p>
            </Reveal>

            {/* Amenities */}
            <Reveal className="detail-block">
              <h2>{xtra.amenitiesHeading || 'Amenities & Features'}</h2>
              <div className="amenity-grid">
                {p.amenities?.map((a, i) => (
                  <span className="amenity" key={i}><IconCheck size={14} /> {a}</span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Sidebar */}
          <aside className="detail-side">
            <Reveal dir="left" className="enquiry-card">
              <h3>{xtra.enquiryTitle || 'Interested? Call us'}</h3>
              {adminPhone ? (
                <a className="enq-phone" href={`tel:${adminPhone.replace(/\s/g, '')}`}><IconPhone size={17} /> {adminPhone}</a>
              ) : (
                <a className="enq-phone" href="#enquiry-form"><IconPhone size={17} /> Send an enquiry</a>
              )}
              <div className="enq-divider"><span>{xtra.enquirySub || 'or send an enquiry'}</span></div>
              {sent ? (
                <div className="enq-success">
                  <span className="enq-check"><IconCheck size={22} /></span>
                  <h4>Shukriya, {form.name.split(' ')[0] || 'friend'}!</h4>
                  <p>We will call you back within 2 working hours.</p>
                </div>
              ) : (
                <form onSubmit={submit} className="enq-form">
                  <input required placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input required placeholder="Phone number *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <input placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <textarea rows={3} placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  {err && <p className="form-err">{err}</p>}
                  <button className="btn btn-gold btn-block" type="submit">
                    Send Enquiry <IconSend size={15} />
                  </button>
                </form>
              )}
            </Reveal>

            <Reveal dir="left" delay={120} className="key-card">
              <h3>{xtra.keyHighlightsHeading || 'Key Highlights'}</h3>
              <ul>
                <li><IconRupee size={15} /> <span><small>Price</small><strong>{formatINR(p.price)}</strong></span></li>
                <li><IconPin size={15} /> <span><small>Location</small><strong>{p.locality}, {p.city}</strong></span></li>
                <li><IconKey size={15} /> <span><small>Status</small><strong>{p.possession}</strong></span></li>
                <li><IconCheck size={15} /> <span><small>Verification</small><strong>Legal title verified</strong></span></li>
              </ul>
            </Reveal>
          </aside>
        </div>
      </section>

      {similar?.length > 0 && (
        <section className="section similar">
          <div className="container">
            <Reveal className="section-head center">
              <span className="eyebrow">Aur Bhi Ghar</span>
              <h2 className="section-title">{xtra.similarHeading || 'Similar Homes'}</h2>
            </Reveal>
            <div className="prop-grid">
              {similar.map((s, i) => (
                <Reveal key={s._id} delay={i * 80}>
                  <PropertyCard p={s} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
