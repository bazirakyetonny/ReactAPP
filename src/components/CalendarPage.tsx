import { useState, useEffect, useRef } from 'react';
import type { ThemeColors } from '../types';

interface CalendarPageProps {
  themeColors?: ThemeColors;
}

const SLOT_H = 40; // px per hour row
const SCROLL_ID = 'cal-scroll';

export function CalendarPage({ themeColors }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const headerBg = themeColors?.primaryColor ?? '#1F68A8';
  const border   = themeColors?.borderColor ?? '#e5e7eb';
  const muted    = themeColors?.secondaryColor ?? '#9ca3af';
  const accent   = themeColors?.accentColor ?? '#ef4444';

  const now = new Date();
  const isToday = currentDate.toDateString() === now.toDateString();

  useEffect(() => {
    if (isToday && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (now.getHours() - 2) * SLOT_H);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday]);

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  const indicatorOffset = isToday ? (now.getMinutes() / 60) * SLOT_H : -1;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "10px",
      overflow: 'hidden',
    }}>

      {/* hide scrollbar across browsers */}
      <style>{`
        #${SCROLL_ID}::-webkit-scrollbar { display: none; }
        #${SCROLL_ID} { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* ── Date header ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: headerBg, padding: '0 8px', height: '42px', borderRadius: '10px',
      }}>
        <button disabled style={{
          background: 'none', border: 'none', cursor: 'default',
          color: 'white', fontSize: '20px', lineHeight: 1,
          padding: '4px 8px', userSelect: 'none', pointerEvents: 'none',
        }}>‹</button>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
          {formatDate(currentDate)}
        </span>
        <button disabled style={{
          background: 'none', border: 'none', cursor: 'default',
          color: 'white', fontSize: '20px', lineHeight: 1,
          padding: '4px 8px', userSelect: 'none', pointerEvents: 'none',
        }}>›</button>
      </div>

      {/* ── Hour grid ── */}
      <div id={SCROLL_ID} ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
        {Array.from({ length: 24 }, (_, hour) => {
          const isCurrentHour = isToday && hour === now.getHours();
          const label = hour.toString().padStart(2, '0') + ':00';

          return (
            <div key={hour} style={{
              display: 'flex', alignItems: 'center',
              height: `${SLOT_H}px`, position: 'relative',
            }}>
              {/* Time label */}
              <div style={{
                width: '52px', flexShrink: 0,
                paddingLeft: '8px', fontSize: '11px',
                color: muted, lineHeight: 1, userSelect: 'none',
              }}>
                {label}
              </div>

              {/* Line + event area */}
              <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                {/* separator line centred with the time label */}
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  top: '50%', height: '1px',
                  backgroundColor: '#dcdbd9',
                  transform: 'translateY(-50%)',
                }} />

                {/* current-time indicator */}
                {isCurrentHour && indicatorOffset >= 0 && (
                  <>
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      top: `${indicatorOffset}px`, height: '2px',
                      backgroundColor: '#a0a1a4', zIndex: 1,
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: '-5px', top: `${indicatorOffset - 4}px`,
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#a0a1a4', zIndex: 2,
                    }} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
