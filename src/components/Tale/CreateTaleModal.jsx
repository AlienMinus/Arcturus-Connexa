import React, { useState, useRef } from 'react';
import {
  FaTimes,
  FaFont,
  FaImage,
  FaCamera,
  FaSmile,
  FaPalette,
  FaSpinner,
  FaCheck,
  FaTrashAlt,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { buildApiUrl } from '../../utils/api';
import './CreateTaleModal.css';

const BACKGROUND_GRADIENTS = [
  { name: 'Arcturus Blue', value: 'linear-gradient(135deg, #0a66c2, #004182)' },
  { name: 'Royal Purple', value: 'linear-gradient(135deg, #6366f1, #a855f7)' },
  { name: 'Sunset Horizon', value: 'linear-gradient(135deg, #f97316, #ec4899)' },
  { name: 'Emerald Growth', value: 'linear-gradient(135deg, #059669, #0284c7)' },
  { name: 'Midnight Dark', value: 'linear-gradient(135deg, #1e293b, #0f172a)' },
  { name: 'Rose Glow', value: 'linear-gradient(135deg, #e11d48, #fb7185)' },
];

const FONT_STYLES = [
  { name: 'Sans', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Serif', value: 'Georgia, serif' },
  { name: 'Mono', value: 'monospace' },
  { name: 'Cursive', value: 'cursive' },
];

const QUICK_EMOJIS = ['🚀', '💡', '🔥', '👏', '🎉', '❤️', '✨', '🎯', '🤝', '💼'];

const CreateTaleModal = ({ onClose, onTaleCreated }) => {
  const { token } = useAuth();
  const { profile } = useProfile();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('text'); // 'text' | 'media'
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [background, setBackground] = useState(BACKGROUND_GRADIENTS[0].value);
  const [fontFamily, setFontFamily] = useState(FONT_STYLES[0].value);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB');
      return;
    }

    const isVideo = file.type.startsWith('video');
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddEmoji = (emoji) => {
    if (mode === 'text') {
      setText((prev) => prev + emoji);
    } else {
      setCaption((prev) => prev + emoji);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) {
      setError('Please enter your status thought or message.');
      return;
    }
    if (mode === 'media' && !mediaFile) {
      setError('Please select an image or video for your Tale.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (mode === 'text') {
        formData.append('text', text.trim());
        formData.append('background', background);
        formData.append('fontFamily', fontFamily);
      } else {
        if (mediaFile) formData.append('media', mediaFile);
        if (caption.trim()) formData.append('caption', caption.trim());
      }

      const response = await fetch(buildApiUrl('/tales'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Failed to create Tale');
      }

      onTaleCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish Tale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="createTaleModalOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="createTaleCard">
        {/* MODAL HEADER */}
        <div className="createTaleHeader">
          <div className="taleHeaderIdentity">
            <h3>Create a Tale</h3>
            <span className="ephemeralTag">Visible for 24 hours</span>
          </div>
          <button type="button" className="closeTaleBtn" onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* MODE SWITCHER TABS */}
        <div className="taleModeTabs">
          <button
            type="button"
            className={`taleModeBtn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            <FaFont /> <span>Text Status</span>
          </button>
          <button
            type="button"
            className={`taleModeBtn ${mode === 'media' ? 'active' : ''}`}
            onClick={() => setMode('media')}
          >
            <FaImage /> <span>Photo / Video</span>
          </button>
        </div>

        {/* CANVAS PREVIEW AREA */}
        <div className="taleCanvasWrapper">
          {mode === 'text' ? (
            <div
              className="taleTextCanvas"
              style={{ background, fontFamily }}
            >
              <textarea
                className="taleTextarea"
                placeholder="What's happening? Share a quick thought, update, or question..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={300}
                autoFocus
              />
              <span className="charCount">{text.length}/300</span>
            </div>
          ) : (
            <div className="taleMediaCanvas">
              {mediaFile && mediaPreview ? (
                <div className="mediaPreviewBox">
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} controls className="mediaCanvasObject" />
                  ) : (
                    <img src={mediaPreview} alt="Tale Preview" className="mediaCanvasObject" />
                  )}
                  <button
                    type="button"
                    className="removeMediaFloatBtn"
                    onClick={handleRemoveMedia}
                    title="Change media"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              ) : (
                <label className="mediaUploadDropzone">
                  <FaCamera size={36} color="#0a66c2" />
                  <strong>Choose a Photo or Video</strong>
                  <span>Supports PNG, JPG, MP4, WebM (Max 20MB)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {/* Caption Input */}
              {mediaFile && (
                <div className="captionInputWrap">
                  <input
                    type="text"
                    placeholder="Add a caption to your Tale..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={140}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONTROLS BAR */}
        {mode === 'text' && (
          <div className="taleStyleControls">
            {/* Background Palettes */}
            <div className="controlGroup">
              <span className="controlLabel"><FaPalette /> Background:</span>
              <div className="gradientSwatches">
                {BACKGROUND_GRADIENTS.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`gradientSwatch ${background === g.value ? 'active' : ''}`}
                    style={{ background: g.value }}
                    onClick={() => setBackground(g.value)}
                    title={g.name}
                  />
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div className="controlGroup">
              <span className="controlLabel"><FaFont /> Font:</span>
              <div className="fontStylePills">
                {FONT_STYLES.map((f, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`fontPill ${fontFamily === f.value ? 'active' : ''}`}
                    onClick={() => setFontFamily(f.value)}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICK EMOJIS */}
        <div className="taleEmojiRow">
          {QUICK_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              className="quickEmojiBtn"
              onClick={() => handleAddEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        {error && <div className="taleFormError">{error}</div>}

        {/* FOOTER ACTIONS */}
        <div className="createTaleFooter">
          <button type="button" className="cancelTaleBtn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="publishTaleBtn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="taleSpinner" /> Sharing...
              </>
            ) : (
              'Share Tale (24h)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaleModal;

