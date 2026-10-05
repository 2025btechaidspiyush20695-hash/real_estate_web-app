import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtINR, fmtDate, fmtTime } from '../api';
import { useNotifications } from '../notifications';
import { useAuth } from '../auth';
import {
  IconHome, IconEye, IconInbox, IconSparkle, IconPlus, IconArrowRight, IconUser,
  IconCalendar, IconChart, IconLayout, IconPhone,
} from '../icons';

function StatCard({ icon: Ic, label, value, tone, sub }) {
  return (
    <div className="a-stat">
      <span className={`a-stat-icon ${tone}`}><Ic size={22} /></span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

/* SVG line chart — smooth animated curve, gradient area, hover tooltip & crosshair */
function LineChart({ data = [], height = 190, color = '#1a56db' }) {
  const W = 640, H = 190, PAD = { t: 20, r: 14, b: 30, l: 30 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [drawn, setDrawn] = useState(false);

  // re-run draw animation whenever data changes
  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 150);
    return () => clearTimeout(t);
  }, [data]);

  if (!data.length) return <p className="a-muted">Abhi koi data nahi.</p>;

  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const px = (i) => (n === 1 ? PAD.l + iw / 2 : PAD.l + (i / (n - 1)) * iw);
  const py = (v) => PAD.t + ih - (v / max) * ih;

  // smooth bezier curve (Catmull-Rom -> cubic)
  let linePath = '';
  if (n > 1) {
    let d = `M ${px(0)} ${py(data[0].value)}`;
    for (let i = 0; i < n - 1; i++) {
      const v0 = data[Math.max(0, i - 1)].value;
      const v1 = data[i].value;
      const v2 = data[i + 1].value;
      const v3 = data[Math.min(n - 1, i + 2)].value;
      const c1x = px(i) + (px(i + 1) - px(Math.max(0, i - 1))) / 6;
      const c1y = py(v1) + (py(v2) - py(v0)) / 6;
      const c2x = px(i + 1) - (px(Math.min(n - 1, i + 2)) - px(i)) / 6;
      const c2y = py(v2) - (py(v3) - py(v1)) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${px(i + 1).toFixed(2)} ${py(v2).toFixed(2)}`;
    }
    linePath = d;
  }
  const areaPath = n > 1 ? `${linePath} L ${px(n - 1)} ${PAD.t + ih} L ${px(0)} ${PAD.t + ih} Z` : '';
  const gid = 'lc' + String(color).replace(/[^a-zA-Z0-9]/g, '');
  const lineLen = 1500;

  const onMove = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((x - PAD.l) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const hv = hover != null ? data[hover] : null;

  return (
    <div className="a-line-chart" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
        <defs>
          <linearGradient id={`${gid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + ih * (1 - f)} y2={PAD.t + ih * (1 - f)} stroke="#e6eaf0" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* hover crosshair + tooltip */}
        {hv && hover != null && (
          <g className="lc-hover">
            <line x1={px(hover)} x2={px(hover)} y1={PAD.t} y2={PAD.t + ih} stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.45" />
            <circle cx={px(hover)} cy={py(hv.value)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
            <g transform={`translate(${Math.min(Math.max(px(hover) - 34, 4), W - 76)}, ${Math.max(py(hv.value) - 34, 2)})`}>
              <rect width="68" height="26" rx="7" fill="#0f1e3d" />
              <text x="34" y="17.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{hv.value}</text>
            </g>
          </g>
        )}
        {/* gradient area (fades in after line) */}
        {areaPath && <path d={areaPath} fill={`url(#${gid}-area)`} style={{ opacity: drawn ? 1 : 0, transition: 'opacity .9s ease .5s' }} />}
        {/* animated line draw */}
        {linePath && (
          <path className="lc-line" d={linePath} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: lineLen, strokeDashoffset: drawn ? 0 : lineLen, transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1) .15s' }} />
        )}
        {/* dots pop-in + value labels (only when few points) */}
        {data.map((d, i) => (
          <g key={i} className="lc-dot" style={{ animationDelay: `${0.2 + (i / n) * 1.15}s` }}>
            <circle cx={px(i)} cy={py(d.value)} r="3.6" fill="#fff" stroke={color} strokeWidth="2" />
            {n <= 8 && (
              <text x={px(i)} y={py(d.value) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">{d.value}</text>
            )}
          </g>
        ))}
        {/* x labels — dates: all if <= 8, else every 2nd (step keeps labels readable) */}
        {data.map((d, i) => {
          const step = n > 12 ? 2 : 1;
          if (i % step !== 0 && i !== n - 1) return null;
          return (
            <text key={'l' + i} x={px(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10.5" fontWeight="600" fill="#64748b">{d.label}</text>
          );
        })}
      </svg>
    </div>
  );
}

const PIPELINE_LABEL = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  site_visit: 'Site Visit', negotiation: 'Negotiation', closed: 'Closed',
};

export default function Dashboard() {
  const notifs = useNotifications();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [enqs, setEnqs] = useState([]);
  const [visits, setVisits] = useState([]);
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getProperties({ sort: 'newest', limit: 6 }).then((d) => setRecent(d.items)).catch(() => {});
    api.getEnquiries({}).then((d) => setEnqs(d.items)).catch(() => {});
    api.getSiteVisits({}).then((d) => setVisits(d.items)).catch(() => {});
    api.getDailyVisits(14).then(setDaily).catch(() => {});
  }, []);

  if (!stats) return <div className="a-page"><div className="a-spinner" /></div>;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.name || 'Admin').split(' ')[0];

  const totalEnq = stats.enquiries.reduce((a, b) => a + b.count, 0);
  const newEnq = (stats.enquiries.find((e) => e._id === 'new') || {}).count || 0;
  const todayVisits = visits.filter((v) => {
    const d = new Date(v.date);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });
  const followUps = enqs
    .filter((e) => e.nextFollowUp && e.status !== 'closed')
    .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp))
    .slice(0, 5);

  return (
    <div className="a-page">
      {/* Greeting + quick actions */}
      <div className="a-dash-head">
        <div>
          <h1>{greet}, {firstName} 👋</h1>
          <p>Here's what's happening with your property business today.</p>
        </div>
        <div className="a-dash-actions">
          <Link to="/properties/new" className="a-btn gold"><IconPlus size={16} /> Add Property</Link>
          <Link to="/visits" className="a-btn ghost"><IconCalendar size={16} /> Schedule Visit</Link>
          <Link to="/content" className="a-btn ghost"><IconLayout size={16} /> Edit Website</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="a-stats">
        <StatCard icon={IconHome} label="Total Properties" value={stats.properties} tone="teal" sub={`${stats.featured} featured`} />
        <StatCard icon={IconEye} label="Total Views" value={stats.views.toLocaleString('en-IN')} tone="gold" sub="across all listings" />
        <StatCard icon={IconInbox} label="New Enquiries" value={newEnq} tone="maroon" sub={`${totalEnq} total leads`} />
        <StatCard icon={IconCalendar} label="Visits Today" value={todayVisits.length} tone="cream" sub={`${stats.followUpsDue} follow-ups due`} />
      </div>

      {/* Charts row — side by side */}
      <div className="a-cols charts">
        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Property Performance (views)</h2>
            <Link to="/analytics" className="a-link">Analytics <IconArrowRight size={14} /></Link>
          </div>
          <LineChart
            data={[...recent].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-6).map((p) => ({
              label: String(p.title || 'Property').split(' ').slice(0, 2).join(' ').slice(0, 14),
              value: p.views,
            }))}
            color="#1a56db"
          />
          <div className="a-mini-stats">
            <span><b>{stats.byStatus.find((s) => s._id === 'sale')?.count || 0}</b> for sale</span>
            <span><b>{stats.byStatus.find((s) => s._id === 'rent')?.count || 0}</b> for rent</span>
            <span><b>{stats.byCity.length}</b> cities</span>
          </div>
        </div>

        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Daily Website Visits</h2>
            <span className="a-muted" style={{ fontSize: '.72rem' }}>1 device = 1 visit per day</span>
          </div>
          {daily ? (
            <div>
              <LineChart
                data={daily.days.map((d) => ({
                  label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                  value: d.count,
                }))}
                color="#0e7490"
              />
              <div className="a-mini-stats">
                <span><b>{daily.today}</b> visits today</span>
                <span><b>{daily.total}</b> in last {daily.days.length} days</span>
                <span><b>Unique</b> devices</span>
              </div>
            </div>
          ) : (
            <p className="a-muted">Loading daily visits…</p>
          )}
        </div>
      </div>

      {/* CRM row — enquiries + follow-ups */}
      <div className="a-cols">
        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Recent Enquiries</h2>
            <Link to="/enquiries" className="a-link">All leads <IconArrowRight size={14} /></Link>
          </div>
          <div className="a-enq-list">
            {enqs.slice(0, 5).map((e) => (
              <div className="a-enq-row" key={e._id}>
                <span className="a-enq-av">{String(e.name).charAt(0)}</span>
                <span className="a-enq-info">
                  <strong>{e.name} <Badge tone={e.status === 'new' ? 'warn' : e.status === 'closed' ? 'ok' : 'neutral'}>{PIPELINE_LABEL[e.status] || e.status}</Badge></strong>
                  <small>{e.propertyTitle || (e.requirementType ? `${e.requirementType} in ${e.requirementCity}` : 'General enquiry')} · {fmtTime(e.createdAt)}</small>
                </span>
              </div>
            ))}
            {enqs.length === 0 && <p className="a-muted">Nayi enquiries yahan dikhengi.</p>}
          </div>
        </div>

        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Follow-ups Due</h2>
            <Link to="/enquiries" className="a-link">Manage <IconArrowRight size={14} /></Link>
          </div>
          {followUps.length === 0 ? (
            <p className="a-muted">Koi pending follow-up nahi — sab clear! 🎉</p>
          ) : (
            <div className="a-followups">
              {followUps.map((e) => {
                const d = new Date(e.nextFollowUp);
                const today = new Date();
                const isToday = d.toDateString() === today.toDateString();
                const urgent = isToday || d < today;
                return (
                  <div className={`a-followup ${urgent ? 'urgent' : ''}`} key={e._id}>
                    <span className="a-followup-dot" />
                    <span className="a-followup-info">
                      <strong>{e.name}</strong>
                      <small>{e.propertyTitle || e.requirementType || 'Lead'}</small>
                    </span>
                    <span className="a-followup-date">
                      {isToday ? 'Today' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      <small>{fmtTime(d)}</small>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Upcoming Site Visits</h2>
            <Link to="/visits" className="a-link">Schedule <IconArrowRight size={14} /></Link>
          </div>
          {visits.filter((v) => v.status !== 'cancelled' && new Date(v.date) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 4).length === 0 ? (
            <p className="a-muted">Koi upcoming site visit nahi.</p>
          ) : (
            <div className="a-visits-mini">
              {visits.filter((v) => v.status !== 'cancelled' && new Date(v.date) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 4).map((v) => (
                <div className="a-visit-mini" key={v._id}>
                  <span className="a-visit-time">{v.time}</span>
                  <span className="a-visit-info">
                    <strong>{v.leadName}</strong>
                    <small>{v.propertyTitle}</small>
                  </span>
                  <Badge tone={v.status === 'confirmed' ? 'ok' : 'neutral'}>{v.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest notifications + recent properties */}
      <div className="a-cols">
        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Recent Properties</h2>
            <Link to="/properties" className="a-link">View all <IconArrowRight size={14} /></Link>
          </div>
          <div className="a-recent">
            {recent.map((p) => (
              <Link to={`/properties/${p._id}/edit`} className="a-recent-item" key={p._id}>
                <img src={p.images?.[0] || '/uploads/seed/hero.jpg'} alt="" />
                <span className="a-recent-info">
                  <strong>{p.title}</strong>
                  <small>{p.city} · {p.bedrooms} BHK · {fmtINR(p.price)}</small>
                </span>
                {p.featured && <IconSparkle size={15} className="feat" />}
              </Link>
            ))}
          </div>
        </div>

        <div className="a-panel">
          <div className="a-panel-head">
            <h2>Latest Notifications</h2>
            <span className="a-notif-live"><i className={notifs.live ? 'on' : ''} /> {notifs.live ? 'Live' : 'Reconnecting…'}</span>
          </div>
          {notifs.items.length === 0 ? (
            <p className="a-muted">Abhi koi notification nahi.</p>
          ) : (
            <div className="a-notif-dash">
              {notifs.items.slice(0, 5).map((n) => (
                <div key={n._id} className={`a-notif-dash-item ${n.read ? '' : 'unread'}`}>
                  <span className="a-notif-dot" />
                  <span>
                    <strong>{n.title}</strong>
                    <small>{n.message}</small>
                    <em>{fmtDate(n.createdAt)}</em>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  return <span className={`a-badge ${tone}`}>{children}</span>;
}
