import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../SiteContext';
import { getProperties } from '../api';
import Marquee from '../components/Marquee';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import TestimonialsSlider from '../components/TestimonialsSlider';
import PropertyCard from '../components/PropertyCard';
import StatsBand from '../components/CountUp';
import CTABanner from '../components/CTA';
import { IconArrowRight, IconCheck, IconShield, IconRupee, IconHandshake, IconHome, IconQuote, IconStar, IconPin, IconClock, IconLand, IconDoc, IconKey, IconBuilding } from '../icons';

/* ================= HERO (brand + USP + search + trust) ================= */
function Hero() {
  const { blocks } = useSite();
  const hero = blocks.hero || {};
  const trust = blocks.trust || { items: [] };
  const trustIcons = { check: IconCheck, clock: IconClock, pin: IconPin };

  return (
    <section className="hero">
      <div className="hero-media">
        <img src={hero.image || '/uploads/seed/hero.jpg'} alt="" className="hero-video" />
        <div className="hero-veil" />
      </div>

      <div className="container hero-content">
        <Reveal delay={80}>
          <span className="hero-brand">{hero.brand || 'Gurukripa Estate'}</span>
        </Reveal>
        <Reveal delay={160}>
          <span className="hero-badge">{hero.badge || 'विश्वास से घर खरीदिए'}</span>
        </Reveal>
        <h1 className="hero-title">
          <Reveal delay={240}><span className="line1">{hero.titleLine1 || 'Apna Ghar,'}</span></Reveal>
          <Reveal delay={360}><span className="line2">{hero.titleLine2 || 'Apni Pehchaan'}</span></Reveal>
        </h1>
        <Reveal delay={480}>
          <p className="hero-sub">{hero.subtitle || ''}</p>
        </Reveal>

        <Reveal delay={560} className="hero-ctas">
          <Link to={hero.primaryCta?.to || '/properties'} className="btn btn-primary btn-lg">
            {hero.primaryCta?.label || 'Explore Properties'} <IconArrowRight size={17} />
          </Link>
          <Link to={hero.secondaryCta?.to || '/contact'} className="btn btn-ghost-light btn-lg">
            {hero.secondaryCta?.label || 'Talk to an Expert'}
          </Link>
        </Reveal>

        {/* Trust indicators */}
        {trust.items?.length > 0 && (
          <Reveal delay={640} className="hero-trust">
            {trust.items.map((t, i) => {
              const Ic = trustIcons[t.icon] || IconCheck;
              return (
                <span key={i}><Ic size={14} /> {t.label}</span>
              );
            })}
          </Reveal>
        )}
      </div>

      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="cue-mouse"><i /></span>
        <span>Scroll</span>
      </div>
    </section>
  );
}

