import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { api, clearToken } from '../api';
import { Field, TextInput, useToast } from '../components/UI';
import { IconCheck, IconExternal, IconLogout, IconAlert, IconShield, IconEye } from '../icons';
import { useNavigate, Link } from 'react-router-dom';
import { PasswordRules } from './Reset';

/* ================================================================
   COMPONENT 1 — ACCOUNT OWNERSHIP TRANSFER
   The seller (current admin) transfers the whole business account
   to the buyer: new admin email + new strong password.
   After success ALL sessions everywhere are revoked instantly and
   the seller is redirected to the login screen.
   ================================================================ */
function OwnershipTransfer() {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (newPassword !== confirmNewPassword) return setErr('New passwords do not match');

    // Confirmation modal before this irreversible action
    setConfirmOpen(true);
  };

  const doTransfer = async () => {
    setConfirmOpen(false);
    setBusy(true);
    setErr('');
    try {
      await api.transferOwnership({
        currentPassword,
        newEmail,
        newPassword,
        confirmNewPassword,
      });
      // CRITICAL: our own JWT is now revoked server-side.
      // Clear it locally and force a fresh login with the buyer's credentials.
      clearToken();
      navigate('/login?msg=transfer-success', { replace: true });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <form className="a-form-card transfer-card" onSubmit={submit}>
      <h2>🏠 Account Ownership Transfer</h2>
      <p className="a-muted">
        Hand the website over to the buyer. After transfer, the <strong>admin email and password change</strong>, every
        active session (all browsers &amp; devices) is <strong>immediately terminated</strong>, and the previous owner
        can no longer access the panel.
      </p>

      <div className="a-transfer-warn">
        <IconAlert size={16} />
        <span>
          <strong>This is irreversible.</strong> Only proceed when you are ready to give up access. The buyer should
          login with the new credentials right away.
        </span>
      </div>

      <div className="a-form-grid" style={{ marginTop: 18 }}>
        <Field label="Current password (seller's)" wide>
          <TextInput type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Your current admin password" />
        </Field>
        <Field label="New admin email (buyer's)" wide>
          <TextInput type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="buyer@example.com" />
        </Field>
        <Field label="New admin password (buyer's)">
          <TextInput type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, 1 A-Z, 1 digit, 1 symbol" />
          <PasswordRules password={newPassword} />
        </Field>
        <Field label="Confirm new admin password">
          <TextInput type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Repeat the new password" />
        </Field>
      </div>

      {err && <p className="a-form-err">{err}</p>}

      <div className="a-form-actions">
        <button type="submit" className="a-btn danger" disabled={busy}>
          <IconShield size={16} /> {busy ? 'Transferring…' : 'Transfer Ownership'}
        </button>
      </div>

      {confirmOpen && (
        <div className="a-modal-veil" onClick={() => setConfirmOpen(false)}>
          <div className="a-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Transfer ownership?</h3>
            <p>
              Admin email will become <strong>{newEmail}</strong> with a new password. <strong>Every session
              (including yours) will be terminated immediately.</strong> This cannot be undone.
            </p>
            <div className="a-modal-actions">
              <button className="a-btn ghost" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="a-btn danger" onClick={doTransfer} disabled={busy}>
                {busy ? 'Transferring…' : 'Yes, Transfer Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

/* ================================================================
   2FA — two-factor authentication (Google Authenticator etc.)
   ================================================================ */
function TwoFactorCard() {
  const { user } = useAuth();
  const toast = useToast();

  const [setup, setSetup] = useState(null); // { secret, otpauthUrl, qr }
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSetup = async () => {
    setErr('');
    try {
      const d = await api.twoFactorSetup();
      setSetup(d);
    } catch (e) {
      setErr(e.message);
    }
  };

  const enable = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.twoFactorEnable(code, password);
      toast('2FA enabled — login now needs your authenticator code');
      setSetup(null);
      setCode('');
      setPassword('');
      window.location.reload(); // refresh user state
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.twoFactorDisable(code, password);
      toast('2FA disabled');
      setCode('');
      setPassword('');
      window.location.reload();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  if (!user?.twoFactorEnabled && !setup) {
    return (
      <div className="a-form-card">
        <h2>🔐 Two-Factor Authentication</h2>
        <p className="a-muted">
          Add a second layer of security — login will require a 6-digit code from your phone
          (Google Authenticator, Authy, 1Password…).
        </p>
        <button className="a-btn gold" onClick={loadSetup} style={{ marginTop: 12 }}>
          <IconShield size={16} /> Enable 2FA
        </button>
        {err && <p className="a-form-err">{err}</p>}
      </div>
    );
  }

  if (setup && !user?.twoFactorEnabled) {
    return (
      <div className="a-form-card">
        <h2>🔐 Enable 2FA — Step 1 of 2</h2>
        <ol className="a-2fa-steps">
          <li>Scan the QR code with your authenticator app, <strong>or</strong> type this secret manually:
            <code className="a-2fa-secret">{setup.secret}</code>
          </li>
          <li>Enter the 6-digit code shown in your app, plus your current password, then press Enable.</li>
        </ol>
        <div className="a-2fa-qr-wrap">
          <img src={setup.qr} alt="2FA QR code" width={220} height={220} />
        </div>
        {err && <p className="a-form-err">{err}</p>}
        <form onSubmit={enable} className="a-2fa-form">
          <Field label="Authenticator code">
            <TextInput inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </Field>
          <Field label="Current password">
            <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="a-form-actions">
            <button type="button" className="a-btn ghost" onClick={() => setSetup(null)}>Cancel</button>
            <button className="a-btn gold" disabled={busy}>{busy ? 'Enabling…' : 'Enable 2FA'} <IconCheck size={15} /></button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="a-form-card">
      <h2>🔐 Two-Factor Authentication</h2>
      <p className="a-muted" style={{ marginBottom: 10 }}>
        <span className="a-badge ok">ENABLED</span> — login requires your authenticator code.
      </p>
      <p className="a-muted">To disable, enter your current authenticator code and password:</p>
      {err && <p className="a-form-err">{err}</p>}
      <form onSubmit={disable} className="a-2fa-form">
        <Field label="Authenticator code">
          <TextInput inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
        </Field>
        <Field label="Current password">
          <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="a-form-actions">
          <button className="a-btn danger" disabled={busy}>{busy ? 'Disabling…' : 'Disable 2FA'}</button>
        </div>
      </form>
    </div>
  );
}

/* ================================================================
   SETTINGS PAGE — password + 2FA + ownership transfer
   ================================================================ */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // change-password form
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (next !== next2) return setErr('New passwords do not match');
    setBusy(true);
    try {
      await api.changePassword(cur, next);
      // Server bumped tokenVersion — our session is dead. Force fresh login.
      clearToken();
      navigate('/login?msg=password-changed', { replace: true });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <div className="a-page">
      <div className="a-page-head">
        <div>
          <h1>Settings</h1>
          <p>Account security, sessions &amp; ownership transfer.</p>
        </div>
      </div>

      <div className="a-form-grid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <form className="a-form-card" onSubmit={save}>
            <h2>Change password</h2>
            <p className="a-muted">Changing your password signs you out of every device for security.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <Field label="Current password">
                <TextInput type="password" required value={cur} onChange={(e) => setCur(e.target.value)} />
              </Field>
              <Field label="New password">
                <TextInput type="password" required value={next} onChange={(e) => setNext(e.target.value)} />
                <PasswordRules password={next} />
              </Field>
              <Field label="Repeat new password">
                <TextInput type="password" required value={next2} onChange={(e) => setNext2(e.target.value)} />
              </Field>
            </div>
            {err && <p className="a-form-err">{err}</p>}
            <div className="a-form-actions">
              <button className="a-btn gold" disabled={busy}>{busy ? 'Saving…' : 'Update Password'} <IconCheck size={16} /></button>
            </div>
          </form>

          <div className="a-form-card">
            <h2>Account</h2>
            <div className="a-account-row">
              <span className="a-avatar big"><UserIcon /></span>
              <span>
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </span>
            </div>
            <p className="a-muted">Role: {user?.role} · single-owner model</p>
            <div className="a-form-actions">
              <a className="a-btn ghost" href={import.meta.env.DEV ? 'http://localhost:5173' : '/'} target="_blank" rel="noreferrer"><IconExternal size={15} /> View website</a>
              <Link className="a-btn ghost" to="/audit"><IconEye size={15} /> Activity Log</Link>
              <button className="a-btn danger" onClick={() => { logout(); navigate('/login'); }}>
                <IconLogout size={15} /> Logout
              </button>
            </div>
          </div>

          <EmailCard />

          <TwoFactorCard />
        </div>

        <OwnershipTransfer />
      </div>
    </div>
  );
}

/* Email / SMTP card — sender Gmail bhi yahan se change hota hai (DB me save, .env kabhi nahi chhuna) */
function EmailCard() {
  const { user } = useAuth();
  const [form, setForm] = useState({ host: 'smtp.gmail.com', port: '465', secure: true, user: '', pass: '' });
  const [loaded, setLoaded] = useState(false);
  const [hasPass, setHasPass] = useState(false);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getSmtpSettings().then((d) => {
      setForm({ host: d.host || 'smtp.gmail.com', port: String(d.port || 465), secure: d.secure !== false, user: d.user || '', pass: '' });
      setHasPass(d.hasPass);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy('save');
    setResult(null);
    try {
      const r = await api.saveSmtpSettings({
        host: form.host, port: form.port, secure: form.secure, user: form.user, pass: form.pass,
      });
      setHasPass(true);
      setResult({ ok: true, text: r.message });
    } catch (err) {
      setResult({ ok: false, text: err.message });
    }
    setBusy('');
  };

  const sendTest = async () => {
    setBusy('test');
    setResult(null);
    try {
      const r = await api.testEmail();
      setResult({ ok: r.ok, text: r.message || (r.ok ? 'Email bhej di gayi!' : 'Fail') });
    } catch (err) {
      setResult({ ok: false, text: err.message });
    }
    setBusy('');
  };

  return (
    <form className="a-form-card" onSubmit={save}>
      <h2>Email / SMTP (Sender)</h2>
      <p className="a-muted">
        Yahan se <b>sender Gmail</b> change hota hai — koi file nahi chhuni padti.
        Recipient (kis ko mail jayegi) hamesha <b>current admin ({user?.email})</b> hota hai — wo
        Settings → Ownership Transfer se change hota hai.
      </p>
      {!loaded ? <p className="a-muted">Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="SMTP host">
              <TextInput value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="Port">
              <TextInput value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="465" />
            </Field>
          </div>
          <Field label="Sender Gmail (jis account ka app password hai)">
            <TextInput type="email" required value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} placeholder="aapka-email@gmail.com" />
          </Field>
          <Field label={hasPass && !form.pass ? 'App password (naya daalna ho to — warna khali chhodo)' : 'App password (16-char, bina space)'}>
            <TextInput type="password" value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} placeholder="abcd efgh ijkl mnop → abcd... (spaces hatao)" autoComplete="new-password" />
          </Field>
          {hasPass && !form.pass && <p className="a-muted" style={{ fontSize: '.78rem' }}>✅ Password pehle se set hai — save karne par wahi rahega (naya daaloge to update hoga).</p>}
          <p className="a-muted" style={{ fontSize: '.8rem' }}>
            📱 App password banana: Google Account → Security → 2-Step Verification ON → App passwords → Generate
          </p>
        </div>
      )}
      <div className="a-form-actions">
        <button className="a-btn gold" disabled={busy === 'save' || !loaded}>{busy === 'save' ? 'Saving…' : '💾 Save SMTP'}</button>
        <button type="button" className="a-btn" onClick={sendTest} disabled={busy === 'test' || !loaded}>
          {busy === 'test' ? 'Sending…' : '📧 Send Test Email'}
        </button>
      </div>
      {result && (
        <p style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, fontSize: '.85rem', background: result.ok ? 'rgba(21,128,61,.08)' : 'rgba(185,28,28,.08)', color: result.ok ? '#15803d' : '#b91c1c' }}>
          {result.text}
        </p>
      )}
    </form>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
