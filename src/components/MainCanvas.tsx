import { useState, useRef, useEffect } from 'react';
import './MainCanvas.css';
import type { ThemeColors, ThemeIcon, ThemeCtaColor, TileDropPreview, BlockInsertPreview } from '../types';
import { PhoneStatusBar } from './phone/StatusBar';
import { PhoneAppHeader, PhoneLinkedHeader } from './phone/PhoneHeaders';
import { DraggableScreen, AllFrameData, CrossFramePreview } from './tile/DraggableScreen';
import { TileGrids } from './tile/TileGrids';
import { DescriptionBlock } from './phone/DescriptionBlock';
import { ImageBlock } from './phone/ImageBlock';
import { CtaBlock } from './phone/CtaBlock';
import { BulletinBoardPage } from './BulletinBoardPage';
import { CalendarPage } from './CalendarPage';
import { MyActivityPage } from './MyActivityPage';
import { MapPage } from './MapPage';

const MODULE_PAGE_TYPES = new Set(['BulletinBoard', 'Calendar', 'MyActivity', 'Map']);

function renderModulePage(pageType: string, themeColors?: ThemeColors) {
  switch (pageType) {
    case 'BulletinBoard': return <BulletinBoardPage />;
    case 'Calendar':      return <CalendarPage themeColors={themeColors} />;
    case 'MyActivity':    return <MyActivityPage themeColors={themeColors} />;
    case 'Map':           return <MapPage themeColors={themeColors} />;
    default:              return null;
  }
}

function renderThumbBlocks(blocks: any[], themeColors: ThemeColors | undefined, themeIcons: ThemeIcon[] | undefined, ctaColors: ThemeCtaColor[] | undefined) {
  const out: any[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (b.InfoType === 'TileGrid') { out.push(<TileGrids key={b.InfoId} tileGrids={[b]} themeColors={themeColors} themeIcons={themeIcons} interactive={false} />); i++; }
    else if (b.InfoType === 'Description') { out.push(<DescriptionBlock key={b.InfoId} block={b} interactive={false} />); i++; }
    else if (b.InfoType === 'Images') { out.push(<ImageBlock key={b.InfoId} block={b} interactive={false} />); i++; }
    else if (b.InfoType === 'Cta' && (b.CtaAttributes?.CtaButtonType || 'Image') === 'Round') {
      const row: any[] = [];
      while (i < blocks.length && (blocks[i].CtaAttributes?.CtaButtonType || 'Image') === 'Round' && blocks[i].InfoType === 'Cta' && row.length < 3) row.push(blocks[i++]);
      out.push(<div key={row[0].InfoId} className="phone-round-cta-row">{row.map(rb => <CtaBlock key={rb.InfoId} block={rb} ctaColors={ctaColors} interactive={false} />)}</div>);
    } else if (b.InfoType === 'Cta') { out.push(<CtaBlock key={b.InfoId} block={b} ctaColors={ctaColors} interactive={false} />); i++; }
    else { i++; }
  }
  return out;
}

export type { TileDropPreview, BlockInsertPreview, AllFrameData };

