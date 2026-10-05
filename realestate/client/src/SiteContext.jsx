import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSite } from './api';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [site, setSite] = useState(null); // { blocks, stats }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (silent = true) => {
    try {
      const data = await getSite();
      setSite(data);
      setError(null);
    } catch (e) {
      setError(e.message);
      if (!silent) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    // Startup par API ready hone me 5-8s lag sakte hain (DB connect).
    // "ECONNREFUSED" na dikhe — jab tak API up na ho, retry karte raho.
    let attempts = 0;
    let timer = null;
    const tryLoad = async () => {
      try {
        const data = await getSite();
        setSite(data);        // ← YEH LINE ADD KARO (pehle missing thi)
        setLoading(false);
        setError(null);
        return true;
        } catch (e) {
          attempts++;
          if (attempts >= 6) {
            setLoading(false);
            setError(e.message);
            return false;
          }
        // API abhi up nahi — 2s baad dobara try
        timer = setTimeout(tryLoad, 2000);
        return false;
      }
    };
    tryLoad();

    // Live refresh: any change made in the admin panel appears on the site
    // within ~60s, or instantly when the tab regains focus.
    const id = setInterval(() => refresh(true), 60000);
    const onFocus = () => refresh(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const blocks = site?.blocks || {};
  const b = (key, fallback) => blocks[key] ?? fallback ?? {};

  return (
    <SiteContext.Provider value={{ site, blocks, b, loading, error, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);
