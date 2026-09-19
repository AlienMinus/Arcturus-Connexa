import React, { useEffect, useRef } from 'react';

const SidebarAd = () => {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current || adRef.current.dataset.loaded === 'true') return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.dataset.loaded = 'true';
    } catch (error) {
      console.warn('AdSense sidebar slot could not load:', error);
    }
  }, []);

  return (
    <section className="sidebarAdCard" aria-label="Advertisement">
      <span className="sidebarAdLabel">Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle sidebarAdSlot"
        style={{ display: 'block' }}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
        data-ad-client="ca-pub-7581861713562502"
        data-ad-slot="9369428366"
      />
    </section>
  );
};

export default SidebarAd;
