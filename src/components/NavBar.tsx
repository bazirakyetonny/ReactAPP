import { useState } from 'react';
import './NavBar.css';
import type { AppVersion, Theme } from '../types';
import { dataStore } from '../data/datastore';

interface NavBarProps {
  version?: Pick<AppVersion, 'AppVersionName'>;
  onPublish?: () => void;
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BugIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <ellipse cx="8" cy="9" rx="4" ry="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 4.5C5 3.5 4 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 4.5C11 3.5 12 3 13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 8H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 8H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 11H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 11H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="10.7" y1="3.75" x2="5.3" y2="7.25" stroke="currentColor" strokeWidth="1.3" />
      <line x1="10.7" y1="12.25" x2="5.3" y2="8.75" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 6H10C12.2 6 14 7.8 14 10C14 12.2 12.2 14 10 14H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 3.5L3 6L5.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 6H6C3.8 6 2 7.8 2 10C2 12.2 3.8 14 6 14H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 3.5L13 6L10.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6V8.5L9.5 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5L2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M2 4.5H4.5V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 5H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6 5V3H10V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7" y1="8" x2="7" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="8" x2="9" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="2.5" y1="6" x2="13.5" y2="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="2.5" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 12.5C6 10 10 9 12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 5.5L2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 5.5L13.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 10.5L2.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 10V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 6L7 3L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NavBar({ version, onPublish }: NavBarProps) {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );

  return (
    <nav className="navbar" aria-label="App builder toolbar">
      {/* Left: version selector + version-level actions */}
      <div className="navbar-left">
        <button className="navbar-dropdown" type="button">
          {version?.AppVersionName ?? 'My version'}
          <ChevronDown />
        </button>
        <button className="navbar-icon-btn" type="button" title="Debug">
          <BugIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Share">
          <ShareIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Select frame">
          <FrameIcon />
        </button>
      </div>

      <div className="navbar-spacer" />

      {/* Center: history + content actions */}
      <div className="navbar-center">
        <button className="navbar-icon-btn" type="button" title="Undo">
          <UndoIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Redo">
          <RedoIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="History">
          <HistoryIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Delete">
          <TrashIcon />
        </button>
        <div className="navbar-separator" role="separator" />
        <button className="navbar-icon-btn" type="button" title="Preview">
          <GlobeIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Path">
          <PathIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Expand">
          <ExpandIcon />
        </button>
      </div>

      <div className="navbar-spacer-sm" />

      {/* Right: theme selector + publish */}
      <div className="navbar-right">
        <select
          className="navbar-theme-select"
          value={selectedThemeId}
          onChange={(e) => setSelectedThemeId(e.target.value)}
          aria-label="Select theme"
        >
          {themes.map((t) => (
            <option key={t.ThemeId} value={t.ThemeId}>
              {t.ThemeName}
            </option>
          ))}
        </select>
        <button className="navbar-publish" type="button" onClick={onPublish}>
          <UploadIcon />
          Publish
        </button>
      </div>
    </nav>
  );
}
