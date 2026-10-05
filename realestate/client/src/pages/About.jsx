import React, { useEffect, useRef } from 'react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import SectionHead from '../components/SectionHead';
import StatsBand from '../components/CountUp';
import CTABanner from '../components/CTA';
import { useSite } from '../SiteContext';
import { IconShield, IconRupee, IconHandshake, IconHome, IconCheck } from '../icons';

const VALUES = [
  { icon: IconShield, title: 'Shuddh Legal', text: 'Every title deed is verified by empaneled advocates before listing.' },
  { icon: IconRupee, title: 'Parda-free Pricing', text: 'We publish the price the owner actually wants. No lalchi margins.' },
  { icon: IconHandshake, title: 'Family First', text: 'We treat every buyer like a rishtedaar — patience, honesty, warmth.' },
  { icon: IconHome, title: 'Ghar ke Baad bhi', text: 'Registration, shifting, repairs — we stay with you after the keys.' },
];

export default function About() {
  const { blocks } = useSite();
  const about = blocks.about || {};
  const pages = blocks.pages || {};
  const stats = blocks.stats || {};
  const imgWrap = useRef(null);

  useEffect(() => {
    const el = imgWrap.current;
    if (!el) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2);
        const offset = Math.max(-40, Math.min(40, progress * -20));
        el.querySelector('img').style.transform = `translateY(${offset}px) scale(1.15)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const highlights = about.highlights || [];

  return (
    <>
      <PageHero
        eyebrow="Hamari Kahani"
        title="The Gurukripa Story"
        sub="From a small office in Mansarovar to thousands of families across Rajasthan."
      />

      {/* Story */}
      <section className="section about-page">
        <div className="container about-preview-grid">
          <Reveal dir="right" style={{ position: 'relative' }}>
            <div ref={imgWrap} className="about-img-frame tall">
              <img src={about.image || '/uploads/seed/about.jpg'} alt="The Gurukripa family" />
            </div>
          </Reveal>
          <div className="about-preview-text">
            <Reveal>
              <span className="eyebrow">Shuruaat 2008 se</span>
              <h2 className="section-title left">{about.title || ''}</h2>
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
          </div>
        </div>
      </section>

      <div className="stats-section">
        <StatsBand items={stats.items} />
      </div>

      {/* Values */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Hamare Usool" title="What we stand for" />
          <div className="feat-grid">
            {VALUES.map((v, i) => (
              <Reveal key={i} delay={i * 90} className="feat-card">
                <span className="feat-icon"><v.icon size={26} /></span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
