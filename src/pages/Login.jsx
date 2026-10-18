// ============================================
// Login.jsx - member sign in
//
// Sign in and password reset only. Accounts are provisioned by the
// owner in the Firebase Console, so there is no self-registration
// here - anyone wanting an account is sent to /contact.
// ============================================
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';


const friendlyError = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect. If you do not have an account yet, request access below.';
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact us.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/members';

  const submit = async () => {
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await resetPassword(email);
        // Same message whether or not the account exists, so this
        // cannot be used to discover who is a member.
        setNotice('If that email has an account, a reset link is on its way.');
      }
    } catch (err) {
      if (mode === 'reset') {
        switch (err.code) {
          case 'auth/user-not-found':
            setNotice('If that email has an account, a reset link is on its way.');
            break;
          case 'auth/invalid-email':
            setError('That email address does not look right.');
            break;
          case 'auth/too-many-requests':
            setError('Too many attempts. Please wait a minute and try again.');
            break;
          case 'auth/network-request-failed':
            setError('Network problem. Check your connection and try again.');
            break;
          case 'auth/operation-not-allowed':
            setError('Password reset is not enabled. Please contact the site owner.');
            break;
          default:
            setError('Could not send a reset link. Please try again or contact the site owner.');
        }
      } else {
        setError(friendlyError(err.code));
      }
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !busy) submit();
  };

  return (
    <div className="strategy-page">
      <Seo
        title="Member Sign In — 97% Gold"
        description="Sign in to your 97% Gold member account to access live XAUUSD signals and private indicator access."
        path="/login"
        noindex
      />

      <section className="strategy-section">
        <div className="auth-card">
          <h1 className="strategy-card-title text-center">
            {mode === 'login' ? 'Member Sign In' : 'Reset Password'}
          </h1>

          <p className="strategy-subtitle text-center auth-subtitle">
            {mode === 'login'
              ? 'Members only. Accounts are set up for you after you subscribe.'
              : 'Enter your email and we will send you a reset link.'}
          </p>

          <div className="auth-form">
            <input
              type="email"
              className="contact-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="email"
            />

            {mode === 'login' && (
              <input
                type="password"
                className="contact-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="current-password"
              />
            )}

            {error && <p className="auth-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}

            <button
              type="button"
              className="strategy-btn strategy-btn-primary"
              onClick={submit}
              disabled={busy || !email || (mode === 'login' && !password)}
            >
              {busy
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign In'
                : 'Send Reset Link'}
            </button>
          </div>

          <div className="auth-links">
            {mode === 'login' ? (
              <button type="button" className="auth-link" onClick={() => setMode('reset')}>
                Forgot password?
              </button>
            ) : (
              <button type="button" className="auth-link" onClick={() => setMode('login')}>
                Back to sign in
              </button>
            )}
          </div>

          {/* No self-signup: accounts are created by the owner. */}
          <div className="auth-request-box">
            <p className="auth-request-title">Don't have an account yet?</p>
            <p className="auth-request-text">
              Member accounts are created manually after you subscribe. Get in
              touch and we will set yours up, usually the same day.
            </p>
            <div className="strategy-btn-group">
              <Link to="/contact" className="strategy-btn strategy-btn-primary">
                Request Access
              </Link>
              <Link to="/pricing" className="auth-link auth-link-inline">
                See plans →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
