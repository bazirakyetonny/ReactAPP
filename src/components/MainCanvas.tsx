import './MainCanvas.css';
import { dataStore } from '../data/datastore';
import type { ThemeColors } from '../types';

function SignalBarsIcon() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="currentColor" aria-hidden="true">
      <rect x="0" y="7" width="2.5" height="3" rx="0.4" />
      <rect x="3.5" y="5" width="2.5" height="5" rx="0.4" />
      <rect x="7" y="3" width="2.5" height="7" rx="0.4" />
      <rect x="10.5" y="0" width="2.5" height="10" rx="0.4" />
    </svg>
  );
}

function WifiStatusIcon() {
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <path d="M0.5 3.5C2.5 1.3 4.8 0.2 6.5 0.2C8.2 0.2 10.5 1.3 12.5 3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M2.5 6C3.8 4.7 5.1 4 6.5 4C7.9 4 9.2 4.7 10.5 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4.5 8.2C5.2 7.5 5.8 7.2 6.5 7.2C7.2 7.2 7.8 7.5 8.5 8.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="6.5" cy="9.5" r="0.7" fill="currentColor" />
    </svg>
  );
}

function BatteryStatusIcon() {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
      <rect x="0.5" y="1.5" width="15" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <rect x="16" y="3.5" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="2" y="3" width="11" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="8" r="4" fill="currentColor" />
      <path d="M3 19c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function resolveColor(bgColor: string, themeColors: ThemeColors | undefined): string {
  if (!bgColor) return 'transparent';
  if (bgColor.startsWith('#')) return bgColor;
  return (themeColors as any)?.[bgColor] ?? '#e5e7eb';
}

function PhoneAppHeader() {
  const logo: string | undefined = dataStore.get('OrganisationLogo');
  return (
    <div className="phone-app-header">
      <div className="phone-app-logo">
        {logo
          ? <img src={logo} alt="Organisation logo" className="phone-app-logo-img" />
          : <div className="phone-app-logo-placeholder" />
        }
      </div>
      <div className="phone-app-profile">
        <ProfileIcon />
      </div>
    </div>
  );
}

interface TileGridsProps {
  tileGrids: any[];
  themeColors: ThemeColors | undefined;
  selectedTileId?: string | null;
  onSelectTile?: (id: string) => void;
  interactive?: boolean;
  onAddColumn?: (gridId: string, afterColId: string) => void;
}

function TileGrids({
  tileGrids,
  themeColors,
  selectedTileId,
  onSelectTile,
  interactive = false,
  onAddColumn,
}: TileGridsProps) {
  return (
    <>
      {tileGrids.map((grid: any) => {
        const cols: any[] = grid.Columns ?? [];
        const atMax = cols.length >= 3;
        return (
          <div key={grid.InfoId}>
            <div className="phone-tilegrid">
              {cols.map((col: any) => (
                <div key={col.ColId} className="phone-column">
                  {(col.Tiles ?? []).map((tile: any) => {
                    const isPlaceholder = tile._new === true;
                    const bg = resolveColor(tile.BGColor, themeColors);
                    const height = tile.Height ? `${tile.Height}px` : undefined;
                    const isSelected = interactive && selectedTileId === tile.Id;
                    return (
                      <div
                        key={tile.Id}
                        className={`phone-tile-wrap${isSelected ? ' selected' : ''}`}
                        style={{ height, flex: height ? undefined : 1 }}
                        onClick={interactive && onSelectTile ? () => onSelectTile(tile.Id) : undefined}
                      >
                        <div
                          className={`phone-tile${isPlaceholder ? ' phone-tile--placeholder' : ''}`}
                          style={{
                            background: bg,
                            color: tile.Color ?? '#ffffff',
                            textAlign: tile.Align ?? 'center',
                          }}
                        >
                          <span className="phone-tile-text">{tile.Text}</span>
                        </div>
                        {interactive && (
                          <>
                            <button
                              className="phone-tile-options-btn"
                              type="button"
                              aria-label="Tile options"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="12" height="3" viewBox="0 0 12 3" fill="currentColor" aria-hidden="true">
                                <circle cx="1.5" cy="1.5" r="1.5" />
                                <circle cx="6" cy="1.5" r="1.5" />
                                <circle cx="10.5" cy="1.5" r="1.5" />
                              </svg>
                            </button>
                            <button
                              className="phone-tile-delete-btn"
                              type="button"
                              aria-label="Delete tile"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor" aria-hidden="true">
                                <rect x="0" y="0.5" width="10" height="1.5" rx="0.75" />
                              </svg>
                            </button>
                            {!atMax && (
                              <button
                                className="phone-tile-add-btn"
                                type="button"
                                aria-label="Add column to right"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddColumn?.(grid.InfoId, col.ColId);
                                }}
                              >
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                  <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                  <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {interactive && (
              <div className="phone-add-row">
                <button className="phone-add-btn" type="button" aria-label="Add content">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

interface MainCanvasProps {
  themeColors?: ThemeColors;
  infoContent: any[];
  selectedTileId: string | null;
  onSelectTile: (id: string) => void;
  onAddColumn: (gridId: string, afterColId: string) => void;
}

export function MainCanvas({
  themeColors,
  infoContent,
  selectedTileId,
  onSelectTile,
  onAddColumn,
}: MainCanvasProps) {
  const tileGrids = infoContent.filter((block: any) => block.InfoType === 'TileGrid');

  return (
    <main className="app-canvas">
      <div className="canvas-stage">
        <div className="phone-frame">
          <div className="phone-status-bar">
            <span className="phone-time">9:27</span>
            <div className="phone-status-icons">
              <SignalBarsIcon />
              <WifiStatusIcon />
              <BatteryStatusIcon />
            </div>
          </div>
          <PhoneAppHeader />
          <div className="phone-screen">
            <TileGrids
              tileGrids={tileGrids}
              themeColors={themeColors}
              selectedTileId={selectedTileId}
              onSelectTile={onSelectTile}
              interactive={true}
              onAddColumn={onAddColumn}
            />
          </div>
        </div>
      </div>

      {/* Page thumbnail */}
      <div className="page-thumbnails">
        <div className="page-thumb-clip">
          <div className="phone-frame page-thumb-frame" style={{ width: '240px' }}>
            <div className="phone-status-bar">
              <span className="phone-time">9:27</span>
              <div className="phone-status-icons">
                <SignalBarsIcon />
                <WifiStatusIcon />
                <BatteryStatusIcon />
              </div>
            </div>
            <PhoneAppHeader />
            <div className="phone-screen">
              <TileGrids
                tileGrids={tileGrids}
                themeColors={themeColors}
                interactive={false}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
