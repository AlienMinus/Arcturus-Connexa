import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { buildApiUrl } from '../utils/api';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl('/profile'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setProfile(null);
        } else {
          throw new Error('Unable to load profile');
        }
      } else {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProfileByUsername = async (username) => {
    try {
      const response = await fetch(buildApiUrl(`/profile/${username}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Unable to load profile');
      }
      return await response.json();
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  const searchUsers = async (query) => {
    if (!query) return [];
    try {
      const response = await fetch(buildApiUrl(`/users/search?q=${query}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    loadProfile();
  }, [token]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile: loadProfile,
        getProfileByUsername,
        searchUsers,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};
