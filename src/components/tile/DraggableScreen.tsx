import { useState, useRef, useEffect } from 'react';
import type { ThemeColors, ThemeIcon, TileDropPreview, BlockInsertPreview } from '../../types';
import { TILE_H, TILE_GAP } from '../../constants';
import { resolveColor } from '../../utils/tileUtils';
import { TileGrids } from './TileGrids';
import type { SplitPreview, FreeResizePreview } from './TileGrids';
import { AddBlockMenu } from '../phone/AddBlockMenu';

const SNAP_POINTS = [80, 120, 160];
const SPLIT_SNAPS = [TILE_H, TILE_H * 2 + TILE_GAP, TILE_H * 3 + TILE_GAP * 2];
const SNAP_ZONE = 12;

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

export interface AllFrameData {
  frames: Array<{ frameIndex: number; infoContent: any[] }>;
  colEls: Map<string, { el: HTMLElement; frameIndex: number }>;
  gridEls: Map<string, { el: HTMLElement; frameIndex: number }>;
  frameEls: Map<number, HTMLElement>;
}

export interface CrossFramePreview {
  frameIndex: number;
  tdPreview: TileDropPreview | null;
  biPreview: BlockInsertPreview | null;
  emptyDrop?: boolean;
}

export interface DraggableScreenProps {
  infoContent: any[];
  tileGrids: any[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  selectedTileId?: string | null;
  onSelectTile?: (id: string) => void;
  onAddColumn?: (gridId: string, afterColId: string) => void;
  onDeleteTile?: (gridId: string, colId: string, tileId: string) => void;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onAddTilesToColumn?: (gridId: string, colId: string, count: number) => void;
  onAddStandaloneTile?: () => void;
  onAddBlock?: (blockType: string, insertBeforeInfoId: string | null) => void;
  onFreeResizeRelease?: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, oppColTiles: any[]) => void;
  onTileDrop?: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => void;
  onTileDropAsNewBlock?: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => void;
  onTileNavigate?: (pageId: string) => void;
  onCollapseFromParent?: () => void;
  activeNavTileIds?: Set<string>;
  sourceFrameIndex?: number;
  getAllFrameData?: () => AllFrameData;
  onCrossFrameDragPreview?: (preview: CrossFramePreview | null) => void;
  onCrossFrameTileDrop?: (fromGridId: string, fromColId: string, tileId: string, targetFrameIdx: number, preview: TileDropPreview) => void;
  onCrossFrameTileDropToEmpty?: (fromGridId: string, fromColId: string, tileId: string, targetFrameIdx: number) => void;
  onCrossFrameTileDropAsNewBlock?: (fromGridId: string, fromColId: string, tileId: string, targetFrameIdx: number, insertBeforeInfoId: string | null) => void;
  externalTileDropPreview?: TileDropPreview | null;
  externalBlockInsertPreview?: BlockInsertPreview | null;
  isExternalDragActive?: boolean;
  onColRef?: (id: string, el: HTMLElement | null) => void;
  onGridRef?: (id: string, el: HTMLElement | null) => void;
}

