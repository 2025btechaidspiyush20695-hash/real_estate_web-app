import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import WhatsAppFloat from './components/WhatsAppFloat';
import Home from './pages/Home';
import Properties from './pages/Properties';
import FindHome from './pages/FindHome';
import PropertyDetail from './pages/PropertyDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { useSite } from './SiteContext';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // NOTE: braces are important — window.scrollTo() can return a Promise
    // in modern Chrome/Edge, and React would treat it as an effect cleanup
    // function ("destroy is not a function" -> white screen crash).
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

/** Catches any unexpected render crash and shows a friendly message
 *  instead of a blank white screen. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[site] render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a352f', color: '#faf5ea', fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 44 }}>🏠</div>
            <h1 style={{ fontFamily: "'Playfair', serif", fontSize: 26, margin: '14px 0 8px' }}>Oops! Kuch gadbad ho gayi</h1>
            <p style={{ opacity: 0.8, fontSize: 14 }}>The page hit an unexpected error. Please reload — or check that the backend (API on :5000) is running.</p>
            <p style={{ background: 'rgba(255,255,255,.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12, wordBreak: 'break-word', margin: '14px 0 20px' }}>
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#e8730f', color: '#fff', border: 0, borderRadius: 999, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { blocks, loading } = useSite();
  const seo = blocks.seo || {};
  useEffect(() => {
    document.title = seo.title || 'Gurukripa Estate';
    const meta = document.querySelector('meta[name="description"]');
    if (meta && seo.description) meta.setAttribute('content', seo.description);
  }, [seo]);

  /* Daily visit tracking — 1 visit per device per day (server dedupes) */
  useEffect(() => {
    try {
      let deviceId = localStorage.getItem('gk_device_id');
      if (!deviceId) {
        deviceId = (crypto.randomUUID ? crypto.randomUUID() : 'd-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem('gk_device_id', deviceId);
      }
      fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, path: window.location.pathname }),
      }).catch(() => {});
    } catch (e) { /* tracking must never break the site */ }
  }, []);

  if (loading) {
    return (
      <div className="boot">
        <div className="boot-mark">
          <img src="/logo.png" alt="Gurukripa Estate" width="72" height="72" style={{ borderRadius: 16 }} />
        </div>
        <p className="boot-text">गुरुकृपा एस्टेट</p>
        <div className="boot-bar"><span /></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="site">
        <ScrollToTop />
        <ScrollProgress />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/find-a-home" element={<FindHome />} />
            <Route path="/properties/:slug" element={<PropertyDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <BackToTop />
        <WhatsAppFloat />
      </div>
    </ErrorBoundary>
  );
}
