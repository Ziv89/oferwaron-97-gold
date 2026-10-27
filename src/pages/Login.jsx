// ============================================
// Login.jsx - member sign in, registration and password reset
//
// Registering creates the account right away and signs the person in,
// but it starts as 'pending': they only see My Account until the owner
// approves them (see AuthContext).
// ============================================
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../contexts/AuthContext';
import '../styles/auth.css';


const MIN_PASSWORD = 8;

// Today as YYYY-MM-DD (local time) - the latest valid date of birth
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const friendlyError = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect. If you do not have an account yet, register below.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    case 'auth/operation-not-allowed':
      return 'Registration is not enabled yet. Please contact us.';
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
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/members';

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const submit = async () => {
    setError('');
    setNotice('');

    if (mode === 'register') {
      if (!dateOfBirth || dateOfBirth > todayIso()) {
        setError('Please enter a valid date of birth.');
        return;
      }
      if (password.length < MIN_PASSWORD) {
        setError(`Password must be at least ${MIN_PASSWORD} characters.`);
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        await register({ name, dateOfBirth, email, password });
        // New accounts are pending - My Account shows the approval status
        navigate('/members', { replace: true });
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

  const canSubmit =
    mode === 'login'
      ? email && password
      : mode === 'register'
      ? name.trim() && dateOfBirth && email && password
      : email;

  const title = { login: 'Member Sign In', register: 'Register', reset: 'Reset Password' }[mode];
  const subtitle = {
    login: 'Sign in to your member account.',
    register: 'Create your account. Member areas open once we approve your registration.',
    reset: 'Enter your email and we will send you a reset link.',
  }[mode];

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !busy && canSubmit) submit();
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
          <h1 className="strategy-card-title text-center">{title}</h1>

          <p className="strategy-subtitle text-center auth-subtitle">{subtitle}</p>

          <div className="auth-form">
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  className="contact-input"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="name"
                  maxLength={80}
                />
                {/* Date inputs show no placeholder, so it gets a visible label */}
                <label className="auth-field-label" htmlFor="register-dob">
                  Date of birth
                </label>
                <input
                  id="register-dob"
                  type="date"
                  className="contact-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoComplete="bday"
                  min="1900-01-01"
                  max={todayIso()}
                />
              </>
            )}

            <input
              type="email"
              className="contact-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="email"
            />

            {mode !== 'reset' && (
              <input
                type="password"
                className="contact-input"
                placeholder={mode === 'register' ? `Password (at least ${MIN_PASSWORD} characters)` : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            )}

            {error && <p className="auth-error">{error}</p>}
            {notice && <p className="auth-notice">{notice}</p>}

            <button
              type="button"
              className={`strategy-btn strategy-btn-primary${mode === 'register' ? ' strategy-btn-green' : ''}`}
              onClick={submit}
              disabled={busy || !canSubmit}
            >
              {busy
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Register'
                : 'Send Reset Link'}
            </button>
          </div>

          <div className="auth-links">
            {mode === 'login' ? (
              <button type="button" className="auth-link" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            ) : (
              <button type="button" className="auth-link" onClick={() => switchMode('login')}>
                Back to sign in
              </button>
            )}
          </div>

          {mode === 'login' && (
            <div className="auth-request-box">
              <p className="auth-request-title">Don't have an account yet?</p>
              <p className="auth-request-text">
                Register in a minute. Once we approve your registration you get
                access to Live Trading and the member areas.
              </p>
              <div className="strategy-btn-group">
                <button
                  type="button"
                  className="strategy-btn strategy-btn-primary strategy-btn-green"
                  onClick={() => switchMode('register')}
                >
                  Register
                </button>
                <Link to="/pricing" className="auth-link auth-link-inline">
                  See plans →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
