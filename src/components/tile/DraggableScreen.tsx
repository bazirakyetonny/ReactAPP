import React, { useState, useRef, useEffect } from 'react';
import type { ThemeColors, ThemeIcon, ThemeCtaColor, TileDropPreview, BlockInsertPreview } from '../../types';
import { TILE_H, TILE_GAP } from '../../constants';
import { resolveColor, resolveIconSVG } from '../../utils/tileUtils';
import { TileGrids } from './TileGrids';
import type { SplitPreview, FreeResizePreview } from './TileGrids';
import { AddBlockMenu } from '../phone/AddBlockMenu';
import { TileActionMenu } from './TileActionMenu';
import type { TileMenuAction } from './TileActionMenu';
import { DescriptionBlock } from '../phone/DescriptionBlock';
import { QuillEditorModal } from '../phone/QuillEditorModal';
import { ImageBlock } from '../phone/ImageBlock';
import { CtaBlock } from '../phone/CtaBlock';
import { MediaLibraryModal } from '../phone/MediaLibraryModal';
import type { Image } from '../../types';

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

type RenderGroup =
  | { type: 'single'; block: any; nextInfoId: string | null }
  | { type: 'round-row'; blocks: any[]; nextInfoId: string | null };

function isRoundCta(block: any): boolean {
  return block.InfoType === 'Cta' && (block.CtaAttributes?.CtaButtonType || 'Image') === 'Round';
}