export interface LinkedFrame {
  page: any;
  infoContent: any[];
  onClose: () => void;
  onAddColumn?: (gridId: string, afterColId: string) => void;
  onDeleteTile?: (gridId: string, colId: string, tileId: string) => void;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onAddStandaloneTile?: () => void;
  onAddBlock?: (blockType: string, insertBeforeInfoId: string | null) => void;
  onAddTilesToColumn?: (gridId: string, colId: string, count: number) => void;
  onFreeResizeRelease?: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, oppColTiles: any[]) => void;
  onTileDrop?: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => void;
  onTileDropAsNewBlock?: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => void;
  onAddDescription?: (html: string, insertBeforeInfoId: string | null) => void;
  onEditDescription?: (infoId: string, html: string) => void;
  onDeleteBlock?: (infoId: string) => void;
  onMoveBlock?: (infoId: string, insertBeforeInfoId: string | null) => void;
  onCrossFrameBlockDrop?: (infoId: string, fromFrameIdx: number, toFrameIdx: number, insertBeforeInfoId: string | null) => void;
  onAddImage?: (images: { InfoImageId: string; InfoImageValue: string }[], insertBeforeInfoId: string | null) => void;
  onEditImage?: (infoId: string, images: { InfoImageId: string; InfoImageValue: string }[]) => void;
  onTileDoubleClick?: (tileId: string, rect: DOMRect) => void;
  onDeselectTile?: () => void;
  onSelectCta?: (ctaId: string) => void;
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
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
  onAddBlock?: (blockType: string, insertBeforeInfoId: string | null) => void;
  onFreeResizeRelease?: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, oppColTiles: any[]) => void;
  onTileDrop?: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => void;
  onTileDropAsNewBlock?: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => void;
  onCrossFrameTileDrop?: (fromFrameIdx: number, toFrameIdx: number, fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => void;
  onCrossFrameTileDropToEmpty?: (fromFrameIdx: number, toFrameIdx: number, fromGridId: string, fromColId: string, tileId: string) => void;
  onCrossFrameTileDropAsNewBlock?: (fromFrameIdx: number, toFrameIdx: number, fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => void;
  linkedFrames?: LinkedFrame[];
  onTileNavigate?: (pageId: string, parentIndex: number) => void;
  onCollapseDescendants?: (parentIndex: number) => void;
  activeNavTileIds?: Set<string>;
  onAddDescription?: (html: string, insertBeforeInfoId: string | null) => void;
  onEditDescription?: (infoId: string, html: string) => void;
  onDeleteBlock?: (infoId: string) => void;
  onMoveBlock?: (infoId: string, insertBeforeInfoId: string | null) => void;
  onCrossFrameBlockDrop?: (infoId: string, fromFrameIdx: number, toFrameIdx: number, insertBeforeInfoId: string | null) => void;
  onAddImage?: (images: { InfoImageId: string; InfoImageValue: string }[], insertBeforeInfoId: string | null) => void;
  onEditImage?: (infoId: string, images: { InfoImageId: string; InfoImageValue: string }[]) => void;
  onTileDoubleClick?: (tileId: string, rect: DOMRect) => void;
  onDeselectTile?: () => void;
  onSelectCta?: (ctaId: string) => void;
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
  selectedCtaId?: string | null;
  themeCtaColors?: ThemeCtaColor[];
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
  onAddBlock,
  onFreeResizeRelease,
  onTileDrop,
  onTileDropAsNewBlock,
  onCrossFrameTileDrop,
  onCrossFrameTileDropToEmpty,
  onCrossFrameTileDropAsNewBlock,
  linkedFrames,
  onTileNavigate,
  onCollapseDescendants,
  activeNavTileIds,
  onAddDescription,
  onEditDescription,
  onDeleteBlock,
  onMoveBlock,
  onCrossFrameBlockDrop,
  onAddImage,
  onEditImage,
  onTileDoubleClick,
  onDeselectTile,
  onSelectCta,
  onEditCta,
  selectedCtaId,
  themeCtaColors,
}: MainCanvasProps) {
  const tileGrids = infoContent.filter((block: any) => block.InfoType === 'TileGrid');

  // ── Cross-frame drag registry ──────────────────────────────────────────────
  const [crossFramePreview, setCrossFramePreview] = useState<CrossFramePreview | null>(null);
  const [crossFrameBlockPreview, setCrossFrameBlockPreview] = useState<{ insertBeforeInfoId: string | null; targetFrameIdx: number } | null>(null);
  const allFrameColElsRef = useRef<Map<number, Map<string, HTMLElement>>>(new Map());
  const allFrameGridElsRef = useRef<Map<number, Map<string, HTMLElement>>>(new Map());
  const allFrameBlockWrapperElsRef = useRef<Map<number, Map<string, HTMLElement>>>(new Map());
  const linkedFramesRef = useRef(linkedFrames);
  const infoContentRef_mc = useRef(infoContent);
  useEffect(() => { linkedFramesRef.current = linkedFrames; });
  useEffect(() => { infoContentRef_mc.current = infoContent; });

  function registerFrameEl(frameIdx: number, type: 'col' | 'grid' | 'blockWrapper', id: string, el: HTMLElement | null) {
    const map = type === 'col' ? allFrameColElsRef.current
      : type === 'grid' ? allFrameGridElsRef.current
      : allFrameBlockWrapperElsRef.current;
    if (!map.has(frameIdx)) map.set(frameIdx, new Map());
    if (el) map.get(frameIdx)!.set(id, el);
    else map.get(frameIdx)!.delete(id);
  }

  function getAllFrameData(excludeFrameIdx: number): AllFrameData {
    const result: AllFrameData = { frames: [], colEls: new Map(), gridEls: new Map(), frameEls: new Map(), blockWrapperEls: new Map() };
    const addFrame = (fi: number, fc: any[], frameEl: HTMLElement | null) => {
      if (fi === excludeFrameIdx) return;
      result.frames.push({ frameIndex: fi, infoContent: fc });
      for (const [id, el] of (allFrameColElsRef.current.get(fi) ?? new Map())) result.colEls.set(id, { el, frameIndex: fi });
      for (const [id, el] of (allFrameGridElsRef.current.get(fi) ?? new Map())) {
        result.gridEls.set(id, { el, frameIndex: fi });
        result.blockWrapperEls.set(id, { el, frameIndex: fi });
      }
      for (const [id, el] of (allFrameBlockWrapperElsRef.current.get(fi) ?? new Map())) result.blockWrapperEls.set(id, { el, frameIndex: fi });
      if (frameEl) result.frameEls.set(fi, frameEl);
    };
    addFrame(-1, infoContentRef_mc.current, mainPhoneFrameRef.current);
    linkedFramesRef.current?.forEach((f, i) => addFrame(i, f.infoContent, linkedFrameRefs.current.get(i) ?? null));
    return result;
  }

  // ── Active frame ───────────────────────────────────────────────────────────
  const [manualActiveIndex, setManualActiveIndex] = useState<number | null>(null);
  useEffect(() => { setManualActiveIndex(null); }, [selectedTileId]);

  const derivedActiveIndex = (() => {
    if (!selectedTileId) return -1;
    const hasTile = (blocks: any[]) => blocks.some((b: any) =>
      b.InfoType === 'TileGrid' &&
      (b.Columns ?? []).some((c: any) => (c.Tiles ?? []).some((t: any) => t.Id === selectedTileId))
    );
    if (hasTile(infoContent)) return -1;
    const idx = linkedFrames?.findIndex(f => hasTile(f.infoContent)) ?? -1;
    return idx >= 0 ? idx : -1;
  })();

  const activeFrameIndex = manualActiveIndex !== null ? manualActiveIndex : derivedActiveIndex;

  // ── Thumbnail scale sync ───────────────────────────────────────────────────
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

  // ── Scroll active frame into view ──────────────────────────────────────────
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const linkedFrameRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  function scrollToFrame(index: number) {
    const stage = canvasStageRef.current;
    const el = index === -1 ? mainPhoneFrameRef.current : linkedFrameRefs.current.get(index) ?? null;
    if (!el || !stage) return;
    const targetLeft = el.offsetLeft - (stage.clientWidth - el.offsetWidth) / 2;
    stage.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }

  useEffect(() => { scrollToFrame(activeFrameIndex); }, [activeFrameIndex]);

  const prevLinkedFramesRef = useRef<typeof linkedFrames>(linkedFrames);
  useEffect(() => {
    const prev = prevLinkedFramesRef.current ?? [];
    const curr = linkedFrames ?? [];
    for (let i = 0; i < curr.length; i++) {
      if (prev[i]?.page?.PageId !== curr[i]?.page?.PageId) { scrollToFrame(i); break; }
    }
    prevLinkedFramesRef.current = linkedFrames;
  }, [linkedFrames]);

  return (
    <main className="app-canvas">
      <div className="canvas-stage" ref={canvasStageRef}>
        {/* Home frame */}
        <div className={`phone-frame${activeFrameIndex === -1 ? ' phone-frame--active' : ' phone-frame--inactive'}`} ref={mainPhoneFrameRef}>
          <PhoneStatusBar />
          <PhoneAppHeader />
          <DraggableScreen
            infoContent={infoContent}
            tileGrids={tileGrids}
            themeColors={themeColors}
            themeIcons={themeIcons}
            selectedTileId={selectedTileId}
            onSelectTile={onSelectTile}
            onAddColumn={onAddColumn}
            onDeleteTile={onDeleteTile}
            onEditTile={onEditTile}
            onAddTilesToColumn={onAddTilesToColumn}
            onAddStandaloneTile={onAddStandaloneTile}
            onAddBlock={onAddBlock}
            onFreeResizeRelease={onFreeResizeRelease}
            onTileDrop={onTileDrop}
            onTileDropAsNewBlock={onTileDropAsNewBlock}
            onTileNavigate={onTileNavigate ? (pageId) => onTileNavigate(pageId, -1) : undefined}
            onCollapseFromParent={onCollapseDescendants ? () => onCollapseDescendants(-1) : undefined}
            activeNavTileIds={activeNavTileIds}
            sourceFrameIndex={-1}
            getAllFrameData={() => getAllFrameData(-1)}
            onCrossFrameDragPreview={setCrossFramePreview}
            onCrossFrameTileDrop={onCrossFrameTileDrop ? (fg, fc, tid, tfi, pv) => onCrossFrameTileDrop(-1, tfi, fg, fc, tid, pv) : undefined}
            onCrossFrameTileDropToEmpty={onCrossFrameTileDropToEmpty ? (fg, fc, tid, tfi) => onCrossFrameTileDropToEmpty(-1, tfi, fg, fc, tid) : undefined}
            onCrossFrameTileDropAsNewBlock={onCrossFrameTileDropAsNewBlock ? (fg, fc, tid, tfi, bi) => onCrossFrameTileDropAsNewBlock(-1, tfi, fg, fc, tid, bi) : undefined}
            externalTileDropPreview={crossFramePreview?.frameIndex === -1 ? crossFramePreview.tdPreview : null}
            externalBlockInsertPreview={crossFramePreview?.frameIndex === -1 ? crossFramePreview.biPreview : null}
            isExternalDragActive={!!(crossFramePreview?.frameIndex === -1 && (crossFramePreview.tdPreview || crossFramePreview.biPreview || crossFramePreview.emptyDrop))}
            onColRef={(id, el) => registerFrameEl(-1, 'col', id, el)}
            onGridRef={(id, el) => registerFrameEl(-1, 'grid', id, el)}
            onBlockWrapperRef={(id, el) => registerFrameEl(-1, 'blockWrapper', id, el)}
            onAddDescription={onAddDescription}
            onEditDescription={onEditDescription}
            onDeleteBlock={onDeleteBlock}
            onMoveBlock={onMoveBlock}
            onCrossFrameBlockDrop={onCrossFrameBlockDrop}
            onCrossFrameBlockDragPreview={setCrossFrameBlockPreview}
            externalBlockDropPreview={crossFrameBlockPreview?.targetFrameIdx === -1 ? { insertBeforeInfoId: crossFrameBlockPreview.insertBeforeInfoId } : null}
            isExternalBlockDragActive={crossFrameBlockPreview?.targetFrameIdx === -1}
            onAddImage={onAddImage}
            onEditImage={onEditImage}
            onTileDoubleClick={onTileDoubleClick}
            onDeselectTile={onDeselectTile}
            onSelectCta={onSelectCta}
            onEditCta={onEditCta}
            selectedCtaId={selectedCtaId}
            themeCtaColors={themeCtaColors}
          />
        </div>

        {/* Linked page frames */}
        {linkedFrames?.map((frame, i) => {
          const pageType = frame.page?.PageType ?? '';
          const isModulePage = MODULE_PAGE_TYPES.has(pageType);
          const frameTileGrids = isModulePage ? [] : frame.infoContent.filter((b: any) => b.InfoType === 'TileGrid');
          return (
            <div
              key={frame.page?.PageId ?? i}
              className={`phone-frame phone-frame--linked${activeFrameIndex === i ? ' phone-frame--active' : ' phone-frame--inactive'}`}
              ref={(el) => { if (el) linkedFrameRefs.current.set(i, el); else linkedFrameRefs.current.delete(i); }}
            >
              <PhoneStatusBar />
              <PhoneLinkedHeader pageName={frame.page?.PageName ?? ''} onBack={frame.onClose} />
              {isModulePage ? renderModulePage(pageType, themeColors) : <DraggableScreen
                infoContent={frame.infoContent}
                tileGrids={frameTileGrids}
                themeColors={themeColors}
                themeIcons={themeIcons}
                selectedTileId={selectedTileId}
                onSelectTile={onSelectTile}
                onAddColumn={frame.onAddColumn}
                onDeleteTile={frame.onDeleteTile}
                onEditTile={frame.onEditTile}
                onAddTilesToColumn={frame.onAddTilesToColumn}
                onAddStandaloneTile={frame.onAddStandaloneTile}
                onAddBlock={frame.onAddBlock}
                onFreeResizeRelease={frame.onFreeResizeRelease}
                onTileDrop={frame.onTileDrop}
                onTileDropAsNewBlock={frame.onTileDropAsNewBlock}
                onTileNavigate={onTileNavigate ? (pageId) => onTileNavigate(pageId, i) : undefined}
                onCollapseFromParent={onCollapseDescendants ? () => onCollapseDescendants(i) : undefined}
                activeNavTileIds={activeNavTileIds}
                sourceFrameIndex={i}
                getAllFrameData={() => getAllFrameData(i)}
                onCrossFrameDragPreview={setCrossFramePreview}
                onCrossFrameTileDrop={onCrossFrameTileDrop ? (fg, fc, tid, tfi, pv) => onCrossFrameTileDrop(i, tfi, fg, fc, tid, pv) : undefined}
                onCrossFrameTileDropToEmpty={onCrossFrameTileDropToEmpty ? (fg, fc, tid, tfi) => onCrossFrameTileDropToEmpty(i, tfi, fg, fc, tid) : undefined}
                onCrossFrameTileDropAsNewBlock={onCrossFrameTileDropAsNewBlock ? (fg, fc, tid, tfi, bi) => onCrossFrameTileDropAsNewBlock(i, tfi, fg, fc, tid, bi) : undefined}
                externalTileDropPreview={crossFramePreview?.frameIndex === i ? crossFramePreview.tdPreview : null}
                externalBlockInsertPreview={crossFramePreview?.frameIndex === i ? crossFramePreview.biPreview : null}
                isExternalDragActive={!!(crossFramePreview?.frameIndex === i && (crossFramePreview.tdPreview || crossFramePreview.biPreview || crossFramePreview.emptyDrop))}
                onColRef={(id, el) => registerFrameEl(i, 'col', id, el)}
                onGridRef={(id, el) => registerFrameEl(i, 'grid', id, el)}
                onBlockWrapperRef={(id, el) => registerFrameEl(i, 'blockWrapper', id, el)}
                onAddDescription={frame.onAddDescription}
                onEditDescription={frame.onEditDescription}
                onDeleteBlock={frame.onDeleteBlock}
                onMoveBlock={frame.onMoveBlock}
                onCrossFrameBlockDrop={onCrossFrameBlockDrop}
                onCrossFrameBlockDragPreview={setCrossFrameBlockPreview}
                externalBlockDropPreview={crossFrameBlockPreview?.targetFrameIdx === i ? { insertBeforeInfoId: crossFrameBlockPreview.insertBeforeInfoId } : null}
                isExternalBlockDragActive={crossFrameBlockPreview?.targetFrameIdx === i}
                onAddImage={frame.onAddImage}
                onEditImage={frame.onEditImage}
                onTileDoubleClick={frame.onTileDoubleClick}
                onDeselectTile={frame.onDeselectTile}
                onSelectCta={frame.onSelectCta}
                onEditCta={frame.onEditCta}
                selectedCtaId={selectedCtaId}
                themeCtaColors={themeCtaColors}
              />}
            </div>
          );
        })}
      </div>

      {/* Page thumbnails */}
      <div className="page-thumbnails">
        <div
          className={`page-thumb-clip${activeFrameIndex === -1 ? ' page-thumb-clip--active' : ''}`}
          onClick={() => { setManualActiveIndex(-1); scrollToFrame(-1); }}
        >
          <div
            className="phone-frame page-thumb-frame"
            style={{ width: thumbFrameW, transform: `scale(${(45 / thumbFrameW).toFixed(6)})` }}
          >
            <PhoneStatusBar />
            <PhoneAppHeader />
            <div className="phone-screen">
              <div className={`phone-add-row${infoContent.length === 0 ? ' phone-add-row--visible' : ''}`} />
              {renderThumbBlocks(infoContent, themeColors, themeIcons, themeCtaColors)}
            </div>
          </div>
        </div>

        {linkedFrames?.map((frame, i) => (
          <div
            key={frame.page?.PageId ?? i}
            className={`page-thumb-clip${activeFrameIndex === i ? ' page-thumb-clip--active' : ''}`}
            onClick={() => { setManualActiveIndex(i); scrollToFrame(i); }}
          >
            <div
              className="phone-frame page-thumb-frame"
              style={{ width: thumbFrameW, transform: `scale(${(45 / thumbFrameW).toFixed(6)})` }}
            >
              <PhoneStatusBar />
              <PhoneLinkedHeader pageName={frame.page?.PageName ?? ''} onBack={() => {}} />
              <div className="phone-screen">
                {MODULE_PAGE_TYPES.has(frame.page?.PageType ?? '')
                  ? renderModulePage(frame.page.PageType, themeColors)
                  : <>
                      <div className={`phone-add-row${frame.infoContent.length === 0 ? ' phone-add-row--visible' : ''}`} />
                      {renderThumbBlocks(frame.infoContent, themeColors, themeIcons, themeCtaColors)}
                    </>
                }
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
