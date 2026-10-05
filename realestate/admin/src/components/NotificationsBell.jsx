import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../notifications';
import { fmtDate } from '../api';
import { IconBell, IconCheck, IconInbox, IconX } from '../icons';

/**
 * Bell button + dropdown in the admin topbar.
 * Shows unread badge, latest notifications, mark-all-read,
 * sound toggle and browser-notification permission request.
 */
export default function NotificationsBell() {
  const { items, unread, live, soundOn, setSoundOn, perm, requestPermission, markAll, markOne } = useNotifications();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  // close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openItem = (n) => {
    setOpen(false);
    if (!n.read) markOne(n._id);
    navigate('/enquiries');
  };

  return (
    <div className="a-bell-wrap" ref={boxRef}>
      <button
        className={`a-bell ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unread} unread)`}
      >
        <IconBell size={19} />
        {unread > 0 && <span className="a-bell-badge">{unread > 99 ? '99+' : unread}</span>}
        <i className={`a-bell-live ${live ? 'on' : ''}`} title={live ? 'Live' : 'Reconnecting…'} />
      </button>

      {open && (
        <div className="a-notif-pop">
          <div className="a-notif-head">
            <strong>Notifications</strong>
            <span className="a-notif-live">
              <i className={live ? 'on' : ''} /> {live ? 'Live' : 'Reconnecting…'}
            </span>
            {unread > 0 && (
              <button className="a-notif-markall" onClick={markAll}>
                <IconCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="a-notif-list">
            {items.length === 0 ? (
              <p className="a-notif-empty">Abhi koi notification nahi — jai hi enquiry aayegi, yahan dikhegi.</p>
            ) : (
              items.slice(0, 12).map((n) => (
                <button key={n._id} className={`a-notif-item ${n.read ? '' : 'unread'}`} onClick={() => openItem(n)}>
                  <span className="a-notif-dot" />
                  <span className="a-notif-body">
                    <strong>🔔 {n.title}</strong>
                    <small>{n.message}</small>
                    <em>{fmtDate(n.createdAt)}</em>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="a-notif-foot">
            <label className="a-notif-toggle">
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => setSoundOn(e.target.checked)}
              />
              Sound
            </label>
            {typeof Notification !== 'undefined' && perm === 'default' && (
              <button className="a-notif-perm" onClick={requestPermission}>
                Enable desktop notifications
              </button>
            )}
            {perm === 'denied' && (
              <span className="a-notif-perm denied" title="Browser settings me allow karo">
                <IconX size={11} /> Desktop alerts blocked
              </span>
            )}
            <button className="a-notif-inbox" onClick={() => { setOpen(false); navigate('/enquiries'); }}>
              <IconInbox size={13} /> Open inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
