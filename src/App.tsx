import { useEffect, useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme, Mood } from './types';

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
          Color: '#9ca3af',
          Align: 'center',
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