function groupInfoContent(infoContent: any[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let i = 0;
  while (i < infoContent.length) {
    if (isRoundCta(infoContent[i])) {
      const rowBlocks: any[] = [];
      while (i < infoContent.length && isRoundCta(infoContent[i]) && rowBlocks.length < 3) {
        rowBlocks.push(infoContent[i++]);
      }
      groups.push({ type: 'round-row', blocks: rowBlocks, nextInfoId: infoContent[i]?.InfoId ?? null });
    } else {
      groups.push({ type: 'single', block: infoContent[i], nextInfoId: infoContent[i + 1]?.InfoId ?? null });
      i++;
    }
  }
  return groups;
}

export interface AllFrameData {
  frames: Array<{ frameIndex: number; infoContent: any[] }>;
  colEls: Map<string, { el: HTMLElement; frameIndex: number }>;
  gridEls: Map<string, { el: HTMLElement; frameIndex: number }>;
  frameEls: Map<number, HTMLElement>;
  blockWrapperEls: Map<string, { el: HTMLElement; frameIndex: number }>;
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
  onAddDescription?: (html: string, insertBeforeInfoId: string | null) => void;
  onEditDescription?: (infoId: string, html: string) => void;
  onDeleteBlock?: (infoId: string) => void;
  onMoveBlock?: (infoId: string, insertBeforeInfoId: string | null) => void;
  onCrossFrameBlockDrop?: (infoId: string, fromFrameIdx: number, toFrameIdx: number, insertBeforeInfoId: string | null) => void;
  onCrossFrameBlockDragPreview?: (preview: { insertBeforeInfoId: string | null; targetFrameIdx: number } | null) => void;
  isExternalBlockDragActive?: boolean;
  externalBlockDropPreview?: { insertBeforeInfoId: string | null } | null;
  onBlockWrapperRef?: (infoId: string, el: HTMLElement | null) => void;
  onAddImage?: (images: { InfoImageId: string; InfoImageValue: string }[], insertBeforeInfoId: string | null) => void;
  onEditImage?: (infoId: string, images: { InfoImageId: string; InfoImageValue: string }[]) => void;
  onTileDoubleClick?: (tileId: string, rect: DOMRect) => void;
  onDeselectTile?: () => void;
  onSelectCta?: (ctaId: string) => void;
  selectedCtaId?: string | null;
  themeCtaColors?: ThemeCtaColor[];
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
  onTileMenuAction?: (tileId: string, action: TileMenuAction) => void;
  liveTileText?: { id: string; text: string } | null;
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
  onAddDescription,
  onEditDescription,
  onDeleteBlock,
  onMoveBlock,
  onCrossFrameBlockDrop,
  onCrossFrameBlockDragPreview,
  isExternalBlockDragActive = false,
  externalBlockDropPreview,
  onBlockWrapperRef,
  onAddImage,
  onEditImage,
  onTileDoubleClick,
  onDeselectTile,
  onSelectCta,
  selectedCtaId,
  themeCtaColors,
  onEditCta,
  onTileMenuAction,
  liveTileText,
}: DraggableScreenProps) {

  const [addMenu, setAddMenu] = useState<{ insertBeforeInfoId: string | null; pos: { x: number; y: number } } | null>(null);
  const [tileMenu, setTileMenu] = useState<{ tileId: string; pos: { x: number; y: number } } | null>(null);
  const [blockDragId, setBlockDragId] = useState<string | null>(null);
  const [blockGhostPos, setBlockGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [blockDropPreview, setBlockDropPreview] = useState<{ insertBeforeInfoId: string | null } | null>(null);

  type EditorState =
    | { mode: 'create'; insertBeforeInfoId: string | null }
    | { mode: 'edit'; infoId: string; currentHtml: string };
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  type ImageEditorState =
    | { mode: 'create'; insertBeforeInfoId: string | null }
    | { mode: 'edit'; infoId: string; currentImages: Image[] };
  const [imageEditorState, setImageEditorState] = useState<ImageEditorState | null>(null);
  const [ctaImageEditId, setCtaImageEditId] = useState<string | null>(null);

  function openAddMenu(e: React.MouseEvent<HTMLButtonElement>, insertBeforeInfoId: string | null) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setAddMenu({ insertBeforeInfoId, pos: { x: rect.left, y: rect.bottom + 4 } });
  }

  function handleMenuSelect(blockType: string) {
    if (blockType === 'Description') {
      setEditorState({ mode: 'create', insertBeforeInfoId: addMenu!.insertBeforeInfoId });
    } else if (blockType === 'Image') {
      setImageEditorState({ mode: 'create', insertBeforeInfoId: addMenu!.insertBeforeInfoId });
    } else {
      if (addMenu) onAddBlock?.(blockType, addMenu.insertBeforeInfoId);
    }
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
  const themeIconsRef = useRef(themeIcons);
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
  useEffect(() => { themeIconsRef.current = themeIcons; });
  useEffect(() => { getAllFrameDataRef.current = getAllFrameData; });
  useEffect(() => { onCrossFrameDragPreviewRef.current = onCrossFrameDragPreview; });
  useEffect(() => { onCrossFrameTileDropRef.current = onCrossFrameTileDrop; });
  useEffect(() => { onCrossFrameTileDropToEmptyRef.current = onCrossFrameTileDropToEmpty; });
  useEffect(() => { onCrossFrameTileDropAsNewBlockRef.current = onCrossFrameTileDropAsNewBlock; });
  useEffect(() => { sourceFrameIndexRef.current = sourceFrameIndex; });
  const onMoveBlockRef = useRef(onMoveBlock);
  const onCrossFrameBlockDropRef = useRef(onCrossFrameBlockDrop);
  const onCrossFrameBlockDragPreviewRef = useRef(onCrossFrameBlockDragPreview);
  useEffect(() => { onMoveBlockRef.current = onMoveBlock; });
  useEffect(() => { onCrossFrameBlockDropRef.current = onCrossFrameBlockDrop; });
  useEffect(() => { onCrossFrameBlockDragPreviewRef.current = onCrossFrameBlockDragPreview; });

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
    ghostIconSvg: string | null;
  } | null>(null);

  const colElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const gridElRefs = useRef<Map<string, HTMLElement>>(new Map());
  const colRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());
  const gridRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());
  const blockWrapperElsRef = useRef<Map<string, HTMLElement>>(new Map());
  const blockWrapperRectsSnapshot = useRef<Map<string, DOMRect>>(new Map());
  const blockDragInfoRef = useRef<{
    infoId: string;
    startX: number; startY: number;
    offsetX: number; offsetY: number;
    hasMoved: boolean;
    ghostWidth: number;
    ghostHtml: string;
    ghostImages: Image[];
  } | null>(null);
  const allFramesBlockRectsRef = useRef<Map<string, { rect: DOMRect; frameIndex: number }>>(new Map());

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

  function calcInsertIndexInCol(col: any, y: number, skipIndex?: number): number {
    const rect = colRectsSnapshot.current.get(col.ColId);
    if (!rect) return (col.Tiles ?? []).length;
    const tiles: any[] = col.Tiles ?? [];
    const N = tiles.length;
    if (skipIndex !== undefined) {
      // Build only the valid insert positions — exclude skipIndex and skipIndex+1 (both are no-ops).
      // Dividing the column into exactly this many zones eliminates dead zones where no feedback shows.
      const validInserts: number[] = [];
      for (let i = 0; i <= N; i++) {
        if (i !== skipIndex && i !== skipIndex + 1) validInserts.push(i);
      }
      if (validInserts.length === 0) return skipIndex;
      const colH = rect.bottom - rect.top;
      if (colH <= 0) return validInserts[0];
      const relY = Math.max(0, Math.min(colH, y - rect.top));
      const zoneIdx = Math.min(validInserts.length - 1, Math.floor(relY * validInserts.length / colH));
      return validInserts[zoneIdx];
    }
    let cumY = rect.top;
    for (let i = 0; i < N; i++) {
      const h = tiles[i].Height ?? TILE_H;
      if (y < cumY + h / 2) return i;
      cumY += h + TILE_GAP;
    }
    return N;
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
          const insertIndex = calcInsertIndexInCol(hoverCol, y, d.fromTileIndex);
          return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: false, valid: true }, targetFrameIdx: frameIdx };
        } else {
          if (d.fromColTileCount === 1) { const insertIndex = calcInsertIndexInCol(hoverCol, y); return { preview: { targetGridId: grid.InfoId, targetColId: hoverCol.ColId, insertIndex, newColumn: false, insertColAfterColId: null, isColumnSwap: true, valid: true, slotHeight: d.ghostHeight }, targetFrameIdx: frameIdx }; }
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
    const allBlocks = infoContentRef.current;
    if (allBlocks.length === 0) return null;
    const entries: Array<{ id: string; rect: DOMRect }> = [];
    for (const b of allBlocks) {
      const rect = blockWrapperRectsSnapshot.current.get(b.InfoId);
      if (rect) entries.push({ id: b.InfoId, rect });
    }
    if (entries.length === 0) return null;
    const { left, right } = entries[0].rect;
    if (x < left - 16 || x > right + 16) return null;
    // Skip tile-drop detection only for the inner core of each grid.
    // The top/bottom 24 px edges stay active for block-insert so the user can
    // target "insert between grids" without needing to hit the narrow gap precisely.
    const GRID_EDGE = 24;
    for (const [, rect] of gridRectsSnapshot.current) {
      const innerTop = rect.top + GRID_EDGE, innerBot = rect.bottom - GRID_EDGE;
      if (innerTop < innerBot && y > innerTop && y < innerBot && x > rect.left - 4 && x < rect.right + 4) return null;
    }
    const firstRect = entries[0].rect;
    const lastRect = entries[entries.length - 1].rect;
    if (y < firstRect.top - 120 || y > lastRect.bottom + 120) return null;
    // Midpoint-based detection: boundary between slot i and i+1 is the midpoint of block i
    const firstMid = (firstRect.top + firstRect.bottom) / 2;
    if (y < firstMid) return { insertBeforeInfoId: entries[0].id };
    for (let i = 0; i < entries.length - 1; i++) {
      const mid0 = (entries[i].rect.top + entries[i].rect.bottom) / 2;
      const mid1 = (entries[i + 1].rect.top + entries[i + 1].rect.bottom) / 2;
      if (y >= mid0 && y < mid1) return { insertBeforeInfoId: entries[i + 1].id };
    }
    return { insertBeforeInfoId: null };
  }

  function calcBlockDropTargetForFrame(
    y: number,
    entries: Array<{ id: string; rect: DOMRect }>,
    excludeInfoId: string | null,
  ): { insertBeforeInfoId: string | null } | null {
    const filtered = excludeInfoId ? entries.filter(e => e.id !== excludeInfoId) : entries;
    if (filtered.length === 0) return { insertBeforeInfoId: null };
    if (y < (filtered[0].rect.top + filtered[0].rect.bottom) / 2) return { insertBeforeInfoId: filtered[0].id };
    for (let i = 0; i < filtered.length - 1; i++) {
      const mid0 = (filtered[i].rect.top + filtered[i].rect.bottom) / 2;
      const mid1 = (filtered[i + 1].rect.top + filtered[i + 1].rect.bottom) / 2;
      if (y >= mid0 && y < mid1) return { insertBeforeInfoId: filtered[i + 1].id };
    }
    return { insertBeforeInfoId: null };
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
    if (blockDragInfoRef.current) return;
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
      ghostIconSvg: resolveIconSVG(tile, themeIconsRef.current),
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
        blockWrapperRectsSnapshot.current = new Map(
          [...blockWrapperElsRef.current.entries()].map(([id, el]) => [id, el.getBoundingClientRect()])
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

  function handleBlockDragStart(e: React.MouseEvent, infoId: string, wrapperEl: HTMLElement) {
    if (tileDragInfoRef.current) return;
    const rect = wrapperEl.getBoundingClientRect();
    const block = infoContentRef.current.find((b: any) => b.InfoId === infoId);
    blockDragInfoRef.current = {
      infoId, startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      hasMoved: false, ghostWidth: rect.width, ghostHtml: block?.InfoValue ?? '', ghostImages: block?.Images ?? [],
    };

    function buildEntries(frameContent: any[], frameIdx: number): Array<{ id: string; rect: DOMRect }> {
      const out: Array<{ id: string; rect: DOMRect }> = [];
      for (const b of frameContent) {
        const entry = allFramesBlockRectsRef.current.get(b.InfoId);
        if (entry && entry.frameIndex === frameIdx) out.push({ id: b.InfoId, rect: entry.rect });
      }
      return out;
    }

    function detectFrame(clientX: number, clientY: number): { frameIdx: number; frameContent: any[] } {
      for (const { frameIndex, infoContent: fc } of extraFramesContentRef.current) {
        const frameEl = extraFrameElsRef.current.get(frameIndex);
        if (!frameEl) continue;
        const fr = frameEl.getBoundingClientRect();
        if (clientX >= fr.left && clientX <= fr.right && clientY >= fr.top && clientY <= fr.bottom)
          return { frameIdx: frameIndex, frameContent: fc };
      }
      return { frameIdx: sourceFrameIndexRef.current, frameContent: infoContentRef.current };
    }

    function onMove(ev: MouseEvent) {
      const drag = blockDragInfoRef.current;
      if (!drag) return;
      if (!drag.hasMoved) {
        if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < 4) return;
        drag.hasMoved = true;
        allFramesBlockRectsRef.current = new Map(
          [...blockWrapperElsRef.current.entries()].map(([id, el]) => [id, { rect: el.getBoundingClientRect(), frameIndex: sourceFrameIndexRef.current }])
        );
        const extraData = getAllFrameDataRef.current?.();
        if (extraData) {
          for (const [id, { el, frameIndex }] of extraData.blockWrapperEls)
            allFramesBlockRectsRef.current.set(id, { rect: el.getBoundingClientRect(), frameIndex });
          extraFramesContentRef.current = extraData.frames;
          extraFrameElsRef.current = extraData.frameEls ?? new Map();
        }
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        setBlockDragId(infoId);
      }
      setBlockGhostPos({ x: ev.clientX, y: ev.clientY });
      const { frameIdx, frameContent } = detectFrame(ev.clientX, ev.clientY);
      const isCross = frameIdx !== sourceFrameIndexRef.current;
      const entries = buildEntries(frameContent, frameIdx);
      const drop = calcBlockDropTargetForFrame(ev.clientY, entries, isCross ? null : drag.infoId);
      if (isCross) {
        setBlockDropPreview(null);
        onCrossFrameBlockDragPreviewRef.current?.(drop ? { ...drop, targetFrameIdx: frameIdx } : null);
      } else {
        setBlockDropPreview(drop);
        onCrossFrameBlockDragPreviewRef.current?.(null);
      }
    }

    function onUp(ev: MouseEvent) {
      const drag = blockDragInfoRef.current;
      if (drag?.hasMoved) {
        const { frameIdx, frameContent } = detectFrame(ev.clientX, ev.clientY);
        const isCross = frameIdx !== sourceFrameIndexRef.current;
        const entries = buildEntries(frameContent, frameIdx);
        const drop = calcBlockDropTargetForFrame(ev.clientY, entries, isCross ? null : drag.infoId);
        if (drop) {
          if (isCross)
            onCrossFrameBlockDropRef.current?.(drag.infoId, sourceFrameIndexRef.current, frameIdx, drop.insertBeforeInfoId);
          else
            onMoveBlockRef.current?.(drag.infoId, drop.insertBeforeInfoId);
        }
      }
      blockDragInfoRef.current = null;
      setBlockDragId(null);
      setBlockGhostPos(null);
      setBlockDropPreview(null);
      onCrossFrameBlockDragPreviewRef.current?.(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const isDraggingAnything = !!dragTileId || !!tileDragId || !!blockDragId;
  const effectiveTileDropPreview = tileDropPreview ?? externalTileDropPreview ?? null;
  const effectiveBlockInsertPreview = blockInsertPreview ?? externalBlockInsertPreview ?? null;
  const effectiveDraggingTile = !!(tileDragId || isExternalDragActive);
  const effectiveBlockDropPreview = blockDropPreview ?? externalBlockDropPreview ?? null;
  const effectiveBlockDragActive = !!(blockDragId || isExternalBlockDragActive);

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
          (effectiveDraggingTile && tileGrids.length > 0) || effectiveBlockDragActive ? 'phone-add-row--tile-drop-zone' : '',
          effectiveDraggingTile && !!effectiveBlockInsertPreview && effectiveBlockInsertPreview.insertBeforeInfoId === infoContent[0]?.InfoId
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
        {effectiveBlockDragActive && !!effectiveBlockDropPreview &&
          effectiveBlockDropPreview.insertBeforeInfoId === infoContent[0]?.InfoId && infoContent.length > 0 && (
          <div className="block-drop-zone" />
        )}
        {groupInfoContent(infoContent).map((group) => {
          if (group.type === 'round-row') {
            const { blocks, nextInfoId } = group;
            const rowKey = blocks.map(b => b.InfoId).join('-');
            const tileDragZoneActive = effectiveDraggingTile &&
              !!effectiveBlockInsertPreview &&
              effectiveBlockInsertPreview.insertBeforeInfoId === nextInfoId;
            const blockDragZoneActive = effectiveBlockDragActive &&
              !!effectiveBlockDropPreview &&
              (effectiveBlockDropPreview.insertBeforeInfoId === nextInfoId ||
               blocks.some(b => b !== blocks[0] && b.InfoId === effectiveBlockDropPreview?.insertBeforeInfoId));
            return (
              <React.Fragment key={rowKey}>
                <div className="phone-round-cta-row">
                  {blocks.map(block => (
                    <div key={block.InfoId} ref={(el) => {
                      if (el) { blockWrapperElsRef.current.set(block.InfoId, el); onBlockWrapperRef?.(block.InfoId, el); }
                      else { blockWrapperElsRef.current.delete(block.InfoId); onBlockWrapperRef?.(block.InfoId, null); }
                    }}>
                      <CtaBlock
                        block={block}
                        ctaColors={themeCtaColors}
                        interactive={true}
                        isDragging={blockDragId === block.InfoId}
                        isSelected={selectedCtaId === block.InfoId}
                        onSelect={onSelectCta}
                        onDelete={(infoId) => onDeleteBlock?.(infoId)}
                        onDragStart={handleBlockDragStart}
                        onSelectImage={(ctaId) => setCtaImageEditId(ctaId)}
                      />
                    </div>
                  ))}
                </div>
                {(tileDragZoneActive || blockDragZoneActive)
                  ? <div className="block-drop-zone" />
                  : !effectiveBlockDragActive && (
                    <div className="phone-add-row">
                      <button className="phone-add-btn" type="button" aria-label="Add content block"
                        onClick={(e) => openAddMenu(e, nextInfoId)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )
                }
              </React.Fragment>
            );
          }
          const { block, nextInfoId } = group;
          const tileDragZoneActive = effectiveDraggingTile &&
            !!effectiveBlockInsertPreview &&
            effectiveBlockInsertPreview.insertBeforeInfoId === nextInfoId &&
            block.InfoType !== 'TileGrid';
          const blockDragZoneActive = effectiveBlockDragActive &&
            !!effectiveBlockDropPreview &&
            effectiveBlockDropPreview.insertBeforeInfoId === nextInfoId;
          if (block.InfoType === 'TileGrid') {
            return (
              <React.Fragment key={block.InfoId}>
                <TileGrids
                  tileGrids={[block]}
                  overrideAddBtnInsertBeforeInfoId={nextInfoId}
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
                    // Register grid element for both within-grid drop detection and
                    // block-level insertion detection (grid rect = tiles only, no add-row).
                    if (el) { gridElRefs.current.set(id, el); blockWrapperElsRef.current.set(id, el); }
                    else { gridElRefs.current.delete(id); blockWrapperElsRef.current.delete(id); }
                    onGridRefExternal?.(id, el);
                  }}
                  onTileDragStart={handleTileDragStart}
                  tileDragId={tileDragId}
                  tileDropPreview={effectiveTileDropPreview}
                  tileDragFromGridId={tileDragInfoRef.current?.fromGridId ?? null}
                  tileDragFromColId={tileDragInfoRef.current?.fromColId ?? null}
                  blockInsertPreview={effectiveBlockInsertPreview}
                  isDraggingTile={effectiveDraggingTile}
                  onTileNavigate={onTileNavigate}
                  onCollapseFromParent={onCollapseFromParent}
                  activeNavTileIds={activeNavTileIds}
                  onAddBtnClick={openAddMenu}
                  onTileDoubleClick={onTileDoubleClick}
                  onTileOptionsClick={(tileId, rect) =>
                    setTileMenu({ tileId, pos: { x: rect.left, y: rect.bottom + 4 } })
                  }
                  liveTileText={liveTileText}
                />
                {(tileDragZoneActive || blockDragZoneActive) && <div className="block-drop-zone" />}
              </React.Fragment>
            );
          }
          if (block.InfoType === 'Description') {
            return (
              <React.Fragment key={block.InfoId}>
                <div onClick={onDeselectTile} ref={(el) => {
                  if (el) { blockWrapperElsRef.current.set(block.InfoId, el); onBlockWrapperRef?.(block.InfoId, el); }
                  else { blockWrapperElsRef.current.delete(block.InfoId); onBlockWrapperRef?.(block.InfoId, null); }
                }}>
                  <DescriptionBlock
                    block={block}
                    interactive={true}
                    isDragging={blockDragId === block.InfoId}
                    onEdit={(infoId) => setEditorState({ mode: 'edit', infoId, currentHtml: block.InfoValue ?? '' })}
                    onDelete={(infoId) => onDeleteBlock?.(infoId)}
                    onDragStart={handleBlockDragStart}
                  />
                </div>
                {(tileDragZoneActive || blockDragZoneActive)
                  ? <div className="block-drop-zone" />
                  : !effectiveBlockDragActive && (
                    <div className="phone-add-row">
                      <button
                        className="phone-add-btn"
                        type="button"
                        aria-label="Add content block"
                        onClick={(e) => openAddMenu(e, nextInfoId)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )
                }
              </React.Fragment>
            );
          }
          if (block.InfoType === 'Images') {
            return (
              <React.Fragment key={block.InfoId}>
                <div onClick={onDeselectTile} ref={(el) => {
                  if (el) { blockWrapperElsRef.current.set(block.InfoId, el); onBlockWrapperRef?.(block.InfoId, el); }
                  else { blockWrapperElsRef.current.delete(block.InfoId); onBlockWrapperRef?.(block.InfoId, null); }
                }}>
                  <ImageBlock
                    block={block}
                    interactive={true}
                    isDragging={blockDragId === block.InfoId}
                    onEdit={(infoId) => setImageEditorState({ mode: 'edit', infoId, currentImages: block.Images ?? [] })}
                    onDelete={(infoId) => onDeleteBlock?.(infoId)}
                    onDragStart={handleBlockDragStart}
                  />
                </div>
                {(tileDragZoneActive || blockDragZoneActive)
                  ? <div className="block-drop-zone" />
                  : !effectiveBlockDragActive && (
                    <div className="phone-add-row">
                      <button
                        className="phone-add-btn"
                        type="button"
                        aria-label="Add content block"
                        onClick={(e) => openAddMenu(e, nextInfoId)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )
                }
              </React.Fragment>
            );
          }
          if (block.InfoType === 'Cta') {
            return (
              <React.Fragment key={block.InfoId}>
                <div ref={(el) => {
                  if (el) { blockWrapperElsRef.current.set(block.InfoId, el); onBlockWrapperRef?.(block.InfoId, el); }
                  else { blockWrapperElsRef.current.delete(block.InfoId); onBlockWrapperRef?.(block.InfoId, null); }
                }}>
                  <CtaBlock
                    block={block}
                    ctaColors={themeCtaColors}
                    interactive={true}
                    isDragging={blockDragId === block.InfoId}
                    isSelected={selectedCtaId === block.InfoId}
                    onSelect={onSelectCta}
                    onDelete={(infoId) => onDeleteBlock?.(infoId)}
                    onDragStart={handleBlockDragStart}
                    onSelectImage={(ctaId) => setCtaImageEditId(ctaId)}
                  />
                </div>
                {(tileDragZoneActive || blockDragZoneActive)
                  ? <div className="block-drop-zone" />
                  : !effectiveBlockDragActive && (
                    <div className="phone-add-row">
                      <button
                        className="phone-add-btn"
                        type="button"
                        aria-label="Add content block"
                        onClick={(e) => openAddMenu(e, nextInfoId)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )
                }
              </React.Fragment>
            );
          }
          return null;
        })}
      </div>

      {addMenu && (
        <AddBlockMenu
          pos={addMenu.pos}
          onSelect={handleMenuSelect}
          onClose={() => setAddMenu(null)}
        />
      )}

      {tileMenu && (
        <TileActionMenu
          tileId={tileMenu.tileId}
          pos={tileMenu.pos}
          onAction={(tileId, action) => {
            onTileMenuAction?.(tileId, action);
            setTileMenu(null);
          }}
          onClose={() => setTileMenu(null)}
        />
      )}

      {editorState && (
        <QuillEditorModal
          initialHtml={editorState.mode === 'edit' ? editorState.currentHtml : ''}
          onSave={(html) => {
            if (editorState.mode === 'create')
              onAddDescription?.(html, editorState.insertBeforeInfoId);
            else
              onEditDescription?.(editorState.infoId, html);
            setEditorState(null);
          }}
          onCancel={() => setEditorState(null)}
        />
      )}

      {imageEditorState && (
        <MediaLibraryModal
          initialImages={imageEditorState.mode === 'edit' ? imageEditorState.currentImages : []}
          onSelect={(images) => {
            if (imageEditorState.mode === 'create')
              onAddImage?.(images, imageEditorState.insertBeforeInfoId);
            else
              onEditImage?.(imageEditorState.infoId, images);
            setImageEditorState(null);
          }}
          onCancel={() => setImageEditorState(null)}
        />
      )}

      {ctaImageEditId && (
        <MediaLibraryModal
          initialImages={[]}
          singleSelect
          onSelect={(images) => {
            if (images[0]) onEditCta?.(ctaImageEditId, { CtaButtonImgUrl: images[0].InfoImageValue });
            setCtaImageEditId(null);
          }}
          onCancel={() => setCtaImageEditId(null)}
        />
      )}


      {ghostPos && tileDragId && tileDragInfoRef.current && (() => {
        const drag = tileDragInfoRef.current!;
        const { tileData } = drag;
        const hasIcon = !!drag.ghostIconSvg;
        const hasText = !!tileData.Text;
        return (
          <div
            className="phone-tile-ghost"
            style={{ left: ghostPos.x - drag.offsetX, top: ghostPos.y - drag.offsetY, width: drag.ghostWidth, height: drag.ghostHeight }}
          >
            <div
              className="phone-tile"
              style={{
                background: tileData.BGImageUrl ? undefined : drag.bgColor,
                color: drag.tileColor,
                textAlign: tileData.Align ?? 'center',
                alignItems: tileData.Align === 'left' ? 'flex-start' : tileData.Align === 'right' ? 'flex-end' : 'center',
                justifyContent: tileData.Align === 'left' ? 'flex-start' : 'center',
              }}
            >
              {tileData.BGImageUrl && <>
                <div className="phone-tile-bg-img" style={{ backgroundImage: `url("${tileData.BGImageUrl}")` }} />
                <div className="phone-tile-bg-dim" style={{ background: `rgba(0,0,0,${(tileData.Opacity ?? 0).toFixed(2)})` }} />
              </>}
              {hasIcon && (
                <div className="phone-tile-element">
                  <span className="phone-tile-icon" dangerouslySetInnerHTML={{ __html: drag.ghostIconSvg! }} />
                </div>
              )}
              {hasText && (
                <div className="phone-tile-element">
                  <span className="phone-tile-text">{tileData.Text}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {blockGhostPos && blockDragId && blockDragInfoRef.current && (() => {
        const drag = blockDragInfoRef.current!;
        const block = infoContent.find((b: any) => b.InfoId === blockDragId);
        return (
          <div
            className="phone-block-ghost"
            style={{
              left: blockGhostPos.x - drag.offsetX,
              top: blockGhostPos.y - drag.offsetY,
              width: drag.ghostWidth,
            }}
          >
            {block?.InfoType === 'Images' ? (
              <ImageBlock block={block} interactive={false} />
            ) : block?.InfoType === 'Cta' ? (
              <CtaBlock block={block} ctaColors={themeCtaColors} interactive={false} />
            ) : block ? (
              <DescriptionBlock block={block} interactive={false} />
            ) : null}
          </div>
        );
      })()}
    </>
  );
}
