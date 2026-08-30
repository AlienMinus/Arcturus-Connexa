import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Login failed');
      }

      // Store token and user in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem('arcturus_remember_email', email);
      } else {
        localStorage.removeItem('arcturus_remember_email');
      }

      onSuccess(data);
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
        <h1 className="modernAuthTitle">Login</h1>

        <form onSubmit={handleSubmit} className="modernAuthForm">
          {error && <div className="glassErrorMessage">{error}</div>}

          <div className="modernInputGroup">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="modernInputGroup">
            <label>Password</label>
            <div className="passwordInputWrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="togglePasswordBtn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div className="modernFormOptions">
            <label className="rememberMeLabel">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>

            <Link to="/forgot-password" className="modernForgotLink">
              Forget Password
            </Link>
          </div>

          <button type="submit" disabled={loading} className="modernLoginBtn">
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <div className="modernAuthFooter">
            <span>Don't have an account?</span>{' '}
            <Link to="/register" className="modernRegisterLink">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
