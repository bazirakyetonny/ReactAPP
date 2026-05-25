import { useState } from 'react';
import type { ThemeColors } from '../types';

interface MyActivityPageProps {
  themeColors?: ThemeColors;
}

type Tab = 'Messages' | 'Requests';

export function MyActivityPage({ themeColors }: MyActivityPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Messages');

  const activeBg = themeColors?.primaryColor ?? '#5B87A8';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Toggle buttons ── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        flexShrink: 0,
      }}>
        {(['Messages', 'Requests'] as Tab[]).map(tab => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? activeBg : '#e1e1e1',
                color: isActive ? '#ffffff' : '#888888',
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Chat body — empty state ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '13px',
        userSelect: 'none',
      }}>
        No Messages Yet
      </div>

    </div>
  );
}
