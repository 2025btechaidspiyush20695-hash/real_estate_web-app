import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { IconAlert, IconCheck, IconArrowLeft } from '../icons';

/** Password strength checklist shared by reset & transfer forms. */
export function PasswordRules({ password }) {
  const rules = [
    { ok: (password || '').length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(password || ''), label: 'One uppercase letter (A–Z)' },
    { ok: /\d/.test(password || ''), label: 'One number (0–9)' },
    { ok: /[^A-Za-z0-9]/.test(password || ''), label: 'One special character (!@#$…)' },
  ];
  return (
    <ul className="a-pw-rules">
      {rules.map((r, i) => (
        <li key={i} className={r.ok ? 'ok' : ''}>
          <span>{r.ok ? '✓' : '•'}</span> {r.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Password Reset page — reached via the emailed link:
 *   https://<admin-url>/reset/<token>
 * Validates the token server-side, then sets a new strong password.
 * On success the token is deleted and ALL sessions are revoked.
 */
export default function Reset() {
  const { token } = useParams();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formErr, setFormErr] = useState('');

  // Step D — verify token exists & is not expired
  useEffect(() => {
    api
      .validateResetToken(token)
      .then((d) => {
        setValid(true);
        setEmail(d.email);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setChecking(false));
  }, [token]);

  // Step E — set the new password
  const submit = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (pw !== pw2) return setFormErr('Passwords do not match');
    setBusy(true);
    try {
      await api.resetPassword(token, pw, pw2);
      setDone(true);
    } catch (e2) {
      setFormErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <div className="a-login-ring r1" />
      <div className="a-login-ring r2" />

      <div className="a-login-card">
        <div className="a-login-logo">
          <img src="/logo.png" alt="Gurukripa Estate" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }} />
        </div>

        {checking ? (
          <>
            <h1>Checking link…</h1>
            <p className="a-login-sub">Verifying your reset token.</p>
            <div className="a-spinner" style={{ marginInline: 'auto' }} />
          </>
        ) : err ? (
          <>
            <div className="a-login-err"><IconAlert size={15} /> {err}</div>
            <Link to="/login" className="a-btn gold block">Go to Login</Link>
          </>
        ) : done ? (
          <>
            <div className="a-login-banner ok block"><IconCheck size={18} /> Password updated successfully!</div>
            <p className="a-login-sub">All old sessions have been terminated. Login with your new password.</p>
            <Link to="/login" className="a-btn gold block">Go to Login <IconArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} /></Link>
          </>
        ) : (
          <>
            <h1>Set New Password</h1>
            <p className="a-login-sub">Resetting password for <strong>{email}</strong></p>

            {formErr && <div className="a-login-err"><IconAlert size={15} /> {formErr}</div>}

            <form onSubmit={submit}>
              <label className="a-login-field">
                <span>New password</span>
                <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoFocus />
              </label>
              <PasswordRules password={pw} />
              <label className="a-login-field" style={{ marginTop: 14 }}>
                <span>Confirm new password</span>
                <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
              </label>

              <button className="a-btn gold block" disabled={busy}>
                {busy ? 'Updating…' : 'Update Password'} {!busy && <IconCheck size={16} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
