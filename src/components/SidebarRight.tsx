import { useState, useMemo } from 'react';
import './SidebarRight.css';
import type { ThemeIcon, ThemeColors, Mood } from '../types';

const COLOR_ORDER: (keyof ThemeColors)[] = [
  'primaryColor', 'secondaryColor', 'accentColor',
  'backgroundColor', 'textColor', 'buttonBGColor',
  'buttonTextColor', 'cardBgColor', 'cardTextColor', 'borderColor',
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function MoodToggleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6.5" y1="1" x2="6.5" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6.5" y1="9" x2="6.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="6.5" x2="4" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusSmIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="6" y1="2" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7.8" y1="7.8" x2="10.5" y2="10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownSmIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function SquareOutlineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SquareFilledIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="4" y="4" width="6" height="6" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1"   y1="3"  x2="13"  y2="3"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="3"   y1="6"  x2="11"  y2="6"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1"   y1="9"  x2="13"  y2="9"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="3"   y1="12" x2="11"  y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3"  x2="13" y2="3"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="6"  x2="9"  y2="6"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="9"  x2="13" y2="9"  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="12" x2="7"  y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}


// ── Component ─────────────────────────────────────────────────────────────────

export function SidebarRight({ themeIcons = [], themeColors, moods = [], selectedTile, onEditTile }: {
  themeIcons?: ThemeIcon[];
  themeColors?: ThemeColors;
  moods?: Mood[];
  selectedTile?: any;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
}) {
  const palette = themeColors ? COLOR_ORDER.map(k => themeColors[k]).filter(Boolean) : [];
  const [showMoods, setShowMoods] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Resolve the selected tile's current BGColor to a hex so we can highlight the active chip
  const activeBgHex: string | undefined = selectedTile?.BGColor
    ? selectedTile.BGColor.startsWith('#')
      ? selectedTile.BGColor
      : themeColors?.[selectedTile.BGColor as keyof ThemeColors]
    : undefined;

  const categories = useMemo(
    () => Array.from(new Set(themeIcons.map(i => i.IconCategory))).sort(),
    [themeIcons]
  );

  const activeCategory = categories.includes(category) ? category : (categories[0] ?? '');

  const visibleIcons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (isSearching && term) {
      return themeIcons.filter(i => i.IconName.toLowerCase().includes(term));
    }
    return themeIcons.filter(i => !activeCategory || i.IconCategory === activeCategory);
  }, [themeIcons, activeCategory, search, isSearching]);

  function openSearch() { setIsSearching(true); }
  function closeSearch() { setIsSearching(false); setSearch(''); }

  return (
    <aside className="app-sidebar-right">

      {/* 1. PAGE / TEMPLATE tabs */}
      <div className="sr-tabs">
        <button className="sr-tab sr-tab-active" type="button">PAGE</button>
        <button className="sr-tab" type="button">TEMPLATE</button>
      </div>

      {/* 2a. Color chips / mood chips + toggle */}
      <div className="sr-palette-row">
        <div className="sr-palette">
          {showMoods ? (
            moods.length === 0 ? (
              <span className="sr-zoom-label">No moods</span>
            ) : (
              moods.map(mood => (
                <div key={mood.MoodId} className="sr-mood-chip" title={mood.MoodName}>
                  {mood.MoodColors.slice(0, 4).map(mc => (
                    <button
                      key={mc.MoodColorId}
                      className={`sr-mood-dot${activeBgHex === mc.ColorCode ? ' sr-mood-dot--active' : ''}`}
                      style={{ background: mc.ColorCode }}
                      type="button"
                      aria-label={`Apply colour ${mc.ColorCode}`}
                      onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { BGColor: mc.ColorCode })}
                    />
                  ))}
                </div>
              ))
            )
          ) : (
            palette.map(c => (
              <button
                key={c}
                className={`sr-palette-chip${activeBgHex === c ? ' sr-palette-chip--active' : ''}`}
                style={{ background: c }}
                type="button"
                aria-label={c}
                onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { BGColor: c })}
              />
            ))
          )}
        </div>
        <button
          className={`sr-icon-btn${showMoods ? ' sr-icon-btn-active' : ''}`}
          type="button"
          title={showMoods ? 'Show theme colors' : 'Show moods'}
          onClick={() => setShowMoods(v => !v)}
        >
          <MoodToggleIcon />
        </button>
      </div>

      {/* 2b. Palette tools */}
      <div className="sr-palette-row">
        <button className="sr-icon-btn" type="button" title="Add color">
          <PlusSmIcon />
        </button>
        <span className="sr-zoom-label">100 %</span>
      </div>

      {/* 2c. Text input — bound to selected tile */}
      <div className="sr-section">
        <input
          className="sr-input"
          type="text"
          placeholder={selectedTile ? 'Enter title' : 'Select a tile to edit'}
          value={selectedTile?.Text ?? ''}
          disabled={!selectedTile}
          onChange={e => selectedTile && onEditTile?.(selectedTile.Id, { Text: e.target.value })}
        />
      </div>

      {/* 3. Format toolbar */}
      <div className="sr-toolbar">
        {/* Light (#ffffff) */}
        <button
          className={`sr-tool-btn${selectedTile?.Color === '#ffffff' ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Light text & icon (#ffffff)"
          disabled={!selectedTile}
          onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { Color: '#ffffff' })}
        >
          <SquareOutlineIcon />
        </button>
        {/* Dark (#333333) */}
        <button
          className={`sr-tool-btn${selectedTile?.Color === '#333333' ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Dark text & icon (#333333)"
          disabled={!selectedTile}
          onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { Color: '#333333' })}
        >
          <SquareFilledIcon />
        </button>
        <button
          className={`sr-tool-btn${(!selectedTile?.Align || selectedTile?.Align === 'center') ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Center align"
          disabled={!selectedTile}
          onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { Align: 'center' })}
        >
          <AlignCenterIcon />
        </button>
        <button
          className={`sr-tool-btn${selectedTile?.Align === 'left' ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Left align"
          disabled={!selectedTile}
          onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { Align: 'left' })}
        >
          <AlignLeftIcon />
        </button>
      </div>

      {/* 4. Category / search unified field */}
      <div className="sr-category-row">
        <div className="sr-category-wrap">
          {isSearching ? (
            <input
              className="sr-category-field"
              type="text"
              placeholder="Search icons…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          ) : (
            <select
              className="sr-category-field"
              value={activeCategory}
              onChange={e => setCategory(e.target.value)}
              aria-label="Icon category"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          <div className="sr-category-actions">
            {!isSearching && (
              <span className="sr-category-arrow"><ChevronDownSmIcon /></span>
            )}
            {isSearching ? (
              <button className="sr-category-btn" type="button" title="Close search" onClick={closeSearch}>
                <XIcon />
              </button>
            ) : (
              <button className="sr-category-btn" type="button" title="Search icons" onClick={openSearch}>
                <SearchIcon />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`sr-icon-grid${visibleIcons.length === 1 ? ' sr-icon-grid--single' : ''}`}>
        {visibleIcons.map(icon => (
          <button
            key={icon.IconId}
            className={`sr-icon-cell${selectedTile?.IconId === icon.IconId ? ' sr-icon-cell--active' : ''}`}
            type="button"
            title={icon.IconName}
            onClick={() => selectedTile && onEditTile?.(selectedTile.Id, { IconSVG: icon.IconSVG, IconId: icon.IconId, IconCodeName: icon.IconCodeName })}
          >
            <span
              className="sr-icon-wrap"
              dangerouslySetInnerHTML={{ __html: icon.IconSVG }}
            />
          </button>
        ))}
      </div>

    </aside>
  );
}
