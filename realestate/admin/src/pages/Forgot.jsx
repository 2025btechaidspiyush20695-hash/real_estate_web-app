import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { IconAlert, IconCheck, IconArrowLeft, IconMail } from '../icons';
import { PasswordRules } from './Reset';

/**
 * Forgot Password — OTP flow (3 steps)
 *  1. Enter registered admin email  → server emails a 6-digit OTP
 *  2. Enter OTP                      → verified server-side (10 min, 5 tries)
 *  3. Set a new strong password      → all sessions revoked
 */
export default function Forgot() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 email | 2 otp | 3 password | done

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [busy, setBusy] = useState(false);

  // Step 1 → request OTP
  const requestOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const d = await api.forgotPassword(email);
      setInfo(d.message || '');
      setDevOtp(d.otp || ''); // dev mode only (no SMTP configured)
      setStep(2);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  // Step 2 → verify OTP
  const submitOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const d = await api.verifyOtp(email, otp);
      setResetToken(d.resetToken);
      setStep(3);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  // Step 3 → set new password
  const submitPassword = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw !== pw2) return setErr('Passwords do not match');
    setBusy(true);
    try {
      await api.resetWithOtp(resetToken, pw, pw2);
      setStep(4);
    } catch (e2) {
      setErr(e2.message);
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

        {step === 1 && (
          <>
            <h1>Reset Password</h1>
            <p className="a-login-sub">
              Enter your registered admin email — we will send a <strong>6-digit OTP</strong> (valid 10 minutes).
            </p>
            {err && <div className="a-login-err"><IconAlert size={15} /> {err}</div>}
            <form onSubmit={requestOtp}>
              <label className="a-login-field">
                <span>Admin email</span>
                <div className="a-login-mail-wrap">
                  <IconMail size={16} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@example.com" autoFocus />
                </div>
              </label>
              <button className="a-btn gold block" disabled={busy}>
                {busy ? 'Sending…' : 'Send OTP'} {!busy && <IconMail size={15} />}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Enter OTP</h1>
            <p className="a-login-sub">
              A 6-digit code was sent to <strong>{email}</strong>. It expires in 10 minutes and can be used once.
            </p>
            {info && <div className="a-login-banner ok"><IconCheck size={15} /> {info}</div>}
            {devOtp && (
              <div className="a-login-banner err">
                <span>
                  <strong>Dev mode (no SMTP configured):</strong> use OTP{' '}
                  <code style={{ fontSize: '1.3rem', fontWeight: 800 }}>{devOtp}</code>
                </span>
              </div>
            )}
            {err && <div className="a-login-err"><IconAlert size={15} /> {err}</div>}
            <form onSubmit={submitOtp}>
              <label className="a-login-field">
                <span>6-digit OTP</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '10px', fontFamily: 'monospace' }}
                  autoFocus
                />
              </label>
              <button className="a-btn gold block" disabled={busy}>
                {busy ? 'Verifying…' : 'Verify OTP'} {!busy && <IconCheck size={15} />}
              </button>
            </form>
            <button className="a-login-back" onClick={() => { setStep(1); setOtp(''); setErr(''); }}>
              <IconArrowLeft size={14} /> Request a new OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Set New Password</h1>
            <p className="a-login-sub">OTP verified ✅ — choose a new strong password.</p>
            {err && <div className="a-login-err"><IconAlert size={15} /> {err}</div>}
            <form onSubmit={submitPassword}>
              <label className="a-login-field">
                <span>New password</span>
                <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoFocus />
              </label>
              <PasswordRules password={pw} />
              <label className="a-login-field" style={{ marginTop: 12 }}>
                <span>Confirm new password</span>
                <input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
              </label>
              <button className="a-btn gold block" disabled={busy}>
                {busy ? 'Updating…' : 'Update Password'} {!busy && <IconCheck size={16} />}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <>
            <div className="a-login-banner ok block"><IconCheck size={18} /> Password updated successfully!</div>
            <p className="a-login-sub">All old sessions have been terminated. Login with your new password.</p>
            <Link to="/login" className="a-btn gold block">Go to Login <IconArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} /></Link>
          </>
        )}

        {step < 4 && (
          <Link to="/login" className="a-login-back" style={{ display: 'inline-flex', marginTop: 18 }}>
            <IconArrowLeft size={14} /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
