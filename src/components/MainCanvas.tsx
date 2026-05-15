import { useState, useRef, useEffect } from 'react';
import './MainCanvas.css';
import { dataStore } from '../data/datastore';
import type { ThemeColors } from '../types';

const SNAP_POINTS = [80, 120, 160];
const TILE_H = 80;
const TILE_GAP = 6;
// Heights matching 1, 2, 3 stacked 80px tiles with 6px gaps between them
const SPLIT_SNAPS = [TILE_H, TILE_H * 2 + TILE_GAP, TILE_H * 3 + TILE_GAP * 2]; // [80, 166, 252]

function snapHeight(raw: number): number {
  const clamped = Math.max(80, raw);
  return SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );
}

function snapSplit(raw: number): number {
  return SPLIT_SNAPS.reduce((prev, curr) =>
    Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev
  );
}


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

interface SplitPreview {
  gridId: string;
  oppositeColId: string;
  count: number; // 1 = no extra tiles, 2 = 1 skeleton, 3 = 2 skeletons
}

interface TileGridsProps {
  tileGrids: any[];
  themeColors: ThemeColors | undefined;
  selectedTileId?: string | null;
  onSelectTile?: (id: string) => void;
  interactive?: boolean;
  onAddColumn?: (gridId: string, afterColId: string) => void;
  onDeleteTile?: (gridId: string, colId: string, tileId: string) => void;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onResizeDragStart?: (tileId: string, startY: number, startHeight: number) => void;
  activeDragTileId?: string | null;
  splitPreview?: SplitPreview | null;
}