export function DraggableScreen({
  infoContent,
  tileGrids,
  themeColors,
  themeIcons,
  selectedTileId,
  onSelectTile,
  onAddColumn,
  onDeleteTile,
  onEditTile,
  onAddTilesToColumn,
  onAddStandaloneTile,
  onAddBlock,
  onFreeResizeRelease,
  onTileDrop,
  onTileDropAsNewBlock,
  onTileNavigate,
  onCollapseFromParent,
  activeNavTileIds,
  sourceFrameIndex = -1,
  getAllFrameData,
  onCrossFrameDragPreview,
  onCrossFrameTileDrop,
  onCrossFrameTileDropToEmpty,
  onCrossFrameTileDropAsNewBlock,
  externalTileDropPreview,
  externalBlockInsertPreview,
  isExternalDragActive = false,
  onColRef: onColRefExternal,
  onGridRef: onGridRefExternal,
}: DraggableScreenProps) {

  const [addMenu, setAddMenu] = useState<{ insertBeforeInfoId: string | null; pos: { x: number; y: number } } | null>(null);

  function openAddMenu(e: React.MouseEvent<HTMLButtonElement>, insertBeforeInfoId: string | null) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setAddMenu({ insertBeforeInfoId, pos: { x: rect.left, y: rect.bottom + 4 } });
  }

  function handleMenuSelect(blockType: string) {
    if (addMenu) onAddBlock?.(blockType, addMenu.insertBeforeInfoId);
    setAddMenu(null);
  }

  const [dragTileId, setDragTileId] = useState<string | null>(null);
  const [splitPreview, setSplitPreview] = useState<SplitPreview | null>(null);
  const [freeResizePreview, setFreeResizePreview] = useState<FreeResizePreview | null>(null);
  const [tileDragId, setTileDragId] = useState<string | null>(null);
  const [tileDropPreview, setTileDropPreview] = useState<TileDropPreview | null>(null);
  const [blockInsertPreview, setBlockInsertPreview] = useState<BlockInsertPreview | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const onEditTileRef = useRef(onEditTile);
  const onAddTilesToColumnRef = useRef(onAddTilesToColumn);
  const onAddStandaloneTileRef = useRef(onAddStandaloneTile);
  const onFreeResizeReleaseRef = useRef(onFreeResizeRelease);
  const onTileDropRef = useRef(onTileDrop);
  const onTileDropAsNewBlockRef = useRef(onTileDropAsNewBlock);
  const infoContentRef = useRef(infoContent);
  const themeColorsRef = useRef(themeColors);
  const getAllFrameDataRef = useRef(getAllFrameData);
  const onCrossFrameDragPreviewRef = useRef(onCrossFrameDragPreview);
  const onCrossFrameTileDropRef = useRef(onCrossFrameTileDrop);
  const onCrossFrameTileDropToEmptyRef = useRef(onCrossFrameTileDropToEmpty);
  const onCrossFrameTileDropAsNewBlockRef = useRef(onCrossFrameTileDropAsNewBlock);
  const sourceFrameIndexRef = useRef(sourceFrameIndex);
  useEffect(() => { onEditTileRef.current = onEditTile; });
  useEffect(() => { onAddTilesToColumnRef.current = onAddTilesToColumn; });
  useEffect(() => { onAddStandaloneTileRef.current = onAddStandaloneTile; });
  useEffect(() => { onFreeResizeReleaseRef.current = onFreeResizeRelease; });
  useEffect(() => { onTileDropRef.current = onTileDrop; });
  useEffect(() => { onTileDropAsNewBlockRef.current = onTileDropAsNewBlock; });
  useEffect(() => { infoContentRef.current = infoContent; });
  useEffect(() => { themeColorsRef.current = themeColors; });
  useEffect(() => { getAllFrameDataRef.current = getAllFrameData; });
  useEffect(() => { onCrossFrameDragPreviewRef.current = onCrossFrameDragPreview; });
  useEffect(() => { onCrossFrameTileDropRef.current = onCrossFrameTileDrop; });
  useEffect(() => { onCrossFrameTileDropToEmptyRef.current = onCrossFrameTileDropToEmpty; });
  useEffect(() => { onCrossFrameTileDropAsNewBlockRef.current = onCrossFrameTileDropAsNewBlock; });
  useEffect(() => { sourceFrameIndexRef.current = sourceFrameIndex; });

  const gridFrameIndexRef = useRef<Map<string, number>>(new Map());
  const extraFramesContentRef = useRef<Array<{ frameIndex: number; infoContent: any[] }>>([]);
  const extraFrameElsRef = useRef<Map<number, HTMLElement>>(new Map());

  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    currentHeight: number;
    split: { gridId: string; oppositeColId: string; currentCount: number; maxCount: number } | null;
    freeResize: { gridId: string; oppColId: string; oppColTiles: any[]; initialCount: number; currentZoneCount: number } | null;
  } | null>(null);

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

  const colElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const gridElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const colRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());
  const gridRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());

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
        freeResizeInfo = { gridId: block.InfoId, oppColId: oppCol.ColId, oppColTiles: oppTiles, initialCount: oppTiles.length, currentZoneCount: oppTiles.length };
      }
      break;
    }

    dragRef.current = {
      startY, startHeight, currentHeight: startHeight,
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
          if (count > dragRef.current.split.maxCount) dragRef.current.split.maxCount = count;
          setSplitPreview(prev => prev ? { ...prev, count } : null);
        }
        onEditTileRef.current?.(dragTileId!, { Height: Math.round(raw) });
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
        onEditTileRef.current?.(dragTileId!, { Height: dragRef.current.currentHeight });
      } else {
        const raw = Math.min(SNAP_POINTS[SNAP_POINTS.length - 1], Math.max(80, dragRef.current.startHeight + (e.clientY - dragRef.current.startY)));
        dragRef.current.currentHeight = Math.round(raw);
        onEditTileRef.current?.(dragTileId!, { Height: softSnapHeight(raw) });
      }
    }

    function onMouseUp() {
      if (dragRef.current?.split) {
        const { gridId, oppositeColId, currentCount, maxCount } = dragRef.current.split;
        onEditTileRef.current?.(dragTileId!, { Height: SPLIT_SNAPS[currentCount - 1] });
        if (currentCount > 1) onAddTilesToColumnRef.current?.(gridId, oppositeColId, currentCount - 1);
        const passed = maxCount - currentCount;
        for (let i = 0; i < passed; i++) onAddStandaloneTileRef.current?.();
      } else if (dragRef.current?.freeResize) {
        const { gridId, oppColId, oppColTiles, initialCount, currentZoneCount } = dragRef.current.freeResize;
        const snapH = SPLIT_SNAPS[currentZoneCount - 1];
        onFreeResizeReleaseRef.current?.(gridId, dragTileId!, snapH, currentZoneCount, initialCount, oppColId, oppColTiles);
      } else if (dragRef.current) {
        onEditTileRef.current?.(dragTileId!, { Height: snapHeight(dragRef.current.currentHeight) });
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

  function calcDropTarget(x: number, y: number): { preview: TileDropPreview | null; targetFrameIdx: number; emptyFrameDrop?: boolean } {
    const drag = tileDragInfoRef.current;
    const srcIdx = sourceFrameIndexRef.current;
    if (!drag || !drag.hasMoved) return { preview: null, targetFrameIdx: srcIdx };

    type DropResult = { preview: TileDropPreview | null; targetFrameIdx: number; emptyFrameDrop?: boolean };
    function evalGrid(d: NonNullable<typeof drag>, grid: any, frameIdx: number): DropResult | null {
      const rect = gridRectsSnapshot.current.get(grid.InfoId);
      if (!rect) return null;
      if (y < rect.top - 12 || y > rect.bottom + 12 || x < rect.left - 16 || x > rect.right + 16) return null;
      const cols: any[] = grid.Columns ?? [];
      const hoverCol = findColByX(cols, x);
      if (!hoverCol) return null;
      const sameGrid = grid.InfoId === d.fromGridId;
      const hoverTileCount = (hoverCol.Tiles ?? []).length;
      if (sameGrid && frameIdx === srcIdx) {
        if (hoverCol.ColId === d.fromColId) {
          if (d.fromColTileCount <= 1) return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false }, targetFrameIdx: frameIdx };
          const insertIndex = calcInsertIndexInCol(hoverCol, y);
          const isSamePos = insertIndex === d.fromTileIndex || insertIndex === d.fromTileIndex + 1;
          return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: !isSamePos }, targetFrameIdx: frameIdx };
        } else {
          if (d.fromColTileCount === 1) return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: true, valid: true }, targetFrameIdx: frameIdx };
          if (hoverTileCount === 1) return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false }, targetFrameIdx: frameIdx };
          return null;
        }
      } else {
        const allSingle = cols.every((c: any) => (c.Tiles ?? []).length === 1);
        const hasMultiCol = cols.some((c: any) => (c.Tiles ?? []).length > 1);
        if (allSingle) {
          if (cols.length >= 3) return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false }, targetFrameIdx: frameIdx };
          const insertColAfterColId = findInsertColAfterColId(cols, x);
          return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: true, insertColAfterColId, isColumnSwap: false, valid: true }, targetFrameIdx: frameIdx };
        }
        if (hasMultiCol) {
          if (hoverTileCount === 1 || hoverTileCount >= 3) return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex: 0, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: false }, targetFrameIdx: frameIdx };
          const insertIndex = calcInsertIndexInCol(hoverCol, y);
          return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: true }, targetFrameIdx: frameIdx };
        }
      }
      return null;
    }

    for (const grid of infoContentRef.current.filter((b: any) => b.InfoType === 'TileGrid')) {
      const r = evalGrid(drag, grid, srcIdx);
      if (r) return r;
    }
    for (const { frameIndex, infoContent: fc } of extraFramesContentRef.current) {
      for (const grid of fc.filter((b: any) => b.InfoType === 'TileGrid')) {
        const r = evalGrid(drag, grid, frameIndex);
        if (r) return r;
      }
    }
    for (const { frameIndex, infoContent: fc } of extraFramesContentRef.current) {
      const frameEl = extraFrameElsRef.current.get(frameIndex);
      if (!frameEl) continue;
      const rect = frameEl.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const hasGrids = fc.some((b: any) => b.InfoType === 'TileGrid');
        return { preview: null, targetFrameIdx: frameIndex, emptyFrameDrop: !hasGrids };
      }
    }
    return { preview: null, targetFrameIdx: srcIdx };
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
    const { left, right } = entries[0].rect;
    if (x < left - 16 || x > right + 16) return null;
    if (y >= entries[0].rect.top - 60 && y < entries[0].rect.top + 4) return { insertBeforeInfoId: entries[0].id };
    for (let i = 0; i < entries.length - 1; i++) {
      if (y >= entries[i].rect.bottom && y <= entries[i + 1].rect.top + 4) return { insertBeforeInfoId: entries[i + 1].id };
    }
    const last = entries[entries.length - 1];
    if (y > last.rect.bottom - 4 && y <= last.rect.bottom + 60) return { insertBeforeInfoId: null };
    return null;
  }

  function calcCrossFrameBlockInsert(x: number, y: number, targetFrameIdx: number): BlockInsertPreview | null {
    const drag = tileDragInfoRef.current;
    if (!drag || !drag.hasMoved) return null;
    const frameData = extraFramesContentRef.current.find(f => f.frameIndex === targetFrameIdx);
    if (!frameData) return null;
    const grids = frameData.infoContent.filter((b: any) => b.InfoType === 'TileGrid');
    if (grids.length === 0) return null;
    const entries: Array<{ id: string; rect: DOMRect }> = [];
    for (const g of grids) {
      const rect = gridRectsSnapshot.current.get(g.InfoId);
      if (rect) entries.push({ id: g.InfoId, rect });
    }
    if (entries.length === 0) return null;
    const { left, right } = entries[0].rect;
    if (x < left - 16 || x > right + 16) return null;
    if (y >= entries[0].rect.top - 60 && y < entries[0].rect.top + 4) return { insertBeforeInfoId: entries[0].id };
    for (let i = 0; i < entries.length - 1; i++) {
      if (y >= entries[i].rect.bottom && y <= entries[i + 1].rect.top + 4) return { insertBeforeInfoId: entries[i + 1].id };
    }
    const last = entries[entries.length - 1];
    if (y > last.rect.bottom - 4 && y <= last.rect.bottom + 60) return { insertBeforeInfoId: null };
    return null;
  }

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
        colRectsSnapshot.current = new Map(
          [...colElRefs.current.entries()].map(([id, el]) => [id, el.getBoundingClientRect()])
        );
        gridRectsSnapshot.current = new Map(
          [...gridElRefs.current.entries()].map(([id, el]) => [id, el.getBoundingClientRect()])
        );
        const extraData = getAllFrameDataRef.current?.();
        if (extraData) {
          for (const [colId, { el }] of extraData.colEls) colRectsSnapshot.current.set(colId, el.getBoundingClientRect());
          for (const [gridId, { el }] of extraData.gridEls) gridRectsSnapshot.current.set(gridId, el.getBoundingClientRect());
          const gfMap = new Map<string, number>();
          for (const b of infoContentRef.current) { if (b.InfoType === 'TileGrid') gfMap.set(b.InfoId, sourceFrameIndexRef.current); }
          for (const { frameIndex, infoContent: fc } of extraData.frames) { for (const b of fc) { if (b.InfoType === 'TileGrid') gfMap.set(b.InfoId, frameIndex); } }
          gridFrameIndexRef.current = gfMap;
          extraFramesContentRef.current = extraData.frames;
          extraFrameElsRef.current = extraData.frameEls ?? new Map();
        } else {
          gridFrameIndexRef.current = new Map();
          extraFramesContentRef.current = [];
          extraFrameElsRef.current = new Map();
        }
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        setTileDragId(drag.tileId);
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });
      const blockInsert = calcBlockInsertTarget(ev.clientX, ev.clientY);
      if (blockInsert) {
        setTileDropPreview(null);
        setBlockInsertPreview(blockInsert);
        onCrossFrameDragPreviewRef.current?.(null);
      } else {
        const { preview, targetFrameIdx, emptyFrameDrop } = calcDropTarget(ev.clientX, ev.clientY);
        const isCross = targetFrameIdx !== sourceFrameIndexRef.current;
        if (isCross) {
          setTileDropPreview(null);
          setBlockInsertPreview(null);
          if (emptyFrameDrop) {
            onCrossFrameDragPreviewRef.current?.({ frameIndex: targetFrameIdx, tdPreview: null, biPreview: null, emptyDrop: true });
          } else {
            const crossBi = calcCrossFrameBlockInsert(ev.clientX, ev.clientY, targetFrameIdx);
            if (crossBi) {
              onCrossFrameDragPreviewRef.current?.({ frameIndex: targetFrameIdx, tdPreview: null, biPreview: crossBi, emptyDrop: false });
            } else if (preview) {
              onCrossFrameDragPreviewRef.current?.({ frameIndex: targetFrameIdx, tdPreview: preview, biPreview: null, emptyDrop: false });
            } else {
              onCrossFrameDragPreviewRef.current?.(null);
            }
          }
        } else {
          setTileDropPreview(preview);
          setBlockInsertPreview(null);
          onCrossFrameDragPreviewRef.current?.(null);
        }
      }
    }

    function onUp(ev: MouseEvent) {
      const drag = tileDragInfoRef.current;
      if (drag?.hasMoved) {
        const blockInsert = calcBlockInsertTarget(ev.clientX, ev.clientY);
        if (blockInsert) {
          onTileDropAsNewBlockRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, blockInsert.insertBeforeInfoId);
        } else {
          const { preview, targetFrameIdx, emptyFrameDrop } = calcDropTarget(ev.clientX, ev.clientY);
          const isCross = targetFrameIdx !== sourceFrameIndexRef.current;
          if (isCross && emptyFrameDrop) {
            onCrossFrameTileDropToEmptyRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, targetFrameIdx);
          } else if (isCross) {
            const crossBi = calcCrossFrameBlockInsert(ev.clientX, ev.clientY, targetFrameIdx);
            if (crossBi) {
              onCrossFrameTileDropAsNewBlockRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, targetFrameIdx, crossBi.insertBeforeInfoId);
            } else if (preview?.valid) {
              onCrossFrameTileDropRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, targetFrameIdx, preview);
            }
          } else if (!isCross && preview?.valid) {
            onTileDropRef.current?.(drag.fromGridId, drag.fromColId, drag.tileId, preview);
          }
        }
        setTileDragId(null);
        setTileDropPreview(null);
        setBlockInsertPreview(null);
        setGhostPos(null);
        onCrossFrameDragPreviewRef.current?.(null);
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
  const effectiveTileDropPreview = tileDropPreview ?? externalTileDropPreview ?? null;
  const effectiveBlockInsertPreview = blockInsertPreview ?? externalBlockInsertPreview ?? null;
  const effectiveDraggingTile = !!(tileDragId || isExternalDragActive);

  return (
    <>
      <div className={[
        'phone-screen',
        (isDraggingAnything || isExternalDragActive) ? 'phone-screen--dragging' : '',
        isExternalDragActive && tileGrids.length === 0 ? 'phone-screen--empty-drop' : '',
      ].filter(Boolean).join(' ')}>
        <div className={[
          'phone-add-row',
          infoContent.length === 0 ? 'phone-add-row--visible' : '',
          effectiveDraggingTile && tileGrids.length > 0 ? 'phone-add-row--tile-drop-zone' : '',
          effectiveDraggingTile && !!effectiveBlockInsertPreview && effectiveBlockInsertPreview.insertBeforeInfoId === tileGrids[0]?.InfoId
            ? 'phone-add-row--tile-drop-zone-active' : '',
        ].filter(Boolean).join(' ')}>
          <button
            className="phone-add-btn"
            type="button"
            aria-label="Add content block"
            onClick={(e) => openAddMenu(e, infoContent[0]?.InfoId ?? null)}
          >
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
            onColRefExternal?.(id, el);
          }}
          onGridRef={(id, el) => {
            if (el) gridElRefs.current.set(id, el);
            else gridElRefs.current.delete(id);
            onGridRefExternal?.(id, el);
          }}
          onTileDragStart={handleTileDragStart}
          tileDragId={tileDragId}
          tileDropPreview={effectiveTileDropPreview}
          tileDragFromGridId={tileDragInfoRef.current?.fromGridId ?? null}
          blockInsertPreview={effectiveBlockInsertPreview}
          isDraggingTile={effectiveDraggingTile}
          onTileNavigate={onTileNavigate}
          onCollapseFromParent={onCollapseFromParent}
          activeNavTileIds={activeNavTileIds}
          onAddBtnClick={openAddMenu}
        />
      </div>

      {addMenu && (
        <AddBlockMenu
          pos={addMenu.pos}
          onSelect={handleMenuSelect}
          onClose={() => setAddMenu(null)}
        />
      )}

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
    </>
  );
}
