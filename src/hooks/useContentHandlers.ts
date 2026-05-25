import {
  applyAddColumn, applyDeleteTile, applyAddStandaloneTile, applyAddBlock,
  applyEditTile, applyAddTilesToColumn, applyAddDescription, applyEditDescription,
  applyDeleteBlock, applyMoveBlock, applyExtractBlock, applyInsertBlock,
  applyAddImage, applyEditImageSelection, applyEditCta,
  applyFreeResizeRelease, applyTileDrop, applyTileDropAsNewBlock,
  extractTileFromContent, insertTileAtPreview,
} from '../utils/contentTransforms';
import type { TileDropPreview } from '../components/MainCanvas';

const TILE_H = 80;

interface Props {
  infoContent: any[];
  setInfoContent: React.Dispatch<React.SetStateAction<any[]>>;
  navContents: Record<string, any[]>;
  setNavContents: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  navStack: string[];
  selectedTileId: string | null;
  setSelectedTileId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedCtaId: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingCta: React.Dispatch<React.SetStateAction<any>>;
  pushSnapshot: () => void;
  isResizingRef: React.MutableRefObject<boolean>;
  onNewTileCreated?: () => void;
}

export function useContentHandlers({
  infoContent, setInfoContent,
  navContents, setNavContents, navStack,
  selectedTileId, setSelectedTileId, setSelectedCtaId, setPendingCta,
  pushSnapshot, isResizingRef,
  onNewTileCreated,
}: Props) {

  // ── Content block handlers ────────────────────────────────────────────────

  function handleAddColumn(gridId: string, afterColId: string) {
    pushSnapshot();
    setInfoContent(prev => applyAddColumn(prev, gridId, afterColId));
  }

  function handleDeleteTile(gridId: string, colId: string, tileId: string) {
    if (selectedTileId === tileId) setSelectedTileId(null);
    pushSnapshot();
    setInfoContent(prev => applyDeleteTile(prev, gridId, colId, tileId));
  }

  function handleAddStandaloneTile() {
    if (!isResizingRef.current) pushSnapshot();
    const ts = Date.now();
    setInfoContent(prev => applyAddStandaloneTile(prev, ts));
    setSelectedTileId(`tile-${ts}`);
    onNewTileCreated?.();
  }

  function handleAddBlock(blockType: string, insertBeforeInfoId: string | null) {
    if (blockType.startsWith('Cta_')) {
      setPendingCta({ blockType, insertBeforeInfoId, frameId: null });
      return;
    }
    pushSnapshot();
    const ts = Date.now();
    if (blockType === 'TileGrid') {
      setInfoContent(prev => applyAddBlock(prev, blockType, insertBeforeInfoId, ts));
      setSelectedTileId(`tile-${ts}`);
      setSelectedCtaId(null);
      onNewTileCreated?.();
    } else {
      setInfoContent(prev => applyAddBlock(prev, blockType, insertBeforeInfoId));
    }
  }

  function handleEditCta(ctaId: string, patch: Record<string, any>) {
    const keys = Object.keys(patch);
    const isLabelOnly = keys.length === 1 && 'CtaLabel' in patch;
    const isActionOnly = keys.length === 1 && 'CtaAction' in patch;
    if (!isLabelOnly && !isActionOnly) pushSnapshot();
    setInfoContent(prev => applyEditCta(prev, ctaId, patch));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditCta(blocks, ctaId, patch);
      return next;
    });
  }

  function handleSelectCta(ctaId: string) {
    setSelectedCtaId(ctaId);
    setSelectedTileId(null);
  }

  function handleAddTilesToColumn(gridId: string, colId: string, count: number) {
    if (!isResizingRef.current) pushSnapshot();
    setInfoContent(prev => applyAddTilesToColumn(prev, gridId, colId, count));
    onNewTileCreated?.();
  }

  function handleAddDescription(html: string, insertBeforeInfoId: string | null) {
    pushSnapshot();
    setInfoContent(prev => applyAddDescription(prev, html, insertBeforeInfoId));
  }

  function handleEditDescription(infoId: string, html: string) {
    pushSnapshot();
    setInfoContent(prev => applyEditDescription(prev, infoId, html));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditDescription(blocks, infoId, html);
      return next;
    });
  }

  function handleDeleteBlock(infoId: string) {
    pushSnapshot();
    setInfoContent(prev => applyDeleteBlock(prev, infoId));
  }

  function handleAddImage(images: { InfoImageId: string; InfoImageValue: string }[], insertBeforeInfoId: string | null) {
    pushSnapshot();
    setInfoContent(prev => applyAddImage(prev, images, insertBeforeInfoId));
  }

  function handleEditImage(infoId: string, images: { InfoImageId: string; InfoImageValue: string }[]) {
    pushSnapshot();
    setInfoContent(prev => applyEditImageSelection(prev, infoId, images));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditImageSelection(blocks, infoId, images);
      return next;
    });
  }

  function handleMoveBlock(infoId: string, insertBeforeInfoId: string | null) {
    pushSnapshot();
    setInfoContent(prev => applyMoveBlock(prev, infoId, insertBeforeInfoId));
  }

  function handleCrossFrameBlockDrop(
    infoId: string, fromFrameIdx: number, toFrameIdx: number, insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent = toFrameIdx === -1 ? infoContent : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, block } = applyExtractBlock(srcContent, infoId);
    if (!block) return;
    const newTgt = applyInsertBlock(tgtContent, block, insertBeforeInfoId);
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents(prev => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleEditTile(tileId: string, patch: Record<string, any>) {
    const keys = Object.keys(patch);
    const isHeightOnly = keys.length === 1 && 'Height' in patch;
    const isOpacityOnly = keys.length === 1 && 'Opacity' in patch;
    const isTextOnly = keys.length === 1 && 'Text' in patch;
    if (isHeightOnly) {
      if (!isResizingRef.current) { pushSnapshot(); isResizingRef.current = true; }
    } else if (!isOpacityOnly && !isTextOnly) {
      pushSnapshot();
    }
    setInfoContent(prev => applyEditTile(prev, tileId, patch));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditTile(blocks, tileId, patch);
      return next;
    });
  }

  // ── Tile drag handlers ────────────────────────────────────────────────────

  function handleFreeResizeRelease(
    gridId: string, longTileId: string, snapH: number,
    zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[],
  ) {
    isResizingRef.current = false;
    setInfoContent(prev => applyFreeResizeRelease(prev, gridId, longTileId, snapH, zoneCount, initialCount, oppColId, allOppTiles));
  }

  function handleTileDrop(fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) {
    pushSnapshot();
    setInfoContent(prev => applyTileDrop(prev, fromGridId, fromColId, tileId, preview));
  }

  function handleTileDropAsNewBlock(fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) {
    pushSnapshot();
    setInfoContent(prev => applyTileDropAsNewBlock(prev, fromGridId, fromColId, tileId, insertBeforeInfoId));
  }

  function handleCrossFrameTileDrop(
    fromFrameIdx: number, toFrameIdx: number,
    fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview,
  ) {
    pushSnapshot();
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent = toFrameIdx === -1 ? infoContent : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(srcContent, fromGridId, fromColId, tileId);
    if (!tile) return;
    const newTgt = insertTileAtPreview(tgtContent, tile, preview);
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents(prev => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleCrossFrameTileDropToEmpty(
    fromFrameIdx: number, toFrameIdx: number,
    fromGridId: string, fromColId: string, tileId: string,
  ) {
    pushSnapshot();
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(srcContent, fromGridId, fromColId, tileId);
    if (!tile) return;
    const ts = Date.now();
    const newTgt = [{ InfoId: `grid-${ts}`, InfoType: 'TileGrid', Columns: [{ ColId: `col-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] }] }];
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents(prev => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleCrossFrameTileDropAsNewBlock(
    fromFrameIdx: number, toFrameIdx: number,
    fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent = toFrameIdx === -1 ? infoContent : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(srcContent, fromGridId, fromColId, tileId);
    if (!tile) return;
    const ts = Date.now();
    const newGrid = { InfoId: `grid-new-${ts}`, InfoType: 'TileGrid', Columns: [{ ColId: `col-new-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] }] };
    const newTgt = insertBeforeInfoId === null
      ? [...tgtContent, newGrid]
      : (() => {
          const idx = tgtContent.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
          return idx === -1 ? [...tgtContent, newGrid] : [...tgtContent.slice(0, idx), newGrid, ...tgtContent.slice(idx)];
        })();
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents(prev => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  return {
    handleAddColumn, handleDeleteTile, handleAddStandaloneTile, handleAddBlock,
    handleEditCta, handleSelectCta, handleAddTilesToColumn,
    handleAddDescription, handleEditDescription, handleDeleteBlock,
    handleAddImage, handleEditImage, handleMoveBlock, handleCrossFrameBlockDrop,
    handleEditTile, handleFreeResizeRelease, handleTileDrop, handleTileDropAsNewBlock,
    handleCrossFrameTileDrop, handleCrossFrameTileDropToEmpty, handleCrossFrameTileDropAsNewBlock,
  };
}
