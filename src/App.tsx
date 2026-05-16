import { useEffect, useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme, Mood } from './types';

const TILE_H = 80;
const TILE_GAP = 6;

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

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter(m => m.ThemeId === selectedThemeId);

  // Derive the full selected tile object for the sidebar
  const selectedTile = selectedTileId
    ? infoContent
        .flatMap((block: any) => (block.Columns ?? []).flatMap((col: any) => col.Tiles ?? []))
        .find((t: any) => t.Id === selectedTileId) ?? null
    : null;

  // Sync infoContent changes back to dataStore
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

      const newCols = [
        ...cols.slice(0, afterIndex + 1),
        newCol,
        ...cols.slice(afterIndex + 1),
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
    const ts = Date.now();
    setInfoContent(prev => prev.map(block => {
      if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return block;
      return {
        ...block,
        Columns: (block.Columns ?? []).map((col: any) => {
          if (col.ColId !== colId) return col;
          const newTiles = Array.from({ length: count }, (_, i) => ({
            Id: `tile-${ts}-${i}`,
            Text: 'Title',
            BGColor: '',
            Color: '#333333',
            Align: 'center',
            Height: 80,
            _new: true,
          }));
          return { ...col, Tiles: [...(col.Tiles ?? []), ...newTiles] };
        }),
      };
    }));
  }

  function handleFreeResizeRelease(gridId: string, longTileId: string, snapH: number, zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]) {
    const ts = Date.now();
    setInfoContent(prev => {
      const idx = prev.findIndex(b => b.InfoId === gridId);
      if (idx === -1) return prev;
      const block = prev[idx];

      const updateLongTile = (col: any) => ({
        ...col,
        Tiles: (col.Tiles ?? []).map((t: any) => t.Id === longTileId ? { ...t, Height: snapH } : t),
      });

      if (zoneCount > initialCount) {
        // Stretch: add extra tiles to the opposite column
        const extraCount = zoneCount - initialCount;
        const extraTiles = Array.from({ length: extraCount }, (_, i) => ({
          Id: `tile-extra-${ts}-${i}`,
          Text: 'Title',
          BGColor: '',
          Color: '#333333',
          Align: 'center',
          Height: TILE_H,
          _new: true,
        }));
        const newCols = (block.Columns ?? []).map((col: any) =>
          col.ColId === oppColId
            ? { ...col, Tiles: [...(col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })), ...extraTiles] }
            : updateLongTile(col)
        );
        return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
      }

      if (zoneCount === initialCount) {
        // No structural change — just update the long tile height
        const newCols = (block.Columns ?? []).map((col: any) => updateLongTile(col));
        return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
      }

      // Shrink: release excess tiles as standalone TileGrids
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
        InfoId: `grid-rel-${ts}-${i}`,
        InfoType: 'TileGrid',
        Columns: [{ ColId: `col-rel-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
      return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...standaloneGrids, ...prev.slice(idx + 1)];
    });
  }

  function handleEditTile(tileId: string, patch: Record<string, any>) {
    setInfoContent(prev => prev.map(block => {
      if (block.InfoType !== 'TileGrid') return block;
      return {
        ...block,
        Columns: (block.Columns ?? []).map((col: any) => ({
          ...col,
          Tiles: (col.Tiles ?? []).map((tile: any) =>
            tile.Id === tileId ? { ...tile, ...patch, _new: false } : tile
          ),
        })),
      };
    }));
  }

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
          infoContent={infoContent}
          selectedTileId={selectedTileId}
          onSelectTile={setSelectedTileId}
          onAddColumn={handleAddColumn}
          onDeleteTile={handleDeleteTile}
          onEditTile={handleEditTile}
          onAddTilesToColumn={handleAddTilesToColumn}
          onAddStandaloneTile={handleAddStandaloneTile}
          onFreeResizeRelease={handleFreeResizeRelease}
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
