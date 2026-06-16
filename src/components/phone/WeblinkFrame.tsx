import { useState, useEffect } from 'react';
import './WeblinkFrame.css';

const MAPS_SEARCH_PREFIX = 'https://www.google.com/maps/search/?api=1&query=';

function toIframeSrc(src: string): string {
  if (src.startsWith(MAPS_SEARCH_PREFIX)) {
    const q = src.slice(MAPS_SEARCH_PREFIX.length);
    return `https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_MAPS_API_KEY}&q=${q}`;
  }
  return src;
}

export function WeblinkFrame({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);
  const iframeSrc = toIframeSrc(src);

  useEffect(() => {
    setLoading(true);
  }, [src]);

  return (
    <div className="phone-weblink-wrapper">
      {loading && (
        <div className="phone-weblink-loader">
          <div className="phone-weblink-spinner" />
        </div>
      )}
      <iframe
        className="phone-weblink-frame"
        src={iframeSrc}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