/* ================= SELECTED PROPERTIES ================= */
function Selected() {
  const { blocks } = useSite();
  const selected = blocks.selected || {};
  const [list, setList] = useState([]);
  useEffect(() => {
    getProperties({ featured: 'true', limit: 6 }).then((d) => setList(d.items)).catch(() => {});
  }, []);

  return (
    <section className="section featured">
      <div className="container">
        <SectionHead
          eyebrow="Hamare Khaas Ghar"
          title={selected.title || 'Hamari Selected Properties'}
          sub={selected.sub || ''}
        />
        <div className="prop-grid">
          {list.map((p, i) => (
            <Reveal key={p._id} delay={(i % 3) * 90}>
              <PropertyCard p={p} index={i} />
            </Reveal>
          ))}
        </div>
        {list.length === 0 && <p className="empty-hint">Naye ghar jald hi list honge — thodi der baad check karein.</p>}
        <Reveal className="center mt-40">
          <Link to="/properties" className="btn btn-outline btn-lg">
            View All Properties <IconArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= OUR SERVICES ================= */
const SERVICE_ICONS = { home: IconHome, land: IconLand, building: IconBuilding, rupee: IconRupee, doc: IconDoc, key: IconKey, shield: IconShield, handshake: IconHandshake };

function Services() {
  const { blocks } = useSite();
  const services = blocks.services || {};
  const items = services.items || [];

  return (
    <section className="section services">
      <div className="container">
        <SectionHead eyebrow="Hamari Services" title={services.title || 'Hum sirf ghar nahi, poora solution dete hain'} />
        <div className="feat-grid">
          {items.map((s, i) => {
            const Ic = SERVICE_ICONS[s.icon] || IconHome;
            return (
              <Reveal key={i} delay={(i % 3) * 80} className="feat-card">
                <span className="feat-icon"><Ic size={24} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= ABOUT + FOUNDER ================= */
function AboutPreview() {
  const { blocks } = useSite();
  const about = blocks.about || {};
  const founder = blocks.founder || {};

  const highlights = about.highlights || ['Verified properties', 'Legal support', 'Local expertise'];

  return (
    <section className="section about-preview">
      <div className="container about-preview-grid">
        <Reveal dir="right" style={{ position: 'relative' }}>
          <div className="about-img-frame">
            <img src={about.image || '/uploads/seed/about.jpg'} alt={about.title || 'About Gurukripa'} />
          </div>
          <div className="about-badge-card">
            <span className="about-badge-year">est.</span>
            <strong>{about.since || '2008'}</strong>
            <span className="about-badge-sub">Serving with honesty</span>
          </div>
        </Reveal>

        <div className="about-preview-text">
          <Reveal>
            <span className="eyebrow">Hamari Kahani</span>
            <h2 className="section-title left">{about.title || 'Ghar wahi, jahan dil bole'}</h2>
          </Reveal>
          <Reveal delay={100}><h3 className="about-heading">{about.heading || ''}</h3></Reveal>
          {(about.paragraphs || []).map((p, i) => (
            <Reveal key={i} delay={120 + i * 80}><p className="about-para">{p}</p></Reveal>
          ))}
          <div className="about-highlights">
            {highlights.map((h, i) => (
              <Reveal key={i} delay={i * 60} className="about-highlight"><IconCheck size={15} /> {h}</Reveal>
            ))}
          </div>

          {/* Founder card */}
          {founder.name && (
            <Reveal delay={200} className="founder-card">
              <div className="founder-img">
                <img src={founder.image || '/uploads/seed/about.jpg'} alt={founder.name} />
              </div>
              <div className="founder-info">
                <span className="eyebrow">Meet the Founder</span>
                <h4>{founder.name}</h4>
                <p className="founder-title">{founder.title || 'Founder & Director'}</p>
                <p className="founder-bio">{founder.bio || ''}</p>
                {founder.since && <span className="founder-since">Since {founder.since}</span>}
              </div>
            </Reveal>
          )}

          <Reveal delay={280}>
            <Link to="/about" className="btn btn-outline">Read Our Story <IconArrowRight size={15} /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ================= AREAS WE SERVE ================= */
function Areas() {
  const { blocks } = useSite();
  const areas = blocks.areas || {};
  const items = areas.items || [];
  const [counts, setCounts] = useState({});

  useEffect(() => {
    getProperties({ limit: 100 }).then((d) => {
      const c = {};
      d.items.forEach((p) => {
        const k = p.locality || p.city;
        c[k] = (c[k] || 0) + 1;
      });
      setCounts(c);
    }).catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section className="section areas">
      <div className="container">
        <SectionHead eyebrow="Areas We Serve" title={areas.title || 'Jaipur mein hum kahan available hain?'} sub={areas.sub || ''} />
        <div className="areas-grid">
          {items.map((a, i) => {
            const cnt = counts[a] || 0;
            return (
              <Reveal key={i} delay={(i % 4) * 60}>
                <Link to={`/properties?q=${encodeURIComponent(a)}`} className="area-chip">
                  <IconPin size={15} />
                  <span>
                    <strong>{a}</strong>
                    <small>{cnt > 0 ? `${cnt} propert${cnt === 1 ? 'y' : 'ies'} →` : 'Local expert'}</small>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= WHY FAMILIES CHOOSE US ================= */
const FEATURE_ICONS = { shield: IconShield, rupee: IconRupee, handshake: IconHandshake, home: IconHome };

function Features() {
  const { blocks } = useSite();
  const feat = blocks.features || {};
  const items = feat.items || [];

  return (
    <section className="section features" id="why">
      <div className="container">
        <SectionHead eyebrow="Kyun Gurukripa?" title={feat.title || 'Why families choose Gurukripa'} />
        <div className="feat-grid">
          {items.map((f, i) => {
            const Ic = FEATURE_ICONS[f.icon] || IconHome;
            return (
              <Reveal key={i} delay={(i % 4) * 80} className="feat-card">
                <span className="feat-icon"><Ic size={24} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= TESTIMONIALS ================= */
function Testimonials() {
  const { blocks } = useSite();
  const t = blocks.testimonials || {};
  const items = t.items || [];

  return (
    <section className="section testimonials">
      <div className="container">
        <SectionHead eyebrow="Shubhkamnayein" title={t.title || 'Kya kehte hain hamare parivaar'} />
        <TestimonialsSlider items={items} />
      </div>
    </section>
  );
}

/* ================= HOME ================= */
export default function Home() {
  const { blocks } = useSite();
  const hero = blocks.hero || {};
  const marquee = blocks.marquee || {};

  return (
    <>
      <Hero />
      <Marquee items={marquee.items} />
      <div className="stats-section">
        <StatsBand items={blocks.stats?.items} />
      </div>
      <Selected />
      <Services />
      <AboutPreview />
      <Areas />
      <Features />
      <Testimonials />
      <CTABanner />
    </>
  );
}
