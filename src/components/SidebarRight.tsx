import { useState, useMemo } from 'react';
import './SidebarRight.css';
import type { ThemeIcon } from '../types';

const PALETTE = ['#1e293b', '#374151', '#78716c', '#b45309', '#111827'];

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function AlignJustifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2H6L7.5 5.5L5.5 7C6.5 9 7 9.5 9 10.5L10.5 8.5L14 10V13C14 13.6 13.6 14 13 14C6.4 14 2 9.6 2 3C2 2.4 2.4 2 3 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 5.5L8 9.5L14.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2C5.8 2 4 3.8 4 6C4 9 8 13 8 13C8 13 12 9 12 6C12 3.8 10.2 2 8 2Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M7 9.5C7.7 10.2 8.7 10.6 9.8 10.6C10.9 10.6 11.9 10.2 12.6 9.5L13.5 8.6C14.8 7.3 14.8 5.2 13.5 3.9C12.2 2.6 10.1 2.6 8.8 3.9L8 4.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 6.5C8.3 5.8 7.3 5.4 6.2 5.4C5.1 5.4 4.1 5.8 3.4 6.5L2.5 7.4C1.2 8.7 1.2 10.8 2.5 12.1C3.8 13.4 5.9 13.4 7.2 12.1L8 11.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2H9.5L13 5.5V14C13 14.6 12.6 15 12 15H4C3.4 15 3 14.6 3 14V3C3 2.4 3.4 2 4 2Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 2V5.5H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2L9.8 6H14L10.5 8.8L11.8 13L8 10.5L4.2 13L5.5 8.8L2 6H6.2L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
      <path d="M1.5 10L4 7L6.5 9.5L9 7.5L12.5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListBulletsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="2.5" cy="4" r="1" fill="currentColor" />
      <line x1="5" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="2.5" cy="7" r="1" fill="currentColor" />
      <line x1="5" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="2.5" cy="10" r="1" fill="currentColor" />
      <line x1="5" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ListNumberedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <text x="1" y="5.5" fontSize="4.5" fill="currentColor" fontFamily="system-ui, sans-serif">1</text>
      <line x1="5" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <text x="1" y="8.5" fontSize="4.5" fill="currentColor" fontFamily="system-ui, sans-serif">2</text>
      <line x1="5" y1="7.5" x2="12" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <text x="1" y="11.5" fontSize="4.5" fill="currentColor" fontFamily="system-ui, sans-serif">3</text>
      <line x1="5" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CONTACTS = [
  { label: 'Phone',    icon: <PhoneIcon /> },
  { label: 'Email',    icon: <MailIcon /> },
  { label: 'Location', icon: <MapPinIcon /> },
  { label: 'Link',     icon: <LinkIcon /> },
  { label: 'File',     icon: <FileIcon /> },
  { label: 'Star',     icon: <StarIcon /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SidebarRight({ themeIcons = [] }: { themeIcons?: ThemeIcon[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

      {/* 2. Color palette + zoom */}
      <div className="sr-palette-row">
        <div className="sr-palette">
          {PALETTE.map(c => (
            <button key={c} className="sr-palette-chip" style={{ background: c }} type="button" aria-label={c} />
          ))}
        </div>
        <button className="sr-icon-btn" type="button" title="Add color">
          <PlusSmIcon />
        </button>
        <span className="sr-zoom-label">100 %</span>
      </div>

      {/* 3. Format toolbar */}
      <div className="sr-toolbar">
        <button className="sr-tool-btn" type="button" title="Outline style"><SquareOutlineIcon /></button>
        <button className="sr-tool-btn sr-tool-btn-active" type="button" title="Filled style"><SquareFilledIcon /></button>
        <button className="sr-tool-btn" type="button" title="Justify"><AlignJustifyIcon /></button>
        <span className="sr-badge">1</span>
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
      <div className="sr-icon-grid">
        {visibleIcons.map(icon => (
          <button key={icon.IconId} className="sr-icon-cell" type="button" title={icon.IconName}>
            <span
              className="sr-icon-wrap"
              dangerouslySetInnerHTML={{ __html: icon.IconSVG }}
            />
          </button>
        ))}
      </div>

      {/* 6. Checkbox row */}
      <div className="sr-toolbar sr-toolbar-gap">
        <button className="sr-tool-btn" type="button" title="Unchecked style"><SquareOutlineIcon /></button>
        <button className="sr-tool-btn sr-tool-btn-active" type="button" title="Checked style"><SquareFilledIcon /></button>
      </div>

      {/* 7. Button section */}
      <div className="sr-button-row">
        <span className="sr-button-label">Button</span>
        <button className="sr-add-circle" type="button" title="Add button">
          <PlusSmIcon />
        </button>
        <button className="sr-icon-btn" type="button" title="Add image">
          <ImageIcon />
        </button>
      </div>

      {/* 8. Contact icons */}
      <div className="sr-contact-row">
        {CONTACTS.map(c => (
          <button key={c.label} className="sr-contact-btn" type="button" title={c.label}>
            {c.icon}
          </button>
        ))}
      </div>

      {/* 9. Style row */}
      <div className="sr-style-row">
        <button className="sr-dot sr-dot-green" type="button" aria-label="Green" />
        <button className="sr-dot sr-dot-amber" type="button" aria-label="Amber" />
        <button className="sr-dot sr-dot-red"   type="button" aria-label="Red" />
        <span className="sr-style-spacer" />
        <button className="sr-tool-btn" type="button" title="Bullet list"><ListBulletsIcon /></button>
        <button className="sr-tool-btn sr-tool-btn-active" type="button" title="Numbered list"><ListNumberedIcon /></button>
      </div>

    </aside>
  );
}
