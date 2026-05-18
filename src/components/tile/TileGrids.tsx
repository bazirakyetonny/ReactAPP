import type { ThemeColors, ThemeIcon, TileDropPreview, BlockInsertPreview } from '../../types';
import { TILE_H, TILE_GAP } from '../../constants';
import { resolveColor, resolveIconSVG } from '../../utils/tileUtils';

export interface SplitPreview {
  gridId: string;
  oppositeColId: string;
  count: number;
}

export interface FreeResizePreview {
  gridId: string;
  oppColId: string;
  activeCount: number;
  extraSkeletonCount: number;
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
  onCollapseFromParent?: () => void;
  activeNavTileIds?: Set<string>;
  onAddBtnClick?: (e: React.MouseEvent<HTMLButtonElement>, insertBeforeInfoId: string | null) => void;
  overrideAddBtnInsertBeforeInfoId?: string | null;
}

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

export function TileGrids({
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
  onCollapseFromParent,
  activeNavTileIds,
  onAddBtnClick,
  overrideAddBtnInsertBeforeInfoId,
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
        const previewResetHeight = !!(
          tileDropPreview?.newColumn &&
          tileDropPreview.valid &&
          tileDropPreview.targetGridId === grid.InfoId
        );
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

        const dropZoneId = overrideAddBtnInsertBeforeInfoId !== undefined
          ? overrideAddBtnInsertBeforeInfoId
          : (gridIdx < tileGrids.length - 1 ? tileGrids[gridIdx + 1].InfoId : null);
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
                      const isSelected = interactive && selectedTileId === tile.Id;
                      const isDraggingThis = activeDragTileId === tile.Id;

                      let derivedLongTileHeight: string | null = null;
                      if (cols.length === 2 && (col.Tiles ?? []).length === 1 && !isDraggingThis) {
                        const oppCol = cols.find((c: any) => c.ColId !== col.ColId);
                        const oppCount = (oppCol?.Tiles ?? []).length;
                        if (oppCount > 1) {
                          derivedLongTileHeight = `${oppCount * TILE_H + (oppCount - 1) * TILE_GAP}px`;
                        }
                      }

                      const height = previewResetHeight
                        ? `${TILE_H}px`
                        : (col.ColId === previewLongColId && previewLongHeight !== null)
                          ? `${previewLongHeight}px`
                          : derivedLongTileHeight ?? `${tile.Height ?? 80}px`;
                      const isTileDragging = tileDragId === tile.Id;
                      const isGhost = isFreeResizeOppCol && tileIndex >= (freeResizePreview?.activeCount ?? Infinity);
                      const isSameColReorderSource = isTileDragging &&
                        tileDropPreview != null && tileDropPreview.valid &&
                        !tileDropPreview.newColumn &&
                        tileDropPreview.targetGridId === grid.InfoId &&
                        tileDropPreview.targetColId === col.ColId;
                      const iconSVG = resolveIconSVG(tile, themeIcons);
                      const hasIcon = !!iconSVG;
                      const hasText = !!tile.Text;
                      const canEdit = isSelected && !isDraggingThis;
                      const showDelIcon = canEdit && hasIcon;
                      const showDelText = canEdit && hasIcon && hasText;

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
                            activeNavTileIds?.has(tile.Id) ? 'phone-tile-wrap--nav-active' : '',
                            isGhost ? 'phone-tile-wrap--ghost' : '',
                            isTileDragging ? 'phone-tile-wrap--tile-drag-source' : '',
                          ].filter(Boolean).join(' ')}
                          style={isSameColReorderSource ? { height: 0, minHeight: 0, overflow: 'hidden' } : { height }}
                          onClick={interactive && onSelectTile ? () => {
                            onSelectTile(tile.Id);
                            if (tile.Action?.ObjectType === 'Information' && tile.Action?.ObjectId) {
                              onTileNavigate?.(tile.Action.ObjectId);
                            } else {
                              onCollapseFromParent?.();
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
                              <div className={`phone-tile-element${showDelIcon ? ' phone-tile-element--deletable' : ''}`}>
                                <span className="phone-tile-icon" dangerouslySetInnerHTML={{ __html: iconSVG! }} />
                                {showDelIcon && delBtn(() => onEditTile?.(tile.Id, { Icon: null, IconSVG: null, IconId: null, IconCodeName: null }), 'Remove icon')}
                              </div>
                            )}
                            {hasText && (
                              <div className={`phone-tile-element${showDelText ? ' phone-tile-element--deletable' : ''}`}>
                                <span className="phone-tile-text">{tile.Text}</span>
                                {showDelText && delBtn(() => onEditTile?.(tile.Id, { Text: '' }), 'Remove text')}
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

                    {isSplitOpposite && Array.from({ length: (splitPreview?.count ?? 1) - 1 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="phone-tile-wrap" style={{ height: `${TILE_H}px` }}>
                        <div className="phone-tile phone-tile--skeleton" />
                      </div>
                    ))}
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
                <button
                  className="phone-add-btn"
                  type="button"
                  aria-label="Add content"
                  onClick={(e) => onAddBtnClick?.(e,
                    overrideAddBtnInsertBeforeInfoId !== undefined
                      ? overrideAddBtnInsertBeforeInfoId
                      : tileGrids[gridIdx + 1]?.InfoId ?? null
                  )}
                >
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
