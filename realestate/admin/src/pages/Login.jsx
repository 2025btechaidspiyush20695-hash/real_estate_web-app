import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { api } from '../api';
import { IconArrowRight, IconAlert, IconCheck, IconArrowLeft, IconShield } from '../icons';

/** Success banners shown after transfer / reset / password change. */
const MESSAGES = {
  'transfer-success': { type: 'ok', text: 'Ownership transferred! All old sessions were terminated. Please login with the new credentials.' },
  'password-changed': { type: 'ok', text: 'Password changed on all devices. Please login again.' },
  'reset-success': { type: 'ok', text: 'Password reset successful! Please login with your new password.' },
};

export default function Login() {
  const { applySession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const banner = MESSAGES[params.get('msg')];

  // ---- login fields ----
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // ---- captcha (progressive: required after failed attempts) ----
  const [captcha, setCaptcha] = useState(null); // { captchaId, svg }
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // ---- 2FA step ----
  const [pendingToken, setPendingToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  const loadCaptcha = async () => {
    try {
      const c = await api.getCaptcha();
      setCaptcha(c);
      setCaptchaAnswer('');
    } catch (e) {
      /* captcha load failure — user can still try without it once */
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const data = await api.login(email, password, captcha?.captchaId, captchaAnswer || undefined);
      if (data.require2fa) {
        // step 2: authenticator code
        setPendingToken(data.pendingToken);
        setBusy(false);
        return;
      }
      applySession(data.token, data.user);
      navigate('/');
    } catch (e2) {
      setErr(e2.message);
      if (e2.captchaRequired || (e2.captchaId && e2.svg)) {
        setCaptcha({ captchaId: e2.captchaId, svg: e2.svg });
      }
      setBusy(false);
    }
  };

  const submit2fa = async (e) => {
    e.preventDefault();
    setErr('');
    setTwoFactorBusy(true);
    try {
      const data = await api.verify2fa(pendingToken, twoFactorCode);
      if (data.token) {
        applySession(data.token, data.user);
        navigate('/');
      }
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const reset2fa = () => {
    setPendingToken(null);
    setTwoFactorCode('');
    setErr('');
  };

  return (
    <div className="a-login">
      <div className="a-login-ring r1" />
      <div className="a-login-ring r2" />

      <div className="a-login-card">
        <div className="a-login-logo">
          <img src="/logo.png" alt="Gurukripa Estate" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }} />
        </div>

        {banner && (
          <div className={`a-login-banner ${banner.type}`}>
            {banner.type === 'ok' ? <IconCheck size={15} /> : <IconAlert size={15} />} {banner.text}
          </div>
        )}

        {pendingToken ? (
          /* ================= 2FA STEP ================= */
          <>
            <h1>Two-Factor Code</h1>
            <p className="a-login-sub">
              Enter the 6-digit code from your authenticator app
              (Google Authenticator / Authy etc.)
            </p>
            {err && <div className="a-login-err"><IconAlert size={15} /> {err}</div>}
            <form onSubmit={submit2fa}>
              <label className="a-login-field">
                <span>Authenticator code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '10px', fontFamily: 'monospace' }}
                  autoFocus
                />
              </label>
              <button className="a-btn gold block" disabled={twoFactorBusy}>
                {twoFactorBusy ? 'Verifying…' : 'Verify & Sign In'} {!twoFactorBusy && <IconShield size={15} />}
              </button>
            </form>
            <button className="a-login-back" onClick={reset2fa}>
              <IconArrowLeft size={14} /> Back to password
            </button>
          </>
        ) : (
          /* ================= PASSWORD STEP ================= */
          <>
            <h1>Gurukripa Admin</h1>
            <p className="a-login-sub">Sign in to manage the website</p>

            {err && <div className="a-login-err"><IconAlert size={15} /> {err}</div>}

            <form onSubmit={submitLogin}>
              <label className="a-login-field">
                <span>Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aapka-admin-email@gmail.com" autoFocus />
              </label>
              <label className="a-login-field">
                <span>Password</span>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </label>

              {captcha && (
                <div className="a-captcha">
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha.svg)}`}
                    alt="Captcha — type the answer"
                    width={150}
                    height={48}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Answer"
                    maxLength={3}
                  />
                  <button type="button" className="a-captcha-refresh" onClick={loadCaptcha} title="New captcha">↻</button>
                </div>
              )}

              <button className="a-btn gold block" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign In'} {!busy && <IconArrowRight size={16} />}
              </button>
            </form>

            <Link to="/forgot" className="a-login-forgot">Forgot Password?</Link>

            <p className="a-login-demo">
              Demo login — fresh setup par admin email / admin123 (ownership transfer ke baad naya email)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
