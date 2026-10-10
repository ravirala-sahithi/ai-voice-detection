import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

// Password rules shown as live checklist
const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',          test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'At least 1 uppercase letter (A–Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'At least 1 lowercase letter (a–z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number',    label: 'At least 1 number (0–9)',         test: (p) => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least 1 special character (!@#$…)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Evaluate each rule reactively
  const ruleResults = useMemo(() =>
    PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(password) })),
    [password]
  );

  const allRulesPassed = ruleResults.every(r => r.passed);
  const passedCount = ruleResults.filter(r => r.passed).length;

  // Strength bar: 0-5 segments
  const strengthColor = passedCount <= 1
    ? '#ef4444'  // red
    : passedCount <= 3
      ? '#f59e0b'  // amber
      : '#22c55e'; // green

  const validatePassword = (pwd) => {
    const failed = PASSWORD_RULES.filter(r => !r.test(pwd));
    if (failed.length === 0) return null;
    return `Password must include: ${failed.map(r => r.label.toLowerCase()).join(', ')}.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.message || err.response?.data?.validationErrors?.email || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Start analyzing recordings with AI voice clone detection
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Sahithi Reddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password with live requirements checklist */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
              autoComplete="new-password"
            />

            {/* Strength bar — shown after typing starts */}
            {password.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                {/* Segmented progress bar */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                  {PASSWORD_RULES.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: i < passedCount ? strengthColor : 'var(--border)',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Requirements checklist */}
                <div style={{
                  background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}>
                  {ruleResults.map(rule => (
                    <div key={rule.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: rule.passed ? '#22c55e' : 'var(--text-muted)',
                      transition: 'color 0.2s ease',
                    }}>
                      {rule.passed
                        ? <CheckCircle size={13} style={{ flexShrink: 0 }} />
                        : <XCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                      }
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={{
                borderColor: confirmPassword && confirmPassword !== password
                  ? '#ef4444'
                  : confirmPassword && confirmPassword === password
                    ? '#22c55e'
                    : undefined,
              }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '0.3rem' }}>
                Passwords do not match.
              </p>
            )}
            {confirmPassword && confirmPassword === password && (
              <p style={{ fontSize: '0.78rem', color: '#22c55e', marginTop: '0.3rem' }}>
                ✓ Passwords match.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting || !allRulesPassed || password !== confirmPassword}
          >
            {isSubmitting ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                Creating account...
              </>
            ) : (
              <>
                Register &amp; Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