function TileGrids({
  tileGrids,
  themeColors,
  selectedTileId,
  onSelectTile,
  interactive = false,
  onAddColumn,
  onDeleteTile,
  onEditTile,
  onResizeDragStart,
  activeDragTileId,
  splitPreview,
}: TileGridsProps) {
  return (
    <>
      {tileGrids.map((grid: any) => {
        const cols: any[] = grid.Columns ?? [];
        const atMax = cols.length >= 3;
        const canAddColumn =
          !atMax &&
          !(cols.length === 2 && cols.some((c: any) => (c.Tiles ?? []).length > 1));
        return (
          <div key={grid.InfoId}>
            <div className="phone-tilegrid">
              {cols.map((col: any) => {
                const canResize =
                  (cols.length === 1 && (col.Tiles ?? []).length === 1) ||
                  (cols.length === 2 && cols.every((c: any) => (c.Tiles ?? []).length === 1));
                const isSplitOpposite = !!(
                  splitPreview &&
                  grid.InfoId === splitPreview.gridId &&
                  col.ColId === splitPreview.oppositeColId
                );
                return (
                  <div key={col.ColId} className="phone-column">
                    {(col.Tiles ?? []).map((tile: any) => {
                      const isPlaceholder = tile._new === true;
                      const bg = resolveColor(tile.BGColor, themeColors);
                      const height = `${tile.Height ?? 80}px`;
                      const isSelected = interactive && selectedTileId === tile.Id;
                      const isDraggingThis = activeDragTileId === tile.Id;
                      const hasIcon = !!tile.IconSVG;
                      const hasText = !!tile.Text;
                      const showDel = isSelected && !isDraggingThis && hasIcon && hasText;

                      const delBtn = (onClick: (e: React.MouseEvent) => void, label: string) => (
                        <button
                          className="phone-tile-element-delete"
                          type="button"
                          aria-label={label}
                          onClick={(e) => { e.stopPropagation(); onClick(e); }}
                        >
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
                            <line x1="1" y1="1" x2="5" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="5" y1="1" x2="1" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                        </button>
                      );

                      return (
                        <div
                          key={tile.Id}
                          className={`phone-tile-wrap${isSelected ? ' selected' : ''}`}
                          style={{ height }}
                          onClick={interactive && onSelectTile ? () => onSelectTile(tile.Id) : undefined}
                        >
                          <div
                            className={`phone-tile${isPlaceholder ? ' phone-tile--placeholder' : ''}`}
                            style={{
                              background: bg,
                              color: tile.Color ?? '#ffffff',
                              textAlign: tile.Align ?? 'center',
                              alignItems: tile.Align === 'left' ? 'flex-start'
                                : tile.Align === 'right' ? 'flex-end'
                                : 'center',
                              justifyContent: tile.Align === 'left' ? 'flex-start' : 'center',
                            }}
                          >
                            {hasIcon && (
                              <div className={`phone-tile-element${showDel ? ' phone-tile-element--deletable' : ''}`}>
                                <span className="phone-tile-icon" dangerouslySetInnerHTML={{ __html: tile.IconSVG }} />
                                {showDel && delBtn(() => onEditTile?.(tile.Id, { IconSVG: null, IconId: null }), 'Remove icon')}
                              </div>
                            )}
                            {hasText && (
                              <div className={`phone-tile-element${showDel ? ' phone-tile-element--deletable' : ''}`}>
                                <span className="phone-tile-text">{tile.Text}</span>
                                {showDel && delBtn(() => onEditTile?.(tile.Id, { Text: '' }), 'Remove text')}
                              </div>
                            )}
                          </div>

                          {interactive && !isDraggingThis && (
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTile?.(grid.InfoId, col.ColId, tile.Id);
                                }}
                              >
                                <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor" aria-hidden="true">
                                  <rect x="0" y="0.5" width="10" height="1.5" rx="0.75" />
                                </svg>
                              </button>
                              {canAddColumn && (
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

                          {/* Resize zone — visible for solo tile or 2-col/1-tile layout */}
                          {interactive && canResize && isSelected && (
                            <div
                              className="phone-tile-resize-zone"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onResizeDragStart?.(tile.Id, e.clientY, tile.Height ?? 80);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                    {/* Skeleton tiles shown in the opposite column during a split drag */}
                    {isSplitOpposite && Array.from({ length: (splitPreview?.count ?? 1) - 1 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="phone-tile-wrap" style={{ height: `${TILE_H}px` }}>
                        <div className="phone-tile phone-tile--skeleton" />
                      </div>
                    ))}
                  </div>
                );
              })}
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
  onDeleteTile: (gridId: string, colId: string, tileId: string) => void;
  onEditTile: (tileId: string, patch: Record<string, any>) => void;
  onAddTilesToColumn?: (gridId: string, colId: string, count: number) => void;
  onAddStandaloneTile?: () => void;
}

export function MainCanvas({
  themeColors,
  infoContent,
  selectedTileId,
  onSelectTile,
  onAddColumn,
  onDeleteTile,
  onEditTile,
  onAddTilesToColumn,
  onAddStandaloneTile,
}: MainCanvasProps) {
  const tileGrids = infoContent.filter((block: any) => block.InfoType === 'TileGrid');

  const [dragTileId, setDragTileId] = useState<string | null>(null);
  const [splitPreview, setSplitPreview] = useState<SplitPreview | null>(null);

  // Stable refs so the drag effect never needs to re-run due to callback identity changes
  const onEditTileRef = useRef(onEditTile);
  const onAddTilesToColumnRef = useRef(onAddTilesToColumn);
  const onAddStandaloneTileRef = useRef(onAddStandaloneTile);
  useEffect(() => { onEditTileRef.current = onEditTile; });
  useEffect(() => { onAddTilesToColumnRef.current = onAddTilesToColumn; });
  useEffect(() => { onAddStandaloneTileRef.current = onAddStandaloneTile; });

  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    split: {
      gridId: string;
      oppositeColId: string;
      currentCount: number;
      maxCount: number; // highest zone reached during this drag
    } | null;
  } | null>(null);

  function handleResizeDragStart(tileId: string, startY: number, startHeight: number) {
    setDragTileId(tileId);

    let splitInfo: { gridId: string; oppositeColId: string } | null = null;
    for (const block of infoContent) {
      if (block.InfoType !== 'TileGrid') continue;
      const cols: any[] = block.Columns ?? [];
      if (cols.length !== 2) continue;
      const dragCol = cols.find((c: any) => (c.Tiles ?? []).some((t: any) => t.Id === tileId));
      if (!dragCol || (dragCol.Tiles ?? []).length !== 1) continue;
      const oppCol = cols.find((c: any) => c.ColId !== dragCol.ColId);
      if (!oppCol || (oppCol.Tiles ?? []).length !== 1) continue;
      splitInfo = { gridId: block.InfoId, oppositeColId: oppCol.ColId };
      break;
    }

    dragRef.current = {
      startY,
      startHeight,
      split: splitInfo ? { ...splitInfo, currentCount: 1, maxCount: 1 } : null,
    };
    if (splitInfo) setSplitPreview({ ...splitInfo, count: 1 });
  }

  useEffect(() => {
    if (!dragTileId) return;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;

      if (dragRef.current.split) {
        const raw = Math.max(
          SPLIT_SNAPS[0],
          Math.min(SPLIT_SNAPS[SPLIT_SNAPS.length - 1],
            dragRef.current.startHeight + (e.clientY - dragRef.current.startY) * 0.45)
        );
        const count = SPLIT_SNAPS.indexOf(snapSplit(raw)) + 1;
        if (count !== dragRef.current.split.currentCount) {
          dragRef.current.split.currentCount = count;
          if (count > dragRef.current.split.maxCount) {
            dragRef.current.split.maxCount = count;
          }
          setSplitPreview(prev => prev ? { ...prev, count } : null);
        }
        onEditTileRef.current(dragTileId!, { Height: Math.round(raw) });
      } else {
        const raw = dragRef.current.startHeight + (e.clientY - dragRef.current.startY) * 0.55;
        onEditTileRef.current(dragTileId!, { Height: snapHeight(raw) });
      }
    }

    function onMouseUp() {
      if (dragRef.current?.split) {
        const { gridId, oppositeColId, currentCount, maxCount } = dragRef.current.split;
        if (currentCount > 1) {
          onAddTilesToColumnRef.current?.(gridId, oppositeColId, currentCount - 1);
        }
        const passed = maxCount - currentCount;
        for (let i = 0; i < passed; i++) {
          onAddStandaloneTileRef.current?.();
        }
      }
      setDragTileId(null);
      setSplitPreview(null);
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragTileId]);

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
          <div className={`phone-screen${dragTileId ? ' phone-screen--dragging' : ''}`}>
            {/* Top add-row — always visible when the structure has no content */}
            <div className={`phone-add-row${infoContent.length === 0 ? ' phone-add-row--visible' : ''}`}>
              <button className="phone-add-btn" type="button" aria-label="Add content block">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <TileGrids
              tileGrids={tileGrids}
              themeColors={themeColors}
              selectedTileId={selectedTileId}
              onSelectTile={onSelectTile}
              interactive={true}
              onAddColumn={onAddColumn}
              onDeleteTile={onDeleteTile}
              onEditTile={onEditTile}
              onResizeDragStart={handleResizeDragStart}
              activeDragTileId={dragTileId}
              splitPreview={splitPreview}
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
