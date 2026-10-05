import React, { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import Reveal from '../components/Reveal';
import { useSite } from '../SiteContext';
import { postEnquiry } from '../api';
import CustomSelect from '../components/CustomSelect';
import { IconCheck, IconPhone, IconWhatsapp, IconSend, IconShield } from '../icons';

const TYPES = ['House', 'Villa', 'Apartment', 'Plot', 'Commercial'];
const BUDGETS = ['Under ₹50 Lakh', '₹50 Lakh – ₹1 Cr', '₹1 – 2 Cr', '₹2 – 3 Cr', '₹3 Cr+'];
const BEDROOMS = ['1', '2', '3', '4', '5+'];
const TIMELINES = ['Immediately', '1–3 Months', '3–6 Months', 'Just Exploring'];

export default function FindHome() {
  const { blocks } = useSite();
  const f = blocks.finder || {};
  const contact = blocks.contact || {};
  const [meta, setMeta] = useState({ cities: [] });

  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [timeline, setTimeline] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/properties/meta').then((r) => r.json()).then((d) => setMeta(d)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!type) return setErr('Property type choose karein');
    if (!city) return setErr('City/location select karein');
    if (!budget) return setErr('Budget select karein');
    setBusy(true);
    try {
      await postEnquiry({
        name, phone, whatsapp,
        message: `Find-a-Home requirement: ${type} in ${city}, budget ${budget}, ${bedrooms} BHK, timeline: ${timeline}`,
        requirementType: type,
        requirementCity: city,
        budget,
        bedrooms,
        timeline,
      });
      setSent(true);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const trust = f.sideTrust?.length ? f.sideTrust : ['Verified properties', 'Local Jaipur expertise', 'Transparent pricing', 'Personal assistance'];

  return (
    <>
      <PageHero
        eyebrow={f.eyebrow || 'Personal Property Finder'}
        title={f.title || 'Apna Perfect Ghar Dhoondhiye'}
        sub={f.sub || 'Aapki zaroorat humein batayein, hum suitable properties shortlist karenge.'}
      />

      <section className="section finder-page">
        <div className="container finder-grid">
          {/* ============ LEFT: FORM ============ */}
          <Reveal className="finder-form-card">
            <h2>{f.formTitle || 'Aap kya dhoondh rahe hain?'}</h2>

            {sent ? (
              <div className="enq-success big">
                <span className="enq-check"><IconCheck size={26} /></span>
                <h3>{f.successTitle || 'Dhanyavaad!'}</h3>
                <p>{f.successText || 'Aapki requirement mil gayi. Humari team jald hi contact karegi.'}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="finder-form">
                {/* Property type chips */}
                <div className="finder-field">
                  <span className="finder-label">{f.typeLabel || 'Property type'}</span>
                  <div className="finder-chips">
                    {TYPES.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={`finder-chip ${type === t ? 'on' : ''}`}
                        onClick={() => setType(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City */}
                <div className="finder-field">
                  <span className="finder-label">{f.cityLabel || 'Kahan chahiye?'}</span>
                  <CustomSelect
                    value={city}
                    onChange={setCity}
                    placeholder="Select city / area"
                    options={[{ value: '', label: 'Select city / area' }, ...(meta.cities || []).map((c) => ({ value: c, label: c }))]}
                  />
                </div>

                {/* Budget */}
                <div className="finder-field">
                  <span className="finder-label">{f.budgetLabel || 'Aapka budget?'}</span>
                  <CustomSelect
                    value={budget}
                    onChange={setBudget}
                    placeholder="Select budget"
                    options={[{ value: '', label: 'Select budget' }, ...BUDGETS.map((b) => ({ value: b, label: b }))]}
                  />
                </div>

                {/* Bedrooms */}
                <div className="finder-field">
                  <span className="finder-label">{f.bedroomsLabel || 'Kitne bedrooms?'}</span>
                  <div className="finder-chips">
                    {BEDROOMS.map((b) => (
                      <button
                        type="button"
                        key={b}
                        className={`finder-chip ${bedrooms === b ? 'on' : ''}`}
                        onClick={() => setBedrooms(b)}
                      >
                        {b} {b !== '5+' ? 'BHK' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="finder-field">
                  <span className="finder-label">{f.timelineLabel || 'Kab tak lena hai?'}</span>
                  <div className="finder-chips">
                    {TIMELINES.map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={`finder-chip ${timeline === t ? 'on' : ''}`}
                        onClick={() => setTimeline(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="finder-divider"><span>Aapki details</span></div>

                <div className="finder-field">
                  <span className="finder-label">{f.nameLabel || 'Aapka naam'}</span>
                  <input className="a-input-lite" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rakesh Sharma" />
                </div>
                <div className="finder-field">
                  <span className="finder-label">{f.phoneLabel || 'Phone number'}</span>
                  <input className="a-input-lite" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
                </div>
                <div className="finder-field">
                  <span className="finder-label">{f.whatsappLabel || 'WhatsApp number (optional)'}</span>
                  <input className="a-input-lite" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Same phone se call/WhatsApp karein" />
                </div>

                {err && <p className="form-err">{err}</p>}

                <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
                  {busy ? 'Sending…' : (f.submitLabel || 'Find My Home')} {!busy && <IconSend size={16} />}
                </button>
                <p className="finder-note">🔒 Aapki details sirf humare advisor tak jaati hain — kabhi share nahi hoti.</p>
              </form>
            )}
          </Reveal>

          {/* ============ RIGHT: IMAGE + TRUST ============ */}
          <div className="finder-side">
            <Reveal dir="left" className="finder-img-card">
              <img src={f.image || '/uploads/seed/hero.jpg'} alt="Gurukripa Estate" />
            </Reveal>

            <Reveal dir="left" delay={120} className="finder-trust-card">
              <h3>{f.sideTitle || "Can't find what you're looking for?"}</h3>
              <p>{f.sideText || 'Tell us what you need. Our property advisor will personally help you find suitable options.'}</p>
              <ul>
                {trust.map((t, i) => (
                  <li key={i}><IconCheck size={15} /> {t}</li>
                ))}
              </ul>
            </Reveal>

            <Reveal dir="left" delay={200} className="finder-help-card">
              <h3>{f.helpTitle || 'Need help now?'}</h3>
              {contact.phone && (
                <a className="finder-help-link" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
                  <IconPhone size={17} /> {contact.phone}
                </a>
              )}
              {contact.whatsapp && (
                <a
                  className="finder-help-link wa"
                  href={`https://wa.me/${String(contact.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent("Hello! I need help finding a property.")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <IconWhatsapp size={17} /> WhatsApp Us
                </a>
              )}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
