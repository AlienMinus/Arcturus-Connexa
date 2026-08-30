import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const ForgotPassword = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Failed to process request');
      }

      setSuccess('Password reset link has been sent to your email! ✉️');
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modernAuthWrapper">
      {/* Scenic Background Layer */}
      <div className="scenicAuthBg" />

      {/* Frosted Glassmorphism Card */}
      <div className="modernGlassCard">
        <h1 className="modernAuthTitle">Forgot Password</h1>
        <p className="authSubtitle">
          Enter your email to receive recovery instructions
        </p>

        <form onSubmit={handleSubmit} className="modernAuthForm">
          {error && <div className="glassErrorMessage">{error}</div>}
          {success && <div className="successMessage">{success}</div>}

          <div className="modernInputGroup">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button type="submit" disabled={loading} className="modernLoginBtn" style={{ marginTop: '12px' }}>
            {loading ? 'Sending link...' : 'Send Reset Link'}
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

export default ForgotPassword;
