import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api, getToken } from './api';

/**
 * Notifications provider — real-time "New enquiry received" alerts.
 *
 *  - Connects to the server's SSE stream (instant push, no polling delay)
 *  - 30s polling fallback (re-syncs badge if the stream drops)
 *  - Shows a browser Notification + plays a soft chime when a new
 *    enquiry arrives
 */

const NotifCtx = createContext(null);

function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch (e) {
    /* audio not available — ignore */
  }
}

export function NotificationsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [perm, setPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [live, setLive] = useState(false);
  const soundRef = useRef(true);
  soundRef.current = soundOn;
  // Dedupe guard — React StrictMode (dev) mounts effects twice, which would
  // otherwise connect two SSE streams and push the same notification twice.
  const seenIds = useRef(new Set());

  // ---------- refresh (poll fallback + manual) ----------
  const refresh = useCallback(async () => {
    try {
      const d = await api.getNotifications();
      setItems(d.items);
      setUnread(d.unread);
      seenIds.current = new Set(d.items.map((i) => i._id));
    } catch (e) {
      /* ignore */
    }
  }, []);

  // ---------- handle a pushed notification ----------
  const onNew = useCallback((n) => {
    if (seenIds.current.has(n._id)) return; // already have it
    seenIds.current.add(n._id);
    setItems((prev) => [n, ...prev].slice(0, 50));
    setUnread((u) => u + 1);
    if (soundRef.current) playChime();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🏠 Gurukripa Estate — New enquiry received', {
          body: n.message || 'Kisi ne enquiry bheji hai!',
          tag: 'gurukripa-new-enquiry',
        });
      } catch (e) {
        /* ignore */
      }
    }
  }, []);

  // ---------- SSE stream (real-time) ----------
  useEffect(() => {
    let controller = null;
    let stopped = false;

    async function connect() {
      controller = new AbortController();
      try {
        const res = await api.notificationStream(getToken());
        if (!res.ok || !res.body) throw new Error('stream failed');
        setLive(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf('\n\n')) !== -1) {
            const raw = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const evM = raw.match(/^event: (.+)$/m);
            const dtM = raw.match(/^data: (.+)$/m);
            if (evM && dtM) {
              try {
                const ev = evM[1];
                const data = JSON.parse(dtM[1]);
                if (ev === 'init') {
                  setItems(data.items || []);
                  setUnread(data.unread || 0);
                  seenIds.current = new Set((data.items || []).map((i) => i._id));
                } else if (ev === 'new-enquiry') {
                  onNew(data);
                }
              } catch (e) {
                /* malformed frame — skip */
              }
            }
          }
        }
      } catch (e) {
        /* stream dropped */
      }
      setLive(false);
      if (!stopped) setTimeout(connect, 3000); // auto-reconnect
    }

    connect();
    return () => {
      stopped = true;
      controller?.abort();
    };
  }, [onNew]);

  // ---------- polling fallback every 30s ----------
  useEffect(() => {
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  // ---------- actions ----------
  const markAll = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    } catch (e) {
      /* ignore */
    }
  }, []);

  const markOne = useCallback(async (id) => {
    try {
      await api.markNotificationRead(id);
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, read: true } : i)));
    } catch (e) {
      /* ignore */
    }
  }, []);

  const requestPermission = useCallback(() => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((p) => setPerm(p));
  }, []);

  return (
    <NotifCtx.Provider
      value={{ items, unread, live, soundOn, setSoundOn, perm, requestPermission, markAll, markOne, refresh }}
    >
      {children}
    </NotifCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotifCtx);
