import { useEffect, useMemo, useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import type { TileDropPreview } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme, Mood } from './types';

const TILE_H = 80;
const TILE_GAP = 6;

// ── Pure content-transform helpers (used by both home and nav-frame handlers) ─

function applyAddColumn(prev: any[], gridId: string, afterColId: string): any[] {
  const block = prev.find((b: any) => b.InfoId === gridId && b.InfoType === 'TileGrid');
  if (!block) return prev;
  const cols: any[] = block.Columns ?? [];
  if (cols.length >= 3) return prev;
  const afterIndex = cols.findIndex((c: any) => c.ColId === afterColId);
  const ts = Date.now();
  const newCol = {
    ColId: `col-${ts}`,
    Tiles: [{ Id: `tile-${ts}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true }],
  };
  const resetCols = cols.map((col: any) => ({
    ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
  }));
  const newCols = [...resetCols.slice(0, afterIndex + 1), newCol, ...resetCols.slice(afterIndex + 1)];
  return prev.map((b: any) => b.InfoId === gridId ? { ...b, Columns: newCols } : b);
}

function applyDeleteTile(prev: any[], gridId: string, colId: string, tileId: string): any[] {
  return prev.flatMap((block: any) => {
    if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return [block];
    const totalTiles = (block.Columns ?? []).reduce((s: number, c: any) => s + (c.Tiles ?? []).length, 0);
    if (totalTiles <= 1) return [];
    const origColCount = (block.Columns ?? []).length;
    const newCols = (block.Columns ?? [])
      .map((col: any) => col.ColId !== colId ? col : { ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId) })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (newCols.length === 2) {
      const changedCol = newCols.find((c: any) => c.ColId === colId);
      const otherCol  = newCols.find((c: any) => c.ColId !== colId);
      if (changedCol && otherCol && (otherCol.Tiles ?? []).length === 1) {
        const n = (changedCol.Tiles ?? []).length;
        const longH = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{ ...block, Columns: newCols.map((col: any) =>
          col.ColId !== colId
            ? { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: longH })) }
            : { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: TILE_H })) }
        ) }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
}

function applyAddStandaloneTile(prev: any[]): any[] {
  const ts = Date.now();
  return [...prev, {
    InfoId: `grid-${ts}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-${ts}`, Tiles: [{ Id: `tile-${ts}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true }] }],
  }];
}

function applyEditTile(prev: any[], tileId: string, patch: Record<string, any>): any[] {
  return prev.map((block: any) => {
    if (block.InfoType !== 'TileGrid') return block;
    return { ...block, Columns: (block.Columns ?? []).map((col: any) => ({
      ...col, Tiles: (col.Tiles ?? []).map((t: any) => t.Id === tileId ? { ...t, ...patch, _new: false } : t),
    })) };
  });
}

