import React, { useState } from 'react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import { useSite } from '../SiteContext';
import { postEnquiry } from '../api';
import { IconPhone, IconMail, IconPin, IconClock, IconWhatsapp, IconSend, IconCheck } from '../icons';

export default function Contact() {
  const { blocks } = useSite();
  const contact = blocks.contact || {};
  const pages = blocks.pages || {};
  const xtra = blocks.extras?.contactPage || {};
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await postEnquiry(form);
      setSent(true);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const cards = [
    contact.phone && { icon: IconPhone, title: 'Call Us', lines: [contact.phone], href: `tel:${contact.phone.replace(/\s/g, '')}` },
    contact.whatsapp && { icon: IconWhatsapp, title: 'WhatsApp', lines: ['Chat with an advisor instantly'], href: `https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}` },
    contact.email && { icon: IconMail, title: 'Email', lines: [contact.email], href: `mailto:${contact.email}` },
    contact.address && { icon: IconPin, title: 'Office', lines: [contact.address], href: '#' },
  ].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={pages.contact?.eyebrow || 'Baatein Karte Hain'}
        title={pages.contact?.title || 'Talk to Our Team'}
        sub={pages.contact?.sub || 'Free consultation, honest advice — aur haan, chai humari taraf se.'}
      />

      <section className="section contact-page">
        <div className="container">
          <div className="contact-cards">
            {cards.map((c, i) => (
              <Reveal key={i} delay={i * 80} className="contact-card">
                <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <span className="contact-card-icon"><c.icon size={22} /></span>
                  <h3>{c.title}</h3>
                  {c.lines.map((l, j) => <p key={j}>{l}</p>)}
                </a>
              </Reveal>
            ))}
          </div>

          <div className="contact-grid">
            <Reveal dir="right" className="contact-form-wrap">
              <h2>{xtra.enquiryHeading || 'Send an Enquiry'}</h2>
              <p className="contact-sub">{xtra.enquirySub || 'We reply within 2 working hours, usually faster.'}</p>
              {sent ? (
                <div className="enq-success big">
                  <span className="enq-check"><IconCheck size={26} /></span>
                  <h3>Dhanyavaad, {form.name.split(' ')[0] || 'friend'}!</h3>
                  <p>Your enquiry is with our team. Expect a call from us shortly.</p>
                </div>
              ) : (
                <form onSubmit={submit} className="enq-form">
                  <div className="form-row">
                    <input required placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input required placeholder="Phone number *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <input placeholder="Email (optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <textarea rows={5} placeholder="I am looking for…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  {err && <p className="form-err">{err}</p>}
                  <button className="btn btn-gold btn-lg" type="submit">Send Enquiry <IconSend size={16} /></button>
                </form>
              )}
            </Reveal>

            <Reveal dir="left" delay={120} className="contact-info">
              <h2>{xtra.officeHoursHeading || 'Office Hours'}</h2>
              <p><IconClock size={17} /> {contact.hours || 'Mon – Sat, 9:30 AM – 7:00 PM'}</p>
              <h2>{xtra.visitHeading || 'Visit Us'}</h2>
              <p><IconPin size={17} /> {contact.address || ''}</p>
              <div className="contact-map">
                <svg viewBox="0 0 400 220" aria-hidden="true">
                  <rect width="400" height="220" fill="#e9dfc8" />
                  {[...Array(14)].map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={i * 16 + 8} x2="400" y2={i * 16 + 8} stroke="#d9cbaa" strokeWidth="1" />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <line key={`v${i}`} x1={i * 21 + 5} y1="0" x2={i * 21 + 5} y2="220" stroke="#d9cbaa" strokeWidth="1" />
                  ))}
                  <path d="M60 170 C 120 150, 180 160, 260 130 S 380 100, 400 95" stroke="#e0a24b" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <circle cx="252" cy="118" r="14" fill="#0f4c43" />
                  <circle cx="252" cy="118" r="5" fill="#f2a43b" />
                  <text x="252" y="98" textAnchor="middle" fontSize="11" fill="#0f4c43" fontWeight="700" fontFamily="Poppins, sans-serif">GURUKRIPA ESTATE</text>
                  <text x="252" y="150" textAnchor="middle" fontSize="10" fill="#7a5c2e" fontFamily="Poppins, sans-serif">Mansarovar, Jaipur</text>
                </svg>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
