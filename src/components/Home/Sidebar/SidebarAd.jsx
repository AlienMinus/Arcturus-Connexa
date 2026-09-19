import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaExternalLinkAlt } from 'react-icons/fa';

const SidebarAd = () => {
  const adRef = useRef(null);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (!adRef.current || adRef.current.dataset.loaded === 'true') return;

    const timer = setTimeout(() => {
      if (!adRef.current) return;
      const width = adRef.current.offsetWidth || 0;

      // Ensure the container is mounted and has measurable width
      if (width > 0) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adRef.current.dataset.loaded = 'true';
        } catch (error) {
          // Gracefully fallback to internal sponsored promotion
          setAdFailed(true);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="sidebarAdCard" aria-label="Advertisement">
      <div className="sidebarAdHeader">
        <span className="sidebarAdLabel">Promoted</span>
      </div>

      {!adFailed ? (
        <ins
          ref={adRef}
          className="adsbygoogle sidebarAdSlot"
          style={{ display: 'block', minHeight: '90px' }}
          data-ad-client="ca-pub-7581861713562502"
          data-ad-slot="9369428366"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="sidebarAdFallback">
          <div className="sidebarAdFallbackIcon">
            <FaGraduationCap size={20} color="#0a66c2" />
          </div>
          <h4>Arcturus Executive Masterclasses</h4>
          <p>Master vocal melody, executive presence, and storytelling frameworks with Vinh Giang.</p>
          <Link to="/learning" className="sidebarAdFallbackBtn">
            Explore Courses <FaExternalLinkAlt size={11} />
          </Link>
        </div>
      )}
    </section>
  );
};

export default SidebarAd;
