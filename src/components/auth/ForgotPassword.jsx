import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setSuccess('Password reset link has been sent to your email');
      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authContainer">
      <div className="authCard">
        <h1 className="authTitle">Forgot Password?</h1>
        <p className="authSubtitle">
          Enter your email address and we'll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="errorMessage">{error}</div>}
          {success && <div className="successMessage">{success}</div>}

          <div className="formGroup">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="primaryBtn fullWidth">
            {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
