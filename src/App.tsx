import { useState } from 'react';
import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';
import { dataStore } from './data/datastore';
import type { Theme, Mood } from './types';

function App() {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const allMoods: Mood[] = dataStore.get('Moods') ?? [];

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter(m => m.ThemeId === selectedThemeId);

  return (
    <>
      <NavBar
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
      />
      <div className="app-body">
        <MainCanvas themeColors={selectedTheme?.ThemeColors} />
        <SidebarRight
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          themeColors={selectedTheme?.ThemeColors}
          moods={themeMoods}
        />
      </div>
    </>
  );
}

export default App;
