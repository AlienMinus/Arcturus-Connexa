import React from 'react';
import { FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

const DocumentLightboxModal = ({ doc, onClose }) => {
  if (!doc) return null;

  return (
    <div className="adminModalOverlay" onClick={onClose}>
      <div className="adminLightboxCard" onClick={(e) => e.stopPropagation()}>
        <div className="lightboxHeader">
          <div>
            <h3>{doc.title}</h3>
            <p>{doc.documentType} · {doc.originalName}</p>
          </div>
          <button type="button" className="lightboxCloseBtn" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>
        <div className="lightboxBody">
          <img src={doc.url} alt={doc.title} className="lightboxImage" />
        </div>
        <div className="lightboxFooter">
          <a href={doc.url} target="_blank" rel="noreferrer" className="adminPrimaryBtn">
            <FaExternalLinkAlt size={12} /> Open Full Size in New Tab
          </a>
          <button type="button" className="adminSecondaryBtn" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentLightboxModal;

