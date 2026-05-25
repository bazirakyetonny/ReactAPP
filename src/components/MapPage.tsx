import { useState, useEffect } from 'react';
import type { ThemeColors } from '../types';

interface MapPageProps {
  themeColors?: ThemeColors;
}

const FALLBACK_LAT = 52.0907;
const FALLBACK_LNG = 5.1214;

export function MapPage({ themeColors }: MapPageProps) {
  const [mapSrc, setMapSrc] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const spinnerColor = themeColors?.primaryColor ?? '#1F68A8';

  useEffect(() => {
    const apiKey = import.meta.env.VITE_MAPS_API_KEY ?? '';

    function buildSrc(lat: number, lng: number) {
      return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=18`;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setMapSrc(buildSrc(pos.coords.latitude, pos.coords.longitude)),
      ()    => setMapSrc(buildSrc(FALLBACK_LAT, FALLBACK_LNG)),
    );
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* ── Spinner (shown until iframe fires onLoad) ── */}
      {!mapLoaded && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 1000,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: `3px solid #e5e7eb`,
            borderTopColor: spinnerColor,
            animation: 'map-spin 0.75s linear infinite',
          }} />
        </div>
      )}

      {/* ── Google Maps iframe ── */}
      {mapSrc && (
        <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          frameBorder={0}
          allowFullScreen
          loading="lazy"
          onLoad={() => setMapLoaded(true)}
          style={{ display: 'block', border: 'none', height: '100%' }}
        />
      )}

      <style>{`@keyframes map-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
