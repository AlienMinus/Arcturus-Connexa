import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaRedo, FaArrowLeft, FaCheck } from 'react-icons/fa';
import './Auth.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const Registration = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phoneNumber: '',
    location: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = (stepNum) => {
    switch (stepNum) {
      case 1:
        if (!formData.firstName.trim()) return 'First name is required';
        if (!formData.lastName.trim()) return 'Last name is required';
        if (!formData.dateOfBirth) return 'Date of birth is required';
        return '';
      case 2:
        if (!formData.email.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          return 'Invalid email format';
        return '';
      case 3:
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 8)
          return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(formData.password))
          return 'Password must contain an uppercase letter';
        if (!/[0-9]/.test(formData.password))
          return 'Password must contain a number';
        if (!formData.confirmPassword) return 'Please confirm password';
        if (formData.password !== formData.confirmPassword)
          return 'Passwords do not match';
        return '';
      case 4:
        if (!otp.trim()) return 'Please enter the 6-digit verification code';
        if (otp.trim().length !== 6) return 'Verification code must be 6 digits';
        return '';
      default:
        return '';
    }
  };

  const sendOtpRequest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send verification code');
      }

      setSuccess(`Verification code dispatched to ${formData.email}`);
      setResendCooldown(60);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }

    // After Step 3 (Security), trigger OTP dispatch
    if (step === 3) {
      await sendOtpRequest();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setSuccess('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    await sendOtpRequest();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const err = validateStep(4);
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          otp: otp.trim(),
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setSuccess('Account created successfully! 🎉');
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modernAuthWrapper">
      {/* Background layer */}
      <div className="scenicAuthBg" />

      {/* Glassmorphic Card */}
      <div className="modernGlassCard" style={{ maxWidth: '440px' }}>
        <h1 className="modernAuthTitle">
          {step === 4 ? 'Verify Email' : 'Create Account'}
        </h1>

        {/* Step Indicator */}
        <div className="stepIndicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`stepLine ${step >= 2 ? 'active' : ''}`} />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`stepLine ${step >= 3 ? 'active' : ''}`} />
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`stepLine ${step >= 4 ? 'active' : ''}`} />
          <div className={`step ${step >= 4 ? 'active' : ''}`}>
            <FaShieldAlt size={11} />
          </div>
        </div>

        <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {error && <div className="glassErrorMessage">{error}</div>}
          {success && <div className="successMessage">{success}</div>}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="formStep">
              <h2>Personal Information</h2>
              <div className="modernInputGroup">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="e.g. Alex"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modernInputGroup">
                <label>Middle Name (Optional)</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="e.g. M."
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div className="modernInputGroup">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="e.g. Morgan"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modernInputGroup">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="formStep">
              <h2>Contact Information</h2>
              <div className="modernInputGroup">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="modernInputGroup">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="modernInputGroup">
                <label>Location (Optional)</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. San Francisco, CA"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {step === 3 && (
            <div className="formStep">
              <h2>Security</h2>
              <div className="modernInputGroup">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="modernInputGroup">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', margin: '-10px 0 16px 0' }}>
                Must be 8+ characters with at least one uppercase letter and a number.
              </p>
            </div>
          )}

          {/* Step 4: OTP Verification */}
          {step === 4 && (
            <div className="formStep">
              <h2>Enter 6-Digit Code</h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center', margin: '0 0 18px 0' }}>
                We sent a 6-digit verification code to <strong>{formData.email}</strong>.
              </p>

              <div className="modernInputGroup">
                <label>Verification Code (OTP)</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    letterSpacing: '8px',
                    fontSize: '22px',
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0 20px' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FaRedo size={11} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : 'Resend Verification Code'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="formActions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="secondaryBtn"
                style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FaArrowLeft size={12} /> Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                className="modernLoginBtn"
                style={{ flex: step > 1 ? '2' : '1' }}
              >
                Continue
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="modernLoginBtn"
                style={{ flex: '2' }}
              >
                {loading ? 'Sending Code...' : 'Get Verification Code'}
              </button>
            )}

            {step === 4 && (
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="modernLoginBtn"
                style={{ flex: '2' }}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            )}
          </div>

          <div className="modernAuthFooter">
            <span>Already have an account?</span>{' '}
            <Link to="/login" className="modernRegisterLink">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