function applyAddTilesToColumn(prev: any[], gridId: string, colId: string, count: number): any[] {
  const ts = Date.now();
  return prev.map((block: any) => {
    if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return block;
    return {
      ...block,
      Columns: (block.Columns ?? []).map((col: any) => {
        if (col.ColId !== colId) return col;
        const newTiles = Array.from({ length: count }, (_, i) => ({
          Id: `tile-${ts}-${i}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true,
        }));
        return { ...col, Tiles: [...(col.Tiles ?? []), ...newTiles] };
      }),
    };
  });
}

function applyFreeResizeRelease(
  prev: any[], gridId: string, longTileId: string, snapH: number,
  zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]
): any[] {
  const ts = Date.now();
  const idx = prev.findIndex((b: any) => b.InfoId === gridId);
  if (idx === -1) return prev;
  const block = prev[idx];
  const updateLongTile = (col: any) => ({
    ...col,
    Tiles: (col.Tiles ?? []).map((t: any) => t.Id === longTileId ? { ...t, Height: snapH } : t),
  });
  if (zoneCount > initialCount) {
    const extraCount = zoneCount - initialCount;
    const extraTiles = Array.from({ length: extraCount }, (_, i) => ({
      Id: `tile-extra-${ts}-${i}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true,
    }));
    const newCols = (block.Columns ?? []).map((col: any) =>
      col.ColId === oppColId
        ? { ...col, Tiles: [...(col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })), ...extraTiles] }
        : updateLongTile(col)
    );
    return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
  }
  if (zoneCount === initialCount) {
    const newCols = (block.Columns ?? []).map((col: any) => updateLongTile(col));
    return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
  }
  const tilesToKeep = allOppTiles.slice(0, zoneCount).map((t: any) => ({ ...t, Height: TILE_H }));
  const tilesToRelease = allOppTiles.slice(zoneCount);
  const newCols = (block.Columns ?? [])
    .map((col: any) =>
      col.ColId === oppColId
        ? (tilesToKeep.length > 0 ? { ...col, Tiles: tilesToKeep } : null)
        : updateLongTile(col)
    )
    .filter(Boolean);
  const standaloneGrids = tilesToRelease.map((tile: any, i: number) => ({
    InfoId: `grid-rel-${ts}-${i}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-rel-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
  }));
  return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...standaloneGrids, ...prev.slice(idx + 1)];
}

function applyTileDrop(
  prev: any[], fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview
): any[] {
  if (preview.isColumnSwap) {
    return prev.map((block: any) => {
      if (block.InfoId !== fromGridId) return block;
      const cols = [...(block.Columns ?? [])];
      const i1 = cols.findIndex((c: any) => c.ColId === fromColId);
      const i2 = cols.findIndex((c: any) => c.ColId === preview.targetColId);
      if (i1 === -1 || i2 === -1) return block;
      [cols[i1], cols[i2]] = [cols[i2], cols[i1]];
      return { ...block, Columns: cols };
    });
  }
  if (fromGridId === preview.targetGridId && fromColId === preview.targetColId && !preview.newColumn) {
    return prev.map((block: any) => {
      if (block.InfoId !== fromGridId) return block;
      return {
        ...block,
        Columns: (block.Columns ?? []).map((col: any) => {
          if (col.ColId !== fromColId) return col;
          const tiles = [...(col.Tiles ?? [])];
          const fromIdx = tiles.findIndex((t: any) => t.Id === tileId);
          if (fromIdx === -1) return col;
          const [moved] = tiles.splice(fromIdx, 1);
          const targetIdx = preview.insertIndex > fromIdx ? preview.insertIndex - 1 : preview.insertIndex;
          tiles.splice(targetIdx, 0, moved);
          return { ...col, Tiles: tiles };
        }),
      };
    });
  }
  let movedTile: any = null;
  const afterRemove = prev.flatMap((block: any) => {
    if (block.InfoId !== fromGridId) return [block];
    const cols: any[] = block.Columns ?? [];
    const origColCount = cols.length;
    const srcCol = cols.find((c: any) => c.ColId === fromColId);
    if (!srcCol) return [block];
    movedTile = (srcCol.Tiles ?? []).find((t: any) => t.Id === tileId);
    const newCols = cols
      .map((col: any) => col.ColId !== fromColId ? col : {
        ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
      })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (newCols.length === 0) return [];
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (origColCount === 2 && newCols.length === 2) {
      const srcColAfter = newCols.find((c: any) => c.ColId === fromColId);
      const oppColAfter = newCols.find((c: any) => c.ColId !== fromColId);
      if (srcColAfter && oppColAfter && (oppColAfter.Tiles ?? []).length === 1) {
        const n = (srcColAfter.Tiles ?? []).length;
        const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{
          ...block,
          Columns: newCols.map((col: any) =>
            col.ColId !== fromColId
              ? { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) }
              : col
          ),
        }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
  if (!movedTile) return prev;
  const droppedTile = { ...movedTile, Height: TILE_H };
  const ts2 = Date.now() + 1;
  const targetIdx = afterRemove.findIndex((b: any) => b.InfoId === preview.targetGridId);
  if (targetIdx === -1) return afterRemove;
  const targetBlock = afterRemove[targetIdx];
  if (preview.newColumn) {
    const newCol = { ColId: `col-${ts2}`, Tiles: [droppedTile] };
    const cols = (targetBlock.Columns ?? []).map((col: any) => ({
      ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
    }));
    const afterIdx = preview.insertColAfterColId
      ? cols.findIndex((c: any) => c.ColId === preview.insertColAfterColId)
      : -1;
    cols.splice(afterIdx + 1, 0, newCol);
    const newBlock = { ...targetBlock, Columns: cols };
    return [...afterRemove.slice(0, targetIdx), newBlock, ...afterRemove.slice(targetIdx + 1)];
  }
  const targetCols = targetBlock.Columns ?? [];
  const targetColNow = targetCols.find((c: any) => c.ColId === preview.targetColId);
  const newTileCount = (targetColNow?.Tiles ?? []).length + 1;
  const oppCol = targetCols.length === 2 ? targetCols.find((c: any) => c.ColId !== preview.targetColId) : null;
  const oppIsLong = (oppCol?.Tiles ?? []).length === 1;
  const longHeight = oppIsLong ? newTileCount * TILE_H + Math.max(0, newTileCount - 1) * TILE_GAP : null;
  const newBlock = {
    ...targetBlock,
    Columns: targetCols.map((col: any) => {
      if (col.ColId === preview.targetColId) {
        const tiles = [...(col.Tiles ?? [])];
        tiles.splice(preview.insertIndex, 0, droppedTile);
        return { ...col, Tiles: tiles };
      }
      if (longHeight !== null) {
        return { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) };
      }
      return col;
    }),
  };
  return [...afterRemove.slice(0, targetIdx), newBlock, ...afterRemove.slice(targetIdx + 1)];
}

function applyTileDropAsNewBlock(
  prev: any[], fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null
): any[] {
  const sourceBlock = prev.find((b: any) => b.InfoId === fromGridId);
  if (!sourceBlock) return prev;
  const totalTiles = (sourceBlock.Columns ?? []).reduce(
    (sum: number, col: any) => sum + (col.Tiles ?? []).length, 0
  );
  if (totalTiles === 1) {
    const withoutSource = prev.filter((b: any) => b.InfoId !== fromGridId);
    if (insertBeforeInfoId === null) return [...withoutSource, sourceBlock];
    const insertIdx = withoutSource.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
    if (insertIdx === -1) return [...withoutSource, sourceBlock];
    return [...withoutSource.slice(0, insertIdx), sourceBlock, ...withoutSource.slice(insertIdx)];
  }
  let movedTile: any = null;
  const afterRemove = prev.flatMap((block: any) => {
    if (block.InfoId !== fromGridId) return [block];
    const cols: any[] = block.Columns ?? [];
    const origColCount = cols.length;
    const srcCol = cols.find((c: any) => c.ColId === fromColId);
    if (!srcCol) return [block];
    movedTile = (srcCol.Tiles ?? []).find((t: any) => t.Id === tileId);
    const newCols = cols
      .map((col: any) => col.ColId !== fromColId ? col : {
        ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
      })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (newCols.length === 0) return [];
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (origColCount === 2 && newCols.length === 2) {
      const srcColAfter = newCols.find((c: any) => c.ColId === fromColId);
      const oppColAfter = newCols.find((c: any) => c.ColId !== fromColId);
      if (srcColAfter && oppColAfter && (oppColAfter.Tiles ?? []).length === 1) {
        const n = (srcColAfter.Tiles ?? []).length;
        const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{
          ...block,
          Columns: newCols.map((col: any) =>
            col.ColId !== fromColId
              ? { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) }
              : col
          ),
        }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
  if (!movedTile) return prev;
  const ts2 = Date.now() + 1;
  const newGrid = {
    InfoId: `grid-new-${ts2}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-new-${ts2}`, Tiles: [{ ...movedTile, Height: TILE_H }] }],
  };
  if (insertBeforeInfoId === null) return [...afterRemove, newGrid];
  const insertIdx = afterRemove.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  if (insertIdx === -1) return [...afterRemove, newGrid];
  return [...afterRemove.slice(0, insertIdx), newGrid, ...afterRemove.slice(insertIdx)];
}

function parseInfoContent(): any[] {
  const cv = dataStore.get('Current_Version');
  const homePage = (cv?.Page ?? []).find((p: any) => p.PageName?.toLowerCase() === 'home');
  if (!homePage?.PageStructure) return [];
  try {
    return JSON.parse(homePage.PageStructure).InfoContent ?? [];
  } catch {
    return [];
  }
}

function App() {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const allMoods: Mood[] = dataStore.get('Moods') ?? [];

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [infoContent, setInfoContent] = useState<any[]>(parseInfoContent);

  // Navigation stack — ordered page IDs after home; navContents caches each page's InfoContent
  const [navStack, setNavStack] = useState<string[]>([]);
  const [navContents, setNavContents] = useState<Record<string, any[]>>({});

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter(m => m.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get('Current_Version')?.Page ?? [];

  // Derive the selected tile object — search home content then all nav-frame contents
  const selectedTile = selectedTileId
    ? [
        ...infoContent.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? [])),
        ...Object.values(navContents).flatMap(blocks =>
          blocks.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []))
        ),
      ].find((t: any) => t.Id === selectedTileId) ?? null
    : null;

  // Tiles whose linked page is currently open — used to show the nav breadcrumb outline
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

  // Sync home infoContent back to dataStore
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

  // Sync all nav-page contents back to dataStore
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
    setInfoContent(prev => {
      const block = prev.find(b => b.InfoId === gridId && b.InfoType === 'TileGrid');
      if (!block) return prev;
      const cols: any[] = block.Columns ?? [];
      if (cols.length >= 3) return prev;

      const afterIndex = cols.findIndex((c: any) => c.ColId === afterColId);
      const ts = Date.now();
      const newCol = {
        ColId: `col-${ts}`,
        Tiles: [{
          Id: `tile-${ts}`,
          Text: 'Title',
          BGColor: '',
          Color: '#333333',
          Align: 'center',
          Height: 80,
          _new: true,
        }],
      };

      // Reset existing tile heights — joining a multi-column layout snaps all to TILE_H.
      const resetCols = cols.map((col: any) => ({
        ...col,
        Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
      }));

      const newCols = [
        ...resetCols.slice(0, afterIndex + 1),
        newCol,
        ...resetCols.slice(afterIndex + 1),
      ];

      return prev.map(b => b.InfoId === gridId ? { ...b, Columns: newCols } : b);
    });
  }

  function handleDeleteTile(gridId: string, colId: string, tileId: string) {
    if (selectedTileId === tileId) setSelectedTileId(null);
    setInfoContent(prev =>
      prev.flatMap(block => {
        if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return [block];

        const totalTiles = (block.Columns ?? []).reduce(
          (sum: number, col: any) => sum + (col.Tiles ?? []).length, 0
        );

        // Last tile — remove the whole grid
        if (totalTiles <= 1) return [];

        const origColCount = (block.Columns ?? []).length;

        const newCols = (block.Columns ?? [])
          .map((col: any) => col.ColId !== colId ? col : {
            ...col,
            Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
          })
          .filter((col: any) => (col.Tiles ?? []).length > 0);

        // Deleted the only tile from a column in a 2-col grid where the other
        // column has multiple tiles — each tile becomes its own independent TileGrid.
        if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
          const ts = Date.now();
          return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
            InfoId: `grid-${ts}-${i}`,
            InfoType: 'TileGrid',
            Columns: [{
              ColId: `col-${ts}-${i}`,
              Tiles: [{ ...tile, Height: TILE_H }],
            }],
          }));
        }

        // In a 2-column layout where the opposite column has 1 tall tile, adjust
        // that tall tile's height to match the total span of the remaining small tiles.
        if (newCols.length === 2) {
          const changedCol = newCols.find((c: any) => c.ColId === colId);
          const otherCol = newCols.find((c: any) => c.ColId !== colId);
          if (changedCol && otherCol && (otherCol.Tiles ?? []).length === 1) {
            const n = (changedCol.Tiles ?? []).length;
            const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
            return [{ ...block, Columns: newCols.map((col: any) =>
              col.ColId !== colId
                ? { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: longHeight })) }
                : { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: TILE_H })) }
            )}];
          }
        }

        return [{ ...block, Columns: newCols }];
      })
    );
  }

  function handleAddStandaloneTile() {
    const ts = Date.now();
    setInfoContent(prev => [...prev, {
      InfoId: `grid-${ts}`,
      InfoType: 'TileGrid',
      Columns: [{
        ColId: `col-${ts}`,
        Tiles: [{
          Id: `tile-${ts}`,
          Text: 'Title',
          BGColor: '',
          Color: '#333333',
          Align: 'center',
          Height: 80,
          _new: true,
        }],
      }],
    }]);
  }

  function handleAddTilesToColumn(gridId: string, colId: string, count: number) {
    setInfoContent(prev => applyAddTilesToColumn(prev, gridId, colId, count));
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

  // ── Unified edit — searches home + all nav frames; only the matching tile updates ──
  function handleEditTile(tileId: string, patch: Record<string, any>) {
    setInfoContent(prev => applyEditTile(prev, tileId, patch));
    setNavContents(prev => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev)) next[id] = applyEditTile(blocks, tileId, patch);
      return next;
    });
  }

  // ── Navigation stack handlers ─────────────────────────────────────────────
  function handleTileNavigate(pageId: string, parentIndex: number) {
    const insertAt = parentIndex + 1;
    setNavStack(prev => {
      if (prev[insertAt] === pageId) return prev.slice(0, insertAt + 1); // already showing — collapse descendants
      return [...prev.slice(0, insertAt), pageId]; // sibling-replace
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

  // Collapse all child frames of a parent when a non-nav tile is clicked
  function handleCollapseDescendants(parentIndex: number) {
    const cutAt = parentIndex + 1;
    setNavStack(prev => prev.length <= cutAt ? prev : prev.slice(0, cutAt));
  }

  // Close the frame at stackIndex and all frames after it (breadcrumb collapse)
  function handleCloseFromIndex(stackIndex: number) {
    setNavStack(prev => prev.slice(0, stackIndex));
  }

  // ── Per-nav-frame handler factory (curried by pageId) ────────────────────
  function navUpdater(pageId: string) {
    return (transform: (blocks: any[]) => any[]) =>
      setNavContents(prev => ({ ...prev, [pageId]: transform(prev[pageId] ?? []) }));
  }

  // Build the linkedFrames array consumed by MainCanvas
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
      onAddStandaloneTile: () => update(prev => applyAddStandaloneTile(prev)),
      onAddTilesToColumn: (gridId: string, colId: string, count: number) =>
        update(prev => applyAddTilesToColumn(prev, gridId, colId, count)),
      onFreeResizeRelease: (gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]) =>
        update(prev => applyFreeResizeRelease(prev, gridId, longTileId, snapH, zoneCount, initialCount, oppColId, allOppTiles)),
      onTileDrop: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) =>
        update(prev => applyTileDrop(prev, fromGridId, fromColId, tileId, preview)),
      onTileDropAsNewBlock: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) =>
        update(prev => applyTileDropAsNewBlock(prev, fromGridId, fromColId, tileId, insertBeforeInfoId)),
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
          onFreeResizeRelease={handleFreeResizeRelease}
          onTileDrop={handleTileDrop}
          onTileDropAsNewBlock={handleTileDropAsNewBlock}
          linkedFrames={linkedFrames}
          onTileNavigate={handleTileNavigate}
          onCollapseDescendants={handleCollapseDescendants}
          activeNavTileIds={activeNavTileIds}
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
