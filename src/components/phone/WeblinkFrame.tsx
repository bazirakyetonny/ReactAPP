import { useState, useEffect } from 'react';
import './WeblinkFrame.css';

export function WeblinkFrame({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);

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
        src={src}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
