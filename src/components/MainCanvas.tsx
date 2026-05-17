import { useState, useRef, useEffect } from 'react';
import './MainCanvas.css';
import { dataStore } from '../data/datastore';
import type { ThemeColors, ThemeIcon } from '../types';

const SNAP_POINTS = [80, 120, 160];
const TILE_H = 80;
const TILE_GAP = 6;
// Heights matching 1, 2, 3 stacked 80px tiles with 6px gaps between them
const SPLIT_SNAPS = [TILE_H, TILE_H * 2 + TILE_GAP, TILE_H * 3 + TILE_GAP * 2]; // [80, 166, 252]

const SNAP_ZONE = 12; // px — within this distance of a snap point, snap to it during drag

function snapHeight(raw: number): number {
  const clamped = Math.max(80, raw);
  return SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );
}

function softSnapHeight(raw: number): number {
  const clamped = Math.max(80, raw);
  const nearest = SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );
  return Math.abs(nearest - clamped) <= SNAP_ZONE ? nearest : Math.round(clamped);
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

function resolveIconSVG(tile: any, themeIcons: ThemeIcon[] | undefined): string | null {
  if (themeIcons) {
    // From sidebar picker — matched by code name (exact)
    if (tile.IconCodeName) {
      const match = themeIcons.find((i) => i.IconCodeName === tile.IconCodeName);
      if (match) return match.IconSVG;
    }
    // From page data — tile.Icon is a lowercase code; match case-insensitively
    if (tile.Icon) {
      const lower = (tile.Icon as string).toLowerCase();
      const match = themeIcons.find(
        (i) =>
          (i.IconCodeName && i.IconCodeName.toLowerCase() === lower) ||
          i.IconName.toLowerCase() === lower,
      );
      if (match) return match.IconSVG;
    }
  }
  return tile.IconSVG ?? null;
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

function BackArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneLinkedHeader({ pageName, onBack }: { pageName: string; onBack: () => void }) {
  return (
    <div className="phone-app-header phone-linked-header">
      <button className="phone-back-btn" type="button" aria-label="Go back" onClick={onBack}>
        <BackArrowIcon />
      </button>
      <span className="phone-linked-page-name">{pageName}</span>
    </div>
  );
}

interface SplitPreview {
  gridId: string;
  oppositeColId: string;
  count: number;
}

interface FreeResizePreview {
  gridId: string;
  oppColId: string;
  activeCount: number;
  extraSkeletonCount: number;
}

export interface BlockInsertPreview {
  insertBeforeInfoId: string | null; // null = append after all blocks
}

export interface TileDropPreview {
  targetGridId: string;
  targetColId: string;
  insertIndex: number;               // insert before this index; = tiles.length means append
  newColumn: boolean;                // add tile as a new column
  insertColAfterColId: string | null; // for newColumn: null=prepend, colId=insert after
  isColumnSwap: boolean;             // swap two columns in the same grid
  valid: boolean;
}

// Inject a skeleton column placeholder into the cols array for the new-column drop preview.
function getColsForRender(
  cols: any[],
  gridId: string,
  preview: TileDropPreview | null | undefined,
): Array<any | { _newColSkeleton: true }> {
  if (!preview || !preview.newColumn || preview.targetGridId !== gridId || !preview.valid) return cols;
  const result: Array<any | { _newColSkeleton: true }> = [...cols];
  const afterIdx = preview.insertColAfterColId
    ? cols.findIndex((c: any) => c.ColId === preview.insertColAfterColId)
    : -1;
  result.splice(afterIdx + 1, 0, { _newColSkeleton: true as const });
  return result;
}

// Inject a drop-slot placeholder into the tiles array for the within-column drop preview.
function getTilesForRender(
  col: any,
  gridId: string,
  preview: TileDropPreview | null | undefined,
): Array<{ tile: any; origIndex: number } | { _slot: true }> {
  const tiles: any[] = col.Tiles ?? [];
  const withIdx = tiles.map((tile, i) => ({ tile, origIndex: i }));
  if (
    !preview || preview.newColumn || preview.isColumnSwap || !preview.valid ||
    preview.targetColId !== col.ColId || preview.targetGridId !== gridId
  ) {
    return withIdx;
  }
  const result: Array<{ tile: any; origIndex: number } | { _slot: true }> = [...withIdx];
  result.splice(preview.insertIndex, 0, { _slot: true as const });
  return result;
}

interface TileGridsProps {
  tileGrids: any[];
  themeColors: ThemeColors | undefined;
  themeIcons?: ThemeIcon[];
  selectedTileId?: string | null;
  onSelectTile?: (id: string) => void;
  interactive?: boolean;
  onAddColumn?: (gridId: string, afterColId: string) => void;
  onDeleteTile?: (gridId: string, colId: string, tileId: string) => void;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onResizeDragStart?: (tileId: string, startY: number, startHeight: number) => void;
  activeDragTileId?: string | null;
  splitPreview?: SplitPreview | null;
  freeResizePreview?: FreeResizePreview | null;
  // Tile position drag
  onColRef?: (colId: string, el: HTMLElement | null) => void;
  onGridRef?: (gridId: string, el: HTMLElement | null) => void;
  onTileDragStart?: (
    e: React.MouseEvent, el: HTMLElement,
    tileId: string, gridId: string, colId: string,
    tileIndex: number, colTileCount: number, gridColCount: number,
    tile: any,
  ) => void;
  tileDragId?: string | null;
  tileDropPreview?: TileDropPreview | null;
  tileDragFromGridId?: string | null;
  blockInsertPreview?: BlockInsertPreview | null;
  isDraggingTile?: boolean;
  onTileNavigate?: (pageId: string) => void;
}

function TileGrids({
  tileGrids,
  themeColors,
  themeIcons,
  selectedTileId,
  onSelectTile,
  interactive = false,
  onAddColumn,
  onDeleteTile,
  onEditTile,
  onResizeDragStart,
  activeDragTileId,
  splitPreview,
  freeResizePreview,
  onColRef,
  onGridRef,
  onTileDragStart,
  tileDragId,
  tileDropPreview,
  tileDragFromGridId,
  blockInsertPreview,
  isDraggingTile = false,
  onTileNavigate,
}: TileGridsProps) {
  return (
    <>
      {tileGrids.map((grid: any, gridIdx: number) => {
        const cols: any[] = grid.Columns ?? [];
        const atMax = cols.length >= 3;
        const canAddColumn =
          !atMax &&
          !(cols.length === 2 && cols.some((c: any) => (c.Tiles ?? []).length > 1));

        const renderedCols = getColsForRender(cols, grid.InfoId, tileDropPreview);
        // When a new column will be created here on drop, existing tiles reset to TILE_H.
        const previewResetHeight = !!(
          tileDropPreview?.newColumn &&
          tileDropPreview.valid &&
          tileDropPreview.targetGridId === grid.InfoId
        );
        // When dropping into the multi-tile col of a 2-col grid, stretch the long tile
        // in the opposite column to show the exact height it will have after drop.
        // Only applies for cross-grid drops (tile count actually increases); same-grid
        // reorders leave the long tile count unchanged so no stretch should show.
        let previewLongColId: string | null = null;
        let previewLongHeight: number | null = null;
        if (
          tileDropPreview && !tileDropPreview.newColumn && tileDropPreview.valid &&
          tileDropPreview.targetGridId === grid.InfoId && cols.length === 2 &&
          tileDragFromGridId !== grid.InfoId
        ) {
          const _targetCol = cols.find((c: any) => c.ColId === tileDropPreview.targetColId);
          const _oppCol    = cols.find((c: any) => c.ColId !== tileDropPreview.targetColId);
          if (_targetCol && _oppCol && (_oppCol.Tiles ?? []).length === 1) {
            const newCount = (_targetCol.Tiles ?? []).length + 1;
            previewLongColId = _oppCol.ColId;
            previewLongHeight = newCount * TILE_H + Math.max(0, newCount - 1) * TILE_GAP;
          }
        }

        // The add-row after this grid doubles as the inter-block drop zone.
        // For all grids except the last it maps to "insert before next grid";
        // for the last grid it maps to "append after all grids" (null).
        const dropZoneId = gridIdx < tileGrids.length - 1
          ? tileGrids[gridIdx + 1].InfoId
          : null;
        const isAddRowDropActive = isDraggingTile &&
          blockInsertPreview != null &&
          blockInsertPreview.insertBeforeInfoId === dropZoneId;

        return (
          <div key={grid.InfoId}>
            <div
              className="phone-tilegrid"
              ref={(el) => onGridRef?.(grid.InfoId, el as HTMLElement | null)}
            >
              {renderedCols.map((colOrSkel: any) => {
                if (colOrSkel._newColSkeleton) {
                  return <div key="new-col-skel" className="phone-column phone-column--new-col-preview" />;
                }

                const col = colOrSkel;
                const canResize =
                  (cols.length === 1 && (col.Tiles ?? []).length === 1) ||
                  (cols.length === 2 && (col.Tiles ?? []).length === 1);
                const isSplitOpposite = !!(
                  splitPreview &&
                  grid.InfoId === splitPreview.gridId &&
                  col.ColId === splitPreview.oppositeColId
                );
                const isFreeResizeOppCol = !!(
                  freeResizePreview &&
                  grid.InfoId === freeResizePreview.gridId &&
                  col.ColId === freeResizePreview.oppColId
                );

                const isDropTargetCol = !!(
                  tileDropPreview &&
                  tileDropPreview.targetGridId === grid.InfoId &&
                  tileDropPreview.targetColId === col.ColId &&
                  !tileDropPreview.newColumn
                );
                const dropColClass = isDropTargetCol
                  ? (tileDropPreview!.valid ? ' phone-column--drop-valid' : ' phone-column--drop-invalid')
                  : '';

                const tilesForRender = getTilesForRender(col, grid.InfoId, tileDropPreview);

                return (
                  <div
                    key={col.ColId}
                    className={`phone-column${dropColClass}`}
                    ref={(el) => onColRef?.(col.ColId, el as HTMLElement | null)}
                  >
                    {tilesForRender.map((item: any) => {
                      if (item._slot) {
                        return (
                          <div key="drop-slot" className="phone-tile-drop-slot" style={{ height: `${TILE_H}px` }} />
                        );
                      }

                      const { tile, origIndex: tileIndex } = item;
                      const isPlaceholder = tile._new === true;
                      const hasNoBg = !tile.BGColor && !tile.BGImageUrl;
                      const bg = resolveColor(tile.BGColor, themeColors);
                      const height = previewResetHeight
                        ? `${TILE_H}px`
                        : (col.ColId === previewLongColId && previewLongHeight !== null)
                          ? `${previewLongHeight}px`
                          : `${tile.Height ?? 80}px`;
                      const isSelected = interactive && selectedTileId === tile.Id;
                      const isDraggingThis = activeDragTileId === tile.Id;
                      const isTileDragging = tileDragId === tile.Id;
                      const isGhost = isFreeResizeOppCol && tileIndex >= (freeResizePreview?.activeCount ?? Infinity);
                      // When reordering within the same column the drop-slot already fills the
                      // visual gap, so collapse the source tile to zero height to avoid showing
                      // an extra (phantom) item that makes the column look like it has N+1 tiles.
                      const isSameColReorderSource = isTileDragging &&
                        tileDropPreview != null && tileDropPreview.valid &&
                        !tileDropPreview.newColumn &&
                        tileDropPreview.targetGridId === grid.InfoId &&
                        tileDropPreview.targetColId === col.ColId;
                      const iconSVG = resolveIconSVG(tile, themeIcons);
                      const hasIcon = !!iconSVG;
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
                          className={[
                            'phone-tile-wrap',
                            isSelected ? 'selected' : '',
                            isGhost ? 'phone-tile-wrap--ghost' : '',
                            isTileDragging ? 'phone-tile-wrap--tile-drag-source' : '',
                          ].filter(Boolean).join(' ')}
                          style={isSameColReorderSource ? { height: 0, minHeight: 0, overflow: 'hidden' } : { height }}
                          onClick={interactive && onSelectTile ? () => {
                            onSelectTile(tile.Id);
                            if (tile.Action?.ObjectType === 'Information' && tile.Action?.ObjectId) {
                              onTileNavigate?.(tile.Action.ObjectId);
                            }
                          } : undefined}
                          onDragStart={(e) => e.preventDefault()}
                          onMouseDown={interactive && onTileDragStart ? (e: React.MouseEvent) => {
                            const target = e.target as HTMLElement;
                            if (
                              target.closest('button') ||
                              target.closest('.phone-tile-resize-zone') ||
                              activeDragTileId
                            ) return;
                            onTileDragStart(
                              e, e.currentTarget as HTMLElement,
                              tile.Id, grid.InfoId, col.ColId,
                              tileIndex, (col.Tiles ?? []).length, cols.length,
                              tile,
                            );
                          } : undefined}
                        >
                          <div
                            className={`phone-tile${isPlaceholder ? ' phone-tile--placeholder' : hasNoBg ? ' phone-tile--no-bg' : ''}`}
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
                                <span className="phone-tile-icon" dangerouslySetInnerHTML={{ __html: iconSVG! }} />
                                {showDel && delBtn(() => onEditTile?.(tile.Id, { IconSVG: null, IconId: null, IconCodeName: null }), 'Remove icon')}
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

                          {interactive && canResize && isSelected && (
                            <div
                              className="phone-tile-resize-zone"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const wrapEl = (e.currentTarget as HTMLElement).parentElement!;
                                const actualHeight = wrapEl.getBoundingClientRect().height;
                                onResizeDragStart?.(tile.Id, e.clientY, actualHeight);
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
                    {/* Extra skeleton tiles during free-resize drag when stretching beyond current tile count */}
                    {isFreeResizeOppCol && (freeResizePreview?.extraSkeletonCount ?? 0) > 0 && Array.from({ length: freeResizePreview!.extraSkeletonCount }).map((_, i) => (
                      <div key={`fr-skeleton-${i}`} className="phone-tile-wrap" style={{ height: `${TILE_H}px` }}>
                        <div className="phone-tile phone-tile--skeleton" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className={interactive ? [
              'phone-add-row',
              isDraggingTile ? 'phone-add-row--tile-drop-zone' : '',
              isAddRowDropActive ? 'phone-add-row--tile-drop-zone-active' : '',
            ].filter(Boolean).join(' ') : 'phone-add-row'}>
              {interactive && (
                <button className="phone-add-btn" type="button" aria-label="Add content">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export interface LinkedFrame {
  page: any;
  infoContent: any[];
  onClose: () => void;
  onAddColumn?: (gridId: string, afterColId: string) => void;
  onDeleteTile?: (gridId: string, colId: string, tileId: string) => void;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onAddStandaloneTile?: () => void;
}

interface MainCanvasProps {
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  infoContent: any[];
  selectedTileId: string | null;
  onSelectTile: (id: string) => void;
  onAddColumn: (gridId: string, afterColId: string) => void;
  onDeleteTile: (gridId: string, colId: string, tileId: string) => void;
  onEditTile: (tileId: string, patch: Record<string, any>) => void;
  onAddTilesToColumn?: (gridId: string, colId: string, count: number) => void;
  onAddStandaloneTile?: () => void;
  onFreeResizeRelease?: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, oppColTiles: any[]) => void;
  onTileDrop?: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => void;
  onTileDropAsNewBlock?: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => void;
  linkedFrames?: LinkedFrame[];
  onTileNavigate?: (pageId: string) => void;
}

export function MainCanvas({
  themeColors,
  themeIcons,
  infoContent,
  selectedTileId,
  onSelectTile,
  onAddColumn,
  onDeleteTile,
  onEditTile,
  onAddTilesToColumn,
  onAddStandaloneTile,
  onFreeResizeRelease,
  onTileDrop,
  onTileDropAsNewBlock,
  linkedFrames,
  onTileNavigate,
}: MainCanvasProps) {
  const tileGrids = infoContent.filter((block: any) => block.InfoType === 'TileGrid');

  // ── Thumbnail scale sync ──────────────────────────────────────────────────
  const mainPhoneFrameRef = useRef<HTMLDivElement>(null);
  const [thumbFrameW, setThumbFrameW] = useState(240);
  useEffect(() => {
    const el = mainPhoneFrameRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.offsetWidth;
      if (w > 0) setThumbFrameW(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Resize drag state ─────────────────────────────────────────────────────
  const [dragTileId, setDragTileId] = useState<string | null>(null);
  const [splitPreview, setSplitPreview] = useState<SplitPreview | null>(null);
  const [freeResizePreview, setFreeResizePreview] = useState<FreeResizePreview | null>(null);

  // ── Tile position drag state ──────────────────────────────────────────────
  const [tileDragId, setTileDragId] = useState<string | null>(null);
  const [tileDropPreview, setTileDropPreview] = useState<TileDropPreview | null>(null);
  const [blockInsertPreview, setBlockInsertPreview] = useState<BlockInsertPreview | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Stable refs so effects never need to re-run due to callback identity changes
  const onEditTileRef = useRef(onEditTile);
  const onAddTilesToColumnRef = useRef(onAddTilesToColumn);
  const onAddStandaloneTileRef = useRef(onAddStandaloneTile);
  const onFreeResizeReleaseRef = useRef(onFreeResizeRelease);
  const onTileDropRef = useRef(onTileDrop);
  const onTileDropAsNewBlockRef = useRef(onTileDropAsNewBlock);
  const infoContentRef = useRef(infoContent);
  const themeColorsRef = useRef(themeColors);
  useEffect(() => { onEditTileRef.current = onEditTile; });
  useEffect(() => { onAddTilesToColumnRef.current = onAddTilesToColumn; });
  useEffect(() => { onAddStandaloneTileRef.current = onAddStandaloneTile; });
  useEffect(() => { onFreeResizeReleaseRef.current = onFreeResizeRelease; });
  useEffect(() => { onTileDropRef.current = onTileDrop; });
  useEffect(() => { onTileDropAsNewBlockRef.current = onTileDropAsNewBlock; });
  useEffect(() => { infoContentRef.current = infoContent; });
  useEffect(() => { themeColorsRef.current = themeColors; });

  // Resize drag ref
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    currentHeight: number;
    split: {
      gridId: string;
      oppositeColId: string;
      currentCount: number;
      maxCount: number;
    } | null;
    freeResize: {
      gridId: string;
      oppColId: string;
      oppColTiles: any[];
      initialCount: number;
      currentZoneCount: number;
    } | null;
  } | null>(null);

  // Tile position drag ref
  const tileDragInfoRef = useRef<{
    tileId: string;
    fromGridId: string;
    fromColId: string;
    fromTileIndex: number;
    fromColTileCount: number;
    fromGridColCount: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    hasMoved: boolean;
    ghostWidth: number;
    ghostHeight: number;
    bgColor: string;
    tileColor: string;
    tileData: any;
  } | null>(null);

  // DOM refs for drop-zone hit testing
  const colElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const gridElRefs = useRef<Map<string, HTMLElement>>(new Map());
  // Rects snapshotted at drag-start so preview-induced layout shifts don't corrupt hit-testing
  const colRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());
  const gridRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());

  // ── Resize drag ───────────────────────────────────────────────────────────
  function handleResizeDragStart(tileId: string, startY: number, startHeight: number) {
    setDragTileId(tileId);

    let splitInfo: { gridId: string; oppositeColId: string } | null = null;
    let freeResizeInfo: { gridId: string; oppColId: string; oppColTiles: any[]; initialCount: number; currentZoneCount: number } | null = null;

    for (const block of infoContent) {
      if (block.InfoType !== 'TileGrid') continue;
      const cols: any[] = block.Columns ?? [];
      if (cols.length !== 2) continue;
      const dragCol = cols.find((c: any) => (c.Tiles ?? []).some((t: any) => t.Id === tileId));
      if (!dragCol || (dragCol.Tiles ?? []).length !== 1) continue;
      const oppCol = cols.find((c: any) => c.ColId !== dragCol.ColId);
      if (!oppCol) continue;
      const oppCount = (oppCol.Tiles ?? []).length;
      if (oppCount === 1) {
        splitInfo = { gridId: block.InfoId, oppositeColId: oppCol.ColId };
      } else if (oppCount > 1) {
        const oppTiles = oppCol.Tiles ?? [];
        freeResizeInfo = {
          gridId: block.InfoId,
          oppColId: oppCol.ColId,
          oppColTiles: oppTiles,
          initialCount: oppTiles.length,
          currentZoneCount: oppTiles.length,
        };
      }
      break;
    }

    dragRef.current = {
      startY,
      startHeight,
      currentHeight: startHeight,
      split: splitInfo ? { ...splitInfo, currentCount: 1, maxCount: 1 } : null,
      freeResize: freeResizeInfo,
    };
    if (splitInfo) setSplitPreview({ ...splitInfo, count: 1 });
    if (freeResizeInfo) setFreeResizePreview({ gridId: freeResizeInfo.gridId, oppColId: freeResizeInfo.oppColId, activeCount: freeResizeInfo.initialCount, extraSkeletonCount: 0 });
  }

  useEffect(() => {
    if (!dragTileId) return;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;

      if (dragRef.current.split) {
        const raw = Math.min(SPLIT_SNAPS[SPLIT_SNAPS.length - 1], Math.max(TILE_H, dragRef.current.startHeight + (e.clientY - dragRef.current.startY)));
        const count = SPLIT_SNAPS.indexOf(snapSplit(raw)) + 1;
        if (count !== dragRef.current.split.currentCount) {
          dragRef.current.split.currentCount = count;
          if (count > dragRef.current.split.maxCount) {
            dragRef.current.split.maxCount = count;
          }
          setSplitPreview(prev => prev ? { ...prev, count } : null);
        }
        onEditTileRef.current(dragTileId!, { Height: Math.round(raw) });
      } else if (dragRef.current.freeResize) {
        const raw = Math.min(SPLIT_SNAPS[SPLIT_SNAPS.length - 1], Math.max(TILE_H, dragRef.current.startHeight + (e.clientY - dragRef.current.startY)));
        dragRef.current.currentHeight = Math.round(raw);
        const { initialCount } = dragRef.current.freeResize;
        const zoneCount = SPLIT_SNAPS.indexOf(snapSplit(raw)) + 1;
        if (zoneCount !== dragRef.current.freeResize.currentZoneCount) {
          dragRef.current.freeResize.currentZoneCount = zoneCount;
          const activeCount = Math.min(zoneCount, initialCount);
          const extraSkeletonCount = Math.max(0, zoneCount - initialCount);
          setFreeResizePreview(prev => prev ? { ...prev, activeCount, extraSkeletonCount } : null);
        }
        onEditTileRef.current(dragTileId!, { Height: dragRef.current.currentHeight });
      } else {
        const raw = Math.min(SNAP_POINTS[SNAP_POINTS.length - 1], Math.max(80, dragRef.current.startHeight + (e.clientY - dragRef.current.startY)));
        dragRef.current.currentHeight = Math.round(raw);
        onEditTileRef.current(dragTileId!, { Height: softSnapHeight(raw) });
      }
    }

    function onMouseUp() {
      if (dragRef.current?.split) {
        const { gridId, oppositeColId, currentCount, maxCount } = dragRef.current.split;
        onEditTileRef.current(dragTileId!, { Height: SPLIT_SNAPS[currentCount - 1] });
        if (currentCount > 1) {
          onAddTilesToColumnRef.current?.(gridId, oppositeColId, currentCount - 1);
        }
        const passed = maxCount - currentCount;
        for (let i = 0; i < passed; i++) {
          onAddStandaloneTileRef.current?.();
        }
      } else if (dragRef.current?.freeResize) {
        const { gridId, oppColId, oppColTiles, initialCount, currentZoneCount } = dragRef.current.freeResize;
        const snapH = SPLIT_SNAPS[currentZoneCount - 1];
        onFreeResizeReleaseRef.current?.(gridId, dragTileId!, snapH, currentZoneCount, initialCount, oppColId, oppColTiles);
      } else if (dragRef.current) {
        onEditTileRef.current(dragTileId!, { Height: snapHeight(dragRef.current.currentHeight) });
      }
      setDragTileId(null);
      setSplitPreview(null);
      setFreeResizePreview(null);
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

  // ── Tile position drag helpers ────────────────────────────────────────────

  function calcInsertIndexInCol(col: any, y: number): number {
    const rect = colRectsSnapshot.current.get(col.ColId);
    if (!rect) return (col.Tiles ?? []).length;
    let cumY = rect.top;
    const tiles: any[] = col.Tiles ?? [];
    for (let i = 0; i < tiles.length; i++) {
      const h = tiles[i].Height ?? TILE_H;
      if (y < cumY + h / 2) return i;
      cumY += h + TILE_GAP;
    }
    return tiles.length;
  }

  function findColByX(cols: any[], x: number): any | null {
    for (const col of cols) {
      const rect = colRectsSnapshot.current.get(col.ColId);
      if (!rect) continue;
      if (x >= rect.left - 4 && x <= rect.right + 4) return col;
    }
    return null;
  }

  function findInsertColAfterColId(cols: any[], x: number): string | null {
    for (let i = cols.length - 1; i >= 0; i--) {
      const rect = colRectsSnapshot.current.get(cols[i].ColId);
      if (!rect) continue;
      if (x > rect.left + rect.width / 2) return cols[i].ColId;
    }
    return null;
  }

  function calcDropTarget(x: number, y: number): TileDropPreview | null {
    const drag = tileDragInfoRef.current;
    if (!drag || !drag.hasMoved) return null;

    const grids = infoContentRef.current.filter((b: any) => b.InfoType === 'TileGrid');

    for (const grid of grids) {
      const rect = gridRectsSnapshot.current.get(grid.InfoId);
      if (!rect) continue;
      if (y < rect.top - 12 || y > rect.bottom + 12 || x < rect.left - 16 || x > rect.right + 16) continue;

      const cols: any[] = grid.Columns ?? [];
      const hoverCol = findColByX(cols, x);
      if (!hoverCol) continue;

      const sameGrid = grid.InfoId === drag.fromGridId;
      const hoverTileCount = (hoverCol.Tiles ?? []).length;

      if (sameGrid) {
        if (hoverCol.ColId === drag.fromColId) {
          // Same column — reorder (only multi-tile columns)
          if (drag.fromColTileCount <= 1) {
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false };
          }
          const insertIndex = calcInsertIndexInCol(hoverCol, y);
          const isSamePos = insertIndex === drag.fromTileIndex || insertIndex === drag.fromTileIndex + 1;
          return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: !isSamePos };
        } else {
          // Different column in same grid
          if (drag.fromColTileCount === 1) {
            // Single-tile column → swap columns
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: true, valid: true };
          }
          // Multi-tile source can't go into the single-tile (long) column
          if (hoverTileCount === 1) {
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false };
          }
          return null;
        }
      } else {
        // Cross-grid drop
        const allSingle = cols.every((c: any) => (c.Tiles ?? []).length === 1);
        const hasMultiCol = cols.some((c: any) => (c.Tiles ?? []).length > 1);

        if (allSingle) {
          if (cols.length >= 3) {
            // Grid already at 3-column max
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false };
          }
          const insertColAfterColId = findInsertColAfterColId(cols, x);
          return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: true, insertColAfterColId, isColumnSwap: false, valid: true };
        }

        if (hasMultiCol) {
          if (hoverTileCount === 1) {
            // Single-tile (long) column — not a valid drop target
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false };
          }
          if (hoverTileCount >= 3) {
            // Multi-tile column already full
            return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false };
          }
          const insertIndex = calcInsertIndexInCol(hoverCol, y);
          return { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: true };
        }
      }
    }
    return null;
  }

  function calcBlockInsertTarget(x: number, y: number): BlockInsertPreview | null {
    const drag = tileDragInfoRef.current;
    if (!drag || !drag.hasMoved) return null;

    const grids = infoContentRef.current.filter((b: any) => b.InfoType === 'TileGrid');
    if (grids.length === 0) return null;

    const entries: Array<{ id: string; rect: DOMRect }> = [];
    for (const g of grids) {
      const rect = gridRectsSnapshot.current.get(g.InfoId);
      if (rect) entries.push({ id: g.InfoId, rect });
    }
    if (entries.length === 0) return null;

    // X bounds — cursor must be within the phone grid column area
    const { left, right } = entries[0].rect;
    if (x < left - 16 || x > right + 16) return null;

    // Before first grid — cursor in top add-row area (up to 60px above the first grid)
    if (y >= entries[0].rect.top - 60 && y < entries[0].rect.top + 4) {
      return { insertBeforeInfoId: entries[0].id };
    }

    // Between adjacent grids — zone starts the moment the cursor leaves grid[i]
    // and stays active until 4 px into grid[i+1], giving clear visual priority
    // over calcDropTarget even though both tolerances overlap.
    for (let i = 0; i < entries.length - 1; i++) {
      if (y >= entries[i].rect.bottom && y <= entries[i + 1].rect.top + 4) {
        return { insertBeforeInfoId: entries[i + 1].id };
      }
    }

    // After last grid — cursor in bottom add-row area (up to 60px below)
    const last = entries[entries.length - 1];
    if (y > last.rect.bottom - 4 && y <= last.rect.bottom + 60) {
      return { insertBeforeInfoId: null };
    }

    return null;
  }

  // ── Tile position drag start ──────────────────────────────────────────────
  // Listeners are attached here directly so tileDragId (and therefore
  // pointer-events:none on the source tile) is only set AFTER the 4px movement
  // threshold. This keeps a plain click fully functional.
  function handleTileDragStart(
    e: React.MouseEvent,
    tileWrapEl: HTMLElement,
    tileId: string,
    gridId: string,
    colId: string,
    tileIndex: number,
    colTileCount: number,
    gridColCount: number,
    tile: any,
  ) {
    const rect = tileWrapEl.getBoundingClientRect();
    tileDragInfoRef.current = {
      tileId, fromGridId: gridId, fromColId: colId,
      fromTileIndex: tileIndex, fromColTileCount: colTileCount, fromGridColCount: gridColCount,
      startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      hasMoved: false,
      ghostWidth: rect.width,
      ghostHeight: rect.height,
      bgColor: resolveColor(tile.BGColor, themeColorsRef.current),
      tileColor: tile.Color ?? '#ffffff',
      tileData: tile,
    };

    function onMove(ev: MouseEvent) {
      const drag = tileDragInfoRef.current;
      if (!drag) return;
      if (!drag.hasMoved) {
        if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < 4) return;
        drag.hasMoved = true;
        // Snapshot clean rects before any preview renders so layout shifts can't corrupt hit-testing
        colRectsSnapshot.current = new Map(
          [...colElRefs.current.entries()].map(([id, el]) => [id, el.getBoundingClientRect()])
        );
        gridRectsSnapshot.current = new Map(
          [...gridElRefs.current.entries()].map(([id, el]) => [id, el.getBoundingClientRect()])
        );
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        setTileDragId(drag.tileId); // only now — avoids pointer-events:none during click
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });
      const blockInsert = calcBlockInsertTarget(ev.clientX, ev.clientY);
      if (blockInsert) {
        setTileDropPreview(null);
        setBlockInsertPreview(blockInsert);
      } else {
        const inGrid = calcDropTarget(ev.clientX, ev.clientY);
        setTileDropPreview(inGrid);
        setBlockInsertPreview(null);
      }
    }

    function onUp(ev: MouseEvent) {
      const drag = tileDragInfoRef.current;
      if (drag?.hasMoved) {
        const blockInsert = calcBlockInsertTarget(ev.clientX, ev.clientY);
        if (blockInsert) {
          onTileDropAsNewBlockRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, blockInsert.insertBeforeInfoId);
        } else {
          const inGrid = calcDropTarget(ev.clientX, ev.clientY);
          if (inGrid?.valid) {
            onTileDropRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, inGrid);
          }
        }
        setTileDragId(null);
        setTileDropPreview(null);
        setBlockInsertPreview(null);
        setGhostPos(null);
      }
      tileDragInfoRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const isDraggingAnything = !!dragTileId || !!tileDragId;

  return (
    <main className="app-canvas">
      <div className="canvas-stage">
        <div className="phone-frame" ref={mainPhoneFrameRef}>
          <div className="phone-status-bar">
            <span className="phone-time">9:27</span>
            <div className="phone-status-icons">
              <SignalBarsIcon />
              <WifiStatusIcon />
              <BatteryStatusIcon />
            </div>
          </div>
          <PhoneAppHeader />
          <div className={`phone-screen${isDraggingAnything ? ' phone-screen--dragging' : ''}`}>
            {/* Top add-row — always visible when empty; doubles as drop zone before the first grid */}
            <div className={[
              'phone-add-row',
              infoContent.length === 0 ? 'phone-add-row--visible' : '',
              !!tileDragId && tileGrids.length > 0 ? 'phone-add-row--tile-drop-zone' : '',
              !!tileDragId && !!blockInsertPreview && blockInsertPreview.insertBeforeInfoId === tileGrids[0]?.InfoId
                ? 'phone-add-row--tile-drop-zone-active' : '',
            ].filter(Boolean).join(' ')}>
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
              themeIcons={themeIcons}
              selectedTileId={selectedTileId}
              onSelectTile={onSelectTile}
              interactive={true}
              onAddColumn={onAddColumn}
              onDeleteTile={onDeleteTile}
              onEditTile={onEditTile}
              onResizeDragStart={handleResizeDragStart}
              activeDragTileId={dragTileId}
              splitPreview={splitPreview}
              freeResizePreview={freeResizePreview}
              onColRef={(id, el) => {
                if (el) colElRefs.current.set(id, el);
                else colElRefs.current.delete(id);
              }}
              onGridRef={(id, el) => {
                if (el) gridElRefs.current.set(id, el);
                else gridElRefs.current.delete(id);
              }}
              onTileDragStart={handleTileDragStart}
              tileDragId={tileDragId}
              tileDropPreview={tileDropPreview}
              tileDragFromGridId={tileDragInfoRef.current?.fromGridId ?? null}
              blockInsertPreview={blockInsertPreview}
              isDraggingTile={!!tileDragId}
              onTileNavigate={onTileNavigate}
            />
          </div>
        </div>

        {/* Chained page frames — one per entry in the nav stack */}
        {linkedFrames?.map((frame, i) => {
          const frameTileGrids = frame.infoContent.filter((b: any) => b.InfoType === 'TileGrid');
          return (
            <div key={frame.page?.PageId ?? i} className="phone-frame phone-frame--linked">
              <div className="phone-status-bar">
                <span className="phone-time">9:27</span>
                <div className="phone-status-icons">
                  <SignalBarsIcon />
                  <WifiStatusIcon />
                  <BatteryStatusIcon />
                </div>
              </div>
              <PhoneLinkedHeader pageName={frame.page?.PageName ?? ''} onBack={frame.onClose} />
              <div className="phone-screen">
                <div className={`phone-add-row${frameTileGrids.length === 0 ? ' phone-add-row--visible' : ''}`}>
                  <button
                    className="phone-add-btn"
                    type="button"
                    aria-label="Add content block"
                    onClick={frame.onAddStandaloneTile}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <TileGrids
                  tileGrids={frameTileGrids}
                  themeColors={themeColors}
                  themeIcons={themeIcons}
                  selectedTileId={selectedTileId}
                  onSelectTile={onSelectTile}
                  interactive={true}
                  onAddColumn={frame.onAddColumn}
                  onDeleteTile={frame.onDeleteTile}
                  onEditTile={frame.onEditTile}
                  onTileNavigate={onTileNavigate}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating ghost tile that follows the cursor during tile drag */}
      {ghostPos && tileDragInfoRef.current && (
        <div
          className="phone-tile-floating-ghost"
          style={{
            left: ghostPos.x - tileDragInfoRef.current.offsetX,
            top: ghostPos.y - tileDragInfoRef.current.offsetY,
            width: tileDragInfoRef.current.ghostWidth,
            height: tileDragInfoRef.current.ghostHeight,
            background: tileDragInfoRef.current.bgColor,
            color: tileDragInfoRef.current.tileColor,
          }}
        >
          {tileDragInfoRef.current.tileData?.Text && (
            <span className="phone-tile-text" style={{ padding: '0 6px' }}>
              {tileDragInfoRef.current.tileData.Text}
            </span>
          )}
        </div>
      )}

      {/* Page thumbnails — home + one per open linked frame */}
      <div className="page-thumbnails">
        {/* Home thumbnail */}
        <div className="page-thumb-clip">
          <div
            className="phone-frame page-thumb-frame"
            style={{ width: thumbFrameW, transform: `scale(${(45 / thumbFrameW).toFixed(6)})` }}
          >
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
              <div className={`phone-add-row${tileGrids.length === 0 ? ' phone-add-row--visible' : ''}`} />
              <TileGrids
                tileGrids={tileGrids}
                themeColors={themeColors}
                themeIcons={themeIcons}
                interactive={false}
              />
            </div>
          </div>
        </div>

        {/* One thumbnail per open linked frame — added on navigate, removed on close */}
        {linkedFrames?.map((frame, i) => {
          const thumbTileGrids = frame.infoContent.filter((b: any) => b.InfoType === 'TileGrid');
          return (
            <div key={frame.page?.PageId ?? i} className="page-thumb-clip">
              <div
                className="phone-frame page-thumb-frame"
                style={{ width: thumbFrameW, transform: `scale(${(45 / thumbFrameW).toFixed(6)})` }}
              >
                <div className="phone-status-bar">
                  <span className="phone-time">9:27</span>
                  <div className="phone-status-icons">
                    <SignalBarsIcon />
                    <WifiStatusIcon />
                    <BatteryStatusIcon />
                  </div>
                </div>
                <PhoneLinkedHeader pageName={frame.page?.PageName ?? ''} onBack={() => {}} />
                <div className="phone-screen">
                  <div className={`phone-add-row${thumbTileGrids.length === 0 ? ' phone-add-row--visible' : ''}`} />
                  <TileGrids
                    tileGrids={thumbTileGrids}
                    themeColors={themeColors}
                    themeIcons={themeIcons}
                    interactive={false}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
