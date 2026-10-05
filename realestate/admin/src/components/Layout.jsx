import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { NotificationsProvider } from '../notifications';
import NotificationsBell from './NotificationsBell';
import {
  IconGrid, IconLayout, IconHome, IconPlus, IconInbox, IconSettings, IconLogout,
  IconExternal, IconMenu, IconX, IconUser, IconCheck, IconAlert, IconEye,
  IconChart, IconCalendar, IconBuilding,
} from '../icons';

export const ToastCtx = React.createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (msg, type = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="a-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast ${t.type}`}>
            {t.type === 'ok' ? <IconCheck size={15} /> : <IconAlert size={15} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* Grouped navigation — professional real-estate CRM structure */
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: IconGrid, end: true }],
  },
  {
    label: 'Properties',
    items: [
      { to: '/properties', label: 'Properties', icon: IconBuilding },
      { to: '/properties/new', label: 'Add Property', icon: IconPlus },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/enquiries', label: 'Leads & Enquiries', icon: IconInbox },
      { to: '/visits', label: 'Site Visits', icon: IconCalendar },
    ],
  },
  {
    label: 'Website',
    items: [{ to: '/content', label: 'Website / CMS', icon: IconLayout }],
  },
  {
    label: 'Insights',
    items: [{ to: '/analytics', label: 'Analytics', icon: IconChart }],
  },
  {
    label: 'System',
    items: [
      { to: '/audit', label: 'Activity Log', icon: IconEye },
      { to: '/settings', label: 'Settings', icon: IconSettings },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <NotificationsProvider>
    <ToastProvider>
      <div className={`a-shell ${sideOpen ? 'side-open' : ''}`}>
        <aside className="a-side">
          <Link to="/" className="a-brand" onClick={() => setSideOpen(false)}>
            <span className="a-brand-mark">
              <img src="/logo.png" alt="Gurukripa Estate logo" width="36" height="36" style={{ borderRadius: 8 }} />
            </span>
            <span className="a-brand-text">
              <strong>GURUKRIPA</strong>
              <small>ESTATE · ADMIN</small>
            </span>
          </Link>

          <nav className="a-nav">
            {NAV_GROUPS.map((group) => (
              <div className="a-nav-group" key={group.label}>
                <span className="a-nav-group-label">{group.label}</span>
                {group.items.map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setSideOpen(false)}>
                    <n.icon size={17} />
                    {n.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="a-side-foot">
            <div className="a-user-chip">
              <span className="a-user-avatar">{initial}</span>
              <span className="a-user-info">
                <strong>{user?.name || 'Admin'}</strong>
                <small>Owner</small>
              </span>
            </div>
            <a className="a-side-link" href={import.meta.env.DEV ? 'http://localhost:5173' : '/'} target="_blank" rel="noreferrer">
              <IconExternal size={16} /> View Website
            </a>
            <button className="a-side-link" onClick={doLogout}>
              <IconLogout size={16} /> Logout
            </button>
          </div>
        </aside>

        {sideOpen && <div className="a-side-veil" onClick={() => setSideOpen(false)} />}

        <div className="a-main">
          <header className="a-top">
            <button className="a-burger" onClick={() => setSideOpen(!sideOpen)}>
              {sideOpen ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
            <div className="a-top-title">Gurukripa Estate · Control Room</div>
            <NotificationsBell />
            <div className="a-top-user">
              <span className="a-avatar">{initial}</span>
              <span className="a-top-user-name">{user?.name || 'Admin'}</span>
            </div>
          </header>
          <main className="a-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
    </NotificationsProvider>
  );
}
