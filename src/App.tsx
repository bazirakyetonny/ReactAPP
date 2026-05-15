import { useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme } from './types';

function App() {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);

  return (
    <>
      <NavBar
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
      />
      <div className="app-body">
        <MainCanvas />
        <SidebarRight
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          themeColors={selectedTheme?.ThemeColors}
        />
      </div>
    </>
  );
}

export default App;
