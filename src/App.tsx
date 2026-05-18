import { useEffect, useMemo, useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import type { TileDropPreview } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme, Mood } from './types';
import {
  applyAddColumn,
  applyDeleteTile,
  applyAddStandaloneTile,
  applyAddBlock,
  applyEditTile,
  applyAddTilesToColumn,
  applyFreeResizeRelease,
  applyTileDrop,
  applyTileDropAsNewBlock,
  extractTileFromContent,
  insertTileAtPreview,
  parseInfoContent,
  applyAddDescription,
  applyEditDescription,
  applyDeleteBlock,
  applyMoveBlock,
  applyExtractBlock,
  applyInsertBlock,
} from './utils/contentTransforms';

const TILE_H = 80;

function App() {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const allMoods: Mood[] = dataStore.get('Moods') ?? [];

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [infoContent, setInfoContent] = useState<any[]>(parseInfoContent);

  const [navStack, setNavStack] = useState<string[]>([]);
  const [navContents, setNavContents] = useState<Record<string, any[]>>({});

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter(m => m.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get('Current_Version')?.Page ?? [];

  const selectedTile = selectedTileId
    ? [
        ...infoContent.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? [])),
        ...Object.values(navContents).flatMap(blocks =>
          blocks.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []))
        ),
      ].find((t: any) => t.Id === selectedTileId) ?? null
    : null;

  const activeNavTileIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < navStack.length; i++) {
      const pageId = navStack[i];
      const parentContent = i === 0 ? infoContent : (navContents[navStack[i - 1]] ?? []);
      for (const block of parentContent) {
        if (block.InfoType !== 'TileGrid') continue;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Action?.ObjectId === pageId) ids.add(tile.Id);
          }
        }
      }
    }
    return ids;
  }, [navStack, infoContent, navContents]);

  useEffect(() => {
    const cv = dataStore.get('Current_Version');
    if (!cv) return;
    dataStore.set('Current_Version', {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        if (p.PageName?.toLowerCase() !== 'home') return p;
        let existing: any = {};
        try { existing = JSON.parse(p.PageStructure); } catch {}
        return { ...p, PageStructure: JSON.stringify({ ...existing, InfoContent: infoContent }) };
      }),
    });
  }, [infoContent]);

  useEffect(() => {
    if (Object.keys(navContents).length === 0) return;
    const cv = dataStore.get('Current_Version');
    if (!cv) return;
    dataStore.set('Current_Version', {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        const content = navContents[p.PageId];
        if (content === undefined) return p;
        let existing: any = {};
        try { existing = JSON.parse(p.PageStructure); } catch {}
        return { ...p, PageStructure: JSON.stringify({ ...existing, InfoContent: content }) };
      }),
    });
  }, [navContents]);

  function handleAddColumn(gridId: string, afterColId: string) {
    setInfoContent(prev => applyAddColumn(prev, gridId, afterColId));
  }

  function handleDeleteTile(gridId: string, colId: string, tileId: string) {
    if (selectedTileId === tileId) setSelectedTileId(null);
    setInfoContent(prev => applyDeleteTile(prev, gridId, colId, tileId));
  }

  function handleAddStandaloneTile() {
    const ts = Date.now();
    setInfoContent(prev => applyAddStandaloneTile(prev, ts));
    setSelectedTileId(`tile-${ts}`);
  }

  function handleAddBlock(blockType: string, insertBeforeInfoId: string | null) {
    if (blockType === 'TileGrid') {
      const ts = Date.now();
      setInfoContent(prev => applyAddBlock(prev, blockType, insertBeforeInfoId, ts));
      setSelectedTileId(`tile-${ts}`);
    } else {
      setInfoContent(prev => applyAddBlock(prev, blockType, insertBeforeInfoId));
    }
  }

  function handleAddTilesToColumn(gridId: string, colId: string, count: number) {
    setInfoContent(prev => applyAddTilesToColumn(prev, gridId, colId, count));
  }

  function handleAddDescription(html: string, insertBeforeInfoId: string | null) {
    setInfoContent(prev => applyAddDescription(prev, html, insertBeforeInfoId));
  }

  function handleEditDescription(infoId: string, html: string) {
    setInfoContent(prev => applyEditDescription(prev, infoId, html));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev)) next[id] = applyEditDescription(blocks, infoId, html);
      return next;
    });
  }

  function handleDeleteBlock(infoId: string) {
    setInfoContent(prev => applyDeleteBlock(prev, infoId));
  }

  function handleMoveBlock(infoId: string, insertBeforeInfoId: string | null) {
    setInfoContent(prev => applyMoveBlock(prev, infoId, insertBeforeInfoId));
  }

  function handleCrossFrameBlockDrop(infoId: string, fromFrameIdx: number, toFrameIdx: number, insertBeforeInfoId: string | null) {
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

  function handleFreeResizeRelease(gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]) {
    setInfoContent(prev => applyFreeResizeRelease(prev, gridId, longTileId, snapH, zoneCount, initialCount, oppColId, allOppTiles));
  }

  function handleTileDrop(fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) {
    setInfoContent(prev => applyTileDrop(prev, fromGridId, fromColId, tileId, preview));
  }

  function handleTileDropAsNewBlock(fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) {
    setInfoContent(prev => applyTileDropAsNewBlock(prev, fromGridId, fromColId, tileId, insertBeforeInfoId));
  }

  function handleCrossFrameTileDrop(
    fromFrameIdx: number, toFrameIdx: number,
    fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview,
  ) {
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
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(srcContent, fromGridId, fromColId, tileId);
    if (!tile) return;
    const ts = Date.now();
    const newTgt = [{
      InfoId: `grid-${ts}`, InfoType: 'TileGrid',
      Columns: [{ ColId: `col-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] }],
    }];
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
    fromGridId: string, fromColId: string, tileId: string,
    insertBeforeInfoId: string | null,
  ) {
    const srcContent = fromFrameIdx === -1 ? infoContent : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent = toFrameIdx === -1 ? infoContent : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(srcContent, fromGridId, fromColId, tileId);
    if (!tile) return;
    const ts = Date.now();
    const newGrid = {
      InfoId: `grid-new-${ts}`, InfoType: 'TileGrid',
      Columns: [{ ColId: `col-new-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] }],
    };
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

  function handleEditTile(tileId: string, patch: Record<string, any>) {
    setInfoContent(prev => applyEditTile(prev, tileId, patch));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev)) next[id] = applyEditTile(blocks, tileId, patch);
      return next;
    });
  }

  function handleTileNavigate(pageId: string, parentIndex: number) {
    const insertAt = parentIndex + 1;
    setNavStack(prev => {
      if (prev[insertAt] === pageId) return prev.slice(0, insertAt + 1);
      return [...prev.slice(0, insertAt), pageId];
    });
    setNavContents(prev => {
      if (prev[pageId] !== undefined) return prev;
      const cv = dataStore.get('Current_Version');
      const page = (cv?.Page ?? []).find((p: any) => p.PageId === pageId);
      if (!page?.PageStructure) return { ...prev, [pageId]: [] };
      try { return { ...prev, [pageId]: JSON.parse(page.PageStructure).InfoContent ?? [] }; }
      catch { return { ...prev, [pageId]: [] }; }
    });
  }

  function handleCollapseDescendants(parentIndex: number) {
    const cutAt = parentIndex + 1;
    setNavStack(prev => prev.length <= cutAt ? prev : prev.slice(0, cutAt));
  }

  function handleCloseFromIndex(stackIndex: number) {
    setNavStack(prev => prev.slice(0, stackIndex));
  }

  function navUpdater(pageId: string) {
    return (transform: (blocks: any[]) => any[]) =>
      setNavContents(prev => ({ ...prev, [pageId]: transform(prev[pageId] ?? []) }));
  }

  const linkedFrames = navStack.map((pageId, index) => {
    const page = allPages.find((p: any) => p.PageId === pageId);
    const update = navUpdater(pageId);
    return {
      page,
      infoContent: navContents[pageId] ?? [],
      onClose: () => handleCloseFromIndex(index),
      onAddColumn: (gridId: string, afterColId: string) =>
        update(prev => applyAddColumn(prev, gridId, afterColId)),
      onDeleteTile: (gridId: string, colId: string, tileId: string) => {
        if (selectedTileId === tileId) setSelectedTileId(null);
        update(prev => applyDeleteTile(prev, gridId, colId, tileId));
      },
      onEditTile: handleEditTile,
      onAddStandaloneTile: () => {
        const ts = Date.now();
        update(prev => applyAddStandaloneTile(prev, ts));
        setSelectedTileId(`tile-${ts}`);
      },
      onAddBlock: (blockType: string, insertBeforeInfoId: string | null) => {
        if (blockType === 'TileGrid') {
          const ts = Date.now();
          update(prev => applyAddBlock(prev, blockType, insertBeforeInfoId, ts));
          setSelectedTileId(`tile-${ts}`);
        } else {
          update(prev => applyAddBlock(prev, blockType, insertBeforeInfoId));
        }
      },
      onAddTilesToColumn: (gridId: string, colId: string, count: number) =>
        update(prev => applyAddTilesToColumn(prev, gridId, colId, count)),
      onFreeResizeRelease: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]) =>
        update(prev => applyFreeResizeRelease(prev, gridId, longTileId, snapH, zoneCount, initialCount, oppColId, allOppTiles)),
      onTileDrop: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) =>
        update(prev => applyTileDrop(prev, fromGridId, fromColId, tileId, preview)),
      onTileDropAsNewBlock: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) =>
        update(prev => applyTileDropAsNewBlock(prev, fromGridId, fromColId, tileId, insertBeforeInfoId)),
      onAddDescription: (html: string, insertBeforeInfoId: string | null) =>
        update(prev => applyAddDescription(prev, html, insertBeforeInfoId)),
      onEditDescription: (infoId: string, html: string) =>
        update(prev => applyEditDescription(prev, infoId, html)),
      onDeleteBlock: (infoId: string) =>
        update(prev => applyDeleteBlock(prev, infoId)),
      onMoveBlock: (infoId: string, insertBeforeInfoId: string | null) =>
        update(prev => applyMoveBlock(prev, infoId, insertBeforeInfoId)),
    };
  });

  return (
    <>
      <NavBar
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
      />
      <div className="app-body">
        <MainCanvas
          themeColors={selectedTheme?.ThemeColors}
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          infoContent={infoContent}
          selectedTileId={selectedTileId}
          onSelectTile={setSelectedTileId}
          onAddColumn={handleAddColumn}
          onDeleteTile={handleDeleteTile}
          onEditTile={handleEditTile}
          onAddTilesToColumn={handleAddTilesToColumn}
          onAddStandaloneTile={handleAddStandaloneTile}
          onAddBlock={handleAddBlock}
          onFreeResizeRelease={handleFreeResizeRelease}
          onTileDrop={handleTileDrop}
          onTileDropAsNewBlock={handleTileDropAsNewBlock}
          onCrossFrameTileDrop={handleCrossFrameTileDrop}
          onCrossFrameTileDropToEmpty={handleCrossFrameTileDropToEmpty}
          onCrossFrameTileDropAsNewBlock={handleCrossFrameTileDropAsNewBlock}
          linkedFrames={linkedFrames}
          onTileNavigate={handleTileNavigate}
          onCollapseDescendants={handleCollapseDescendants}
          activeNavTileIds={activeNavTileIds}
          onAddDescription={handleAddDescription}
          onEditDescription={handleEditDescription}
          onDeleteBlock={handleDeleteBlock}
          onMoveBlock={handleMoveBlock}
          onCrossFrameBlockDrop={handleCrossFrameBlockDrop}
        />
        <SidebarRight
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          themeColors={selectedTheme?.ThemeColors}
          moods={themeMoods}
          selectedTile={selectedTile}
          onEditTile={handleEditTile}
        />
      </div>
    </>
  );
}

export default App;
