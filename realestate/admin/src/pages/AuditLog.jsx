import React, { useEffect, useState } from 'react';
import { api, fmtDate } from '../api';
import { useToast, Empty, Badge, Spinner } from '../components/UI';
import { IconSearch } from '../icons';
import CustomSelect from '../components/CustomSelect';

const ACTION_LABELS = {
  'login.success': { l: 'Login success', t: 'ok' },
  'login.failed': { l: 'Login failed', t: 'warn' },
  'login.locked': { l: 'Account locked', t: 'err' },
  'login.2fa_ok': { l: '2FA verified', t: 'ok' },
  'login.2fa_failed': { l: '2FA failed', t: 'warn' },
  'password.changed': { l: 'Password changed', t: 'ok' },
  'password.reset_otp': { l: 'Password reset (OTP)', t: 'ok' },
  'password.reset_link': { l: 'Password reset (link)', t: 'ok' },
  'otp.verified': { l: 'OTP verified', t: 'ok' },
  'forgot.requested': { l: 'Reset requested', t: 'neutral' },
  'ownership.transferred': { l: 'Ownership transferred', t: 'err' },
  '2fa.enabled': { l: '2FA enabled', t: 'ok' },
  '2fa.disabled': { l: '2FA disabled', t: 'warn' },
  '2fa.enable_failed': { l: '2FA enable failed', t: 'err' },
  '2fa.disable_failed': { l: '2FA disable failed', t: 'err' },
  'property.created': { l: 'Property created', t: 'ok' },
  'property.updated': { l: 'Property updated', t: 'ok' },
  'property.deleted': { l: 'Property deleted', t: 'err' },
  'property.featured': { l: 'Featured toggled', t: 'neutral' },
  'content.updated': { l: 'Content updated', t: 'ok' },
  'enquiry.status': { l: 'Enquiry status', t: 'neutral' },
  'enquiry.deleted': { l: 'Enquiry deleted', t: 'warn' },
};

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api
      .getAudit({ action: filter, q })
      .then((d) => {
        setItems(d.items);
        setActions(d.actions);
      })
      .catch((e) => toast(e.message, 'err'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter, q]);

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Activity Log</h1>
          <p>Every sensitive action in the panel — logins, password changes, content edits, transfers — is recorded here with IP address.</p>
        </div>
      </div>

      <div className="a-toolbar">
        <div className="a-search">
          <IconSearch size={16} />
          <input placeholder="Search by IP or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ width: 230 }}>
          <CustomSelect
            value={filter}
            onChange={(v) => setFilter(v)}
            placeholder="All actions"
            options={[{ value: '', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: ACTION_LABELS[a]?.l || a }))]}
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty title="No activity yet" sub="Actions will appear here as they happen." />
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const meta = ACTION_LABELS[it.action] || { l: it.action, t: 'neutral' };
                const details = Object.entries(it.details || {})
                  .map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`)
                  .join(' · ');
                return (
                  <tr key={it._id}>
                    <td className="a-nowrap">{fmtDate(it.createdAt)}</td>
                    <td><Badge tone={meta.t}>{meta.l}</Badge></td>
                    <td className="a-muted">{details || '—'}</td>
                    <td className="a-nowrap">{it.ip || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
