import React, { useState, useEffect, useRef } from 'react';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaInfoCircle, FaLock } from 'react-icons/fa';
import { buildApiUrl } from '../../../utils/api';

const BasicInfoEditor = ({ data, profile, onChange }) => {
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState(null); // { available: boolean, message: string, isCurrent: boolean }
  const debounceTimer = useRef(null);

  const initialUsername = profile?.username || '';
  const changesRemaining = profile?.usernameChangesRemaining !== undefined ? profile.usernameChangesRemaining : 2;
  const isLocked = changesRemaining === 0 && data.username !== initialUsername;
  const nextChangeDate = profile?.nextUsernameChangeDate
    ? new Date(profile.nextUsernameChangeDate).toLocaleDateString()
    : null;

  // Live availability checker with debounce
  useEffect(() => {
    const raw = (data.username || '').trim().toLowerCase();

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!raw) {
      setAvailability(null);
      setChecking(false);
      return;
    }

    if (raw === initialUsername) {
      setAvailability({ available: true, isCurrent: true, message: 'This is your current username.' });
      setChecking(false);
      return;
    }

    const USERNAME_REGEX = /^[a-z0-9@$\-_]{3,30}$/;
    if (!USERNAME_REGEX.test(raw)) {
      setAvailability({
        available: false,
        message: 'Must be 3-30 characters using only letters, numbers, @, $, -, and _.',
      });
      setChecking(false);
      return;
    }

    setChecking(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(buildApiUrl(`/profile/check-username/${encodeURIComponent(raw)}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const result = await res.json();
        setAvailability(result);
      } catch (err) {
        setAvailability({ available: false, message: 'Could not verify username availability.' });
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [data.username, initialUsername]);

  const handleUsernameChange = (e) => {
    // Whitelist only alphanumeric, @, $, -, and _
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9@$\-_]/g, '');
    onChange('username', cleaned);
  };

  return (
    <div className="editorSectionCard">
      <div className="editorSectionHeader">
        <h3>Basic Information</h3>
        <p>Edit your name, unique handle, professional headline, and location.</p>
      </div>

      <div className="editorFormGrid">
        <div className="formGroup">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            placeholder="e.g. Manas"
            value={data.firstName || ''}
            onChange={(e) => onChange('firstName', e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="middleName">Middle Name (Optional)</label>
          <input
            id="middleName"
            type="text"
            placeholder="e.g. Ranjan"
            value={data.middleName || ''}
            onChange={(e) => onChange('middleName', e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            placeholder="e.g. Das"
            value={data.lastName || ''}
            onChange={(e) => onChange('lastName', e.target.value)}
          />
        </div>

        {/* Custom Username Field with Live Checker & Rate Limit */}
        <div className="formGroup fullWidth">
          <div className="usernameLabelRow">
            <label htmlFor="username">Username (Profile URL Handle)</label>
            <span className={`usernameAttemptsPill ${changesRemaining === 0 ? 'exhausted' : ''}`}>
              {changesRemaining} of 2 changes left (15-day window)
            </span>
          </div>

          <div className={`profileUsernameInputWrap ${availability ? (availability.available ? 'valid' : 'invalid') : ''}`}>
            <span className="profileUsernamePrefix">https://arcturus-connexa.vercel.app/profile/</span>
            <input
              id="username"
              type="text"
              placeholder="e.g. @minus-dev"
              maxLength={30}
              value={data.username || ''}
              onChange={handleUsernameChange}
              disabled={changesRemaining === 0 && data.username === initialUsername}
            />
            <div className="usernameStatusIcon">
              {checking && <FaSpinner className="spinAnimation checkingSpinner" size={16} />}
              {!checking && availability && availability.available && (
                <FaCheckCircle className="statusIconValid" size={16} title={availability.message} />
              )}
              {!checking && availability && !availability.available && (
                <FaTimesCircle className="statusIconInvalid" size={16} title={availability.message} />
              )}
            </div>
          </div>

          {/* Availability Status Message */}
          {availability && (
            <div className={`usernameStatusMessage ${availability.available ? (availability.isCurrent ? 'info' : 'success') : 'error'}`}>
              {availability.available ? (
                availability.isCurrent ? <FaInfoCircle size={13} /> : <FaCheckCircle size={13} />
              ) : (
                <FaTimesCircle size={13} />
              )}
              <span>{availability.message}</span>
            </div>
          )}

          {/* Rate Limit Notice Banner */}
          {changesRemaining === 0 && (
            <div className="usernameLockoutNotice">
              <FaLock size={14} />
              <span>
                You have used all 2 username changes for this 15-day window. Next change available on {nextChangeDate || 'soon'}.
              </span>
            </div>
          )}

          <span className="profileUsernameHint">
            Allowed: letters, numbers, <code>@</code>, <code>$</code>, <code>-</code>, and <code>_</code> (3–30 characters).
          </span>
        </div>

        <div className="formGroup fullWidth">
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            type="text"
            placeholder="e.g. Full-Stack Developer | React & Node.js"
            value={data.headline || ''}
            onChange={(e) => onChange('headline', e.target.value)}
          />
        </div>

        <div className="formGroup fullWidth">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            placeholder="e.g. Bhubaneswar, Odisha, India"
            value={data.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoEditor;
