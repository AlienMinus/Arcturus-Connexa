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

      setSuccess('Password has been reset successfully');
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="authContainer">
        <div className="authCard">
          <h1 className="authTitle">Invalid Reset Link</h1>
          <p className="authSubtitle">
            The password reset link is invalid or has expired
          </p>
          <Link to="/forgot-password" className="primaryBtn fullWidth textCenter">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="authContainer">
      <div className="authCard">
        <h1 className="authTitle">Reset Password</h1>
        <p className="authSubtitle">
          Enter your new password below to reset your account
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="errorMessage">{error}</div>}
          {success && (
            <div className="successMessage">
              {success}
              <br />
              <Link to="/login" style={{ color: 'green', marginTop: '10px', display: 'block' }}>
                Click here to sign in
              </Link>
            </div>
          )}

          <div className="formGroup">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="formGroup">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <p className="passwordHint">
            Password must be at least 8 characters, include an uppercase letter and a
            number
          </p>

          <button type="submit" disabled={loading} className="primaryBtn fullWidth">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="authDivider">
          <span>Remember your password?</span>
        </div>

        <Link to="/login" className="secondaryBtn fullWidth textCenter">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
