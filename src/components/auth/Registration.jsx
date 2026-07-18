import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      default:
        return '';
    }
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setError(error);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep(3);
    if (error) {
      setError(error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || response.statusText || 'Registration failed');
      }

      // Redirect to login so the user can sign in with their new account
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
        <h1 className="authTitle">Create Account</h1>
        <div className="stepIndicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`stepLine ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`stepLine ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="errorMessage">{error}</div>}

          {step === 1 && (
            <div className="formStep">
              <h2>Personal Information</h2>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="middleName"
                placeholder="Middle Name (optional)"
                value={formData.middleName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="formStep">
              <h2>Contact Information</h2>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number (optional)"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              <input
                type="text"
                name="location"
                placeholder="Location (optional)"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          )}

          {step === 3 && (
            <div className="formStep">
              <h2>Security</h2>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <p className="passwordHint">
                Password must be at least 8 characters, include an uppercase letter
                and a number
              </p>
            </div>
          )}

          <div className="formActions">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="secondaryBtn">
                Back
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={handleNext} className="primaryBtn">
                Next
              </button>
            )}
            {step === 3 && (
              <button type="submit" disabled={loading} className="primaryBtn">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;
