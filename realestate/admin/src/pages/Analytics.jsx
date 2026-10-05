import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtINR } from '../api';
import { Spinner } from '../components/UI';
import { IconEye, IconInbox, IconCalendar, IconCheck } from '../icons';

const FUNNEL_STEPS = [
  { key: 'visitors', label: 'Visitors', icon: IconEye, color: '#8a93a3' },
  { key: 'propertyViews', label: 'Property Views', icon: IconEye, color: '#0e7490' },
  { key: 'enquiries', label: 'Enquiries', icon: IconInbox, color: '#1a56db' },
  { key: 'siteVisits', label: 'Site Visits', icon: IconCalendar, color: '#d97706' },
  { key: 'negotiations', label: 'Negotiations', icon: IconCheck, color: '#7d2432' },
  { key: 'closed', label: 'Closed', icon: IconCheck, color: '#15803d' },
];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(() => {});
  }, []);

  if (!data) return <div className="a-page"><Spinner /></div>;

  const maxFunnel = Math.max(1, data.funnel.visitors);

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Analytics</h1>
          <p>Website traffic, property performance aur conversion funnel — ek jagah.</p>
        </div>
      </div>

      {/* funnel */}
      <div className="a-panel">
        <div className="a-panel-head"><h2>Conversion Funnel</h2></div>
        <div className="a-funnel">
          {FUNNEL_STEPS.map((s, i) => {
            const val = data.funnel[s.key] || 0;
            const pct = Math.max(4, (val / maxFunnel) * 100);
            const conv = i > 0 ? Math.round((val / Math.max(1, data.funnel[FUNNEL_STEPS[i - 1].key])) * 100) : 100;
            return (
              <div className="a-funnel-step" key={s.key}>
                <span className="a-funnel-bar" style={{ width: `${pct}%`, background: s.color }}>
                  <s.icon size={13} /> {val}
                </span>
                <span className="a-funnel-label">{s.label} {i > 0 && <em>{conv}%</em>}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* most viewed */}
      <div className="a-panel">
        <div className="a-panel-head"><h2>Most Viewed Properties</h2></div>
        <div className="a-bars">
          {data.mostViewed.map((p, i) => (
            <div className="a-bar" key={p._id}>
              <span className="a-bar-label">{i + 1}. {p.city}</span>
              <div className="a-bar-track">
                <i style={{ width: `${Math.max(8, (p.views / Math.max(1, data.mostViewed[0].views)) * 100)}%` }} />
              </div>
              <span className="a-bar-val">{p.views}</span>
            </div>
          ))}
          {data.mostViewed.length === 0 && <p className="a-muted">Abhi views nahi — jab visitors website kholenge tab yahan dikhenge.</p>}
        </div>
      </div>

      {/* stats */}
      <div className="a-stats">
        <div className="a-stat"><span className="a-stat-icon teal"><IconEye size={20} /></span>
          <div><strong>{data.totalViews.toLocaleString('en-IN')}</strong><span>Total Views</span></div></div>
        <div className="a-stat"><span className="a-stat-icon gold"><IconEye size={20} /></span>
          <div><strong>{data.avgViewsPerProperty}</strong><span>Avg Views / Property</span></div></div>
        <div className="a-stat"><span className="a-stat-icon maroon"><IconInbox size={20} /></span>
          <div><strong>{data.funnel.enquiries}</strong><span>Total Enquiries</span></div></div>
        <div className="a-stat"><span className="a-stat-icon cream"><IconCalendar size={20} /></span>
          <div><strong>{data.funnel.closed}</strong><span>Deals Closed</span></div></div>
      </div>
    </div>
  );
}
