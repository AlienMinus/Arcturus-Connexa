import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Registration from '../../components/auth/Registration';
import Login from '../../components/auth/Login';
import ForgotPassword from '../../components/auth/ForgotPassword';
import ResetPassword from '../../components/auth/ResetPassword';

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleLoginSuccess = (data) => {
    // Token is already stored in localStorage by the Login component
    navigate('/');
  };

  const handleRegisterSuccess = (data) => {
    // Token is already stored in localStorage by the Registration component
    navigate('/');
  };

  const handleForgotPasswordSuccess = (data) => {
    // Redirect to reset password page
    // In production, this would be triggered by email link
  };

  const handleResetPasswordSuccess = (data) => {
    navigate('/login');
  };

  const renderAuthMode = () => {
    switch (mode) {
      case 'register':
        return <Registration onSuccess={handleRegisterSuccess} />;
      case 'forgot-password':
        return <ForgotPassword onSuccess={handleForgotPasswordSuccess} />;
      case 'reset-password':
        return <ResetPassword onSuccess={handleResetPasswordSuccess} />;
      case 'login':
      default:
        return <Login onSuccess={handleLoginSuccess} />;
    }
  };

  return <>{renderAuthMode()}</>;
};

export default AuthPage;
