import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ResetPassword = ({ onSuccess }) => {
  const [searchParams] = useSearchParams();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain an uppercase letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain a number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Failed to reset password');
      }

      setSuccess('Password has been reset successfully! 🎉');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="modernAuthWrapper">
        <div className="scenicAuthBg" />
        <div className="modernGlassCard">
          <h1 className="modernAuthTitle">Invalid Link</h1>
          <p className="authSubtitle">
            The password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="modernLoginBtn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modernAuthWrapper">
      <div className="scenicAuthBg" />
      <div className="modernGlassCard">
        <h1 className="modernAuthTitle">Reset Password</h1>
        <p className="authSubtitle">
          Create a new secure password for your account
        </p>

        <form onSubmit={handleSubmit} className="modernAuthForm">
          {error && <div className="glassErrorMessage">{error}</div>}
          {success && (
            <div className="successMessage">
              {success}
              <br />
              <Link to="/login" style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '10px', display: 'block', textDecoration: 'underline' }}>
                Click here to sign in
              </Link>
            </div>
          )}

          <div className="modernInputGroup">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="modernInputGroup">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <p className="passwordHint" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: '-10px 0 18px 0' }}>
            Must be 8+ chars with at least one uppercase letter and a number.
          </p>

          <button type="submit" disabled={loading} className="modernLoginBtn">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="modernAuthFooter">
            <span>Remember your password?</span>{' '}
            <Link to="/login" className="modernRegisterLink">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
