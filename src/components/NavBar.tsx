import './NavBar.css';
import type { AppVersion, Theme } from '../types';

interface NavBarProps {
  version?: Pick<AppVersion, 'AppVersionName'>;
  themes?: Theme[];
  selectedThemeId?: string;
  onThemeChange?: (id: string) => void;
  onPublish?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExpand?: () => void;
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
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <ellipse cx="8" cy="9" rx="4" ry="5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M8 4V2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M5.5 4.5C5 3.5 4 3 3 3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M10.5 4.5C11 3.5 12 3 13 3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M4 8H2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M12 8H14" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M4 11H2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M12 11H14" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="12" cy="3" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="12" cy="13" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="10.7" y1="3.75" x2="5.3" y2="7.25" stroke="currentColor" strokeWidth="0.9" />
      <line x1="10.7" y1="12.25" x2="5.3" y2="8.75" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 2" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 6H10C12.2 6 14 7.8 14 10C14 12.2 12.2 14 10 14H6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M5.5 3.5L3 6L5.5 8.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 6H6C3.8 6 2 7.8 2 10C2 12.2 3.8 14 6 14H10" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M10.5 3.5L13 6L10.5 8.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8.5" r="5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M8 6V8.5L9.5 10" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 3.5L2 2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M2 4.5H4.5V2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 5H13" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M6 5V3H10V5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="0.9" />
      <line x1="7" y1="8" x2="7" y2="11" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      <line x1="9" y1="8" x2="9" y2="11" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="0.9" />
      <ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="0.9" />
      <line x1="2.5" y1="6" x2="13.5" y2="6" stroke="currentColor" strokeWidth="0.9" />
      <line x1="2.5" y1="10" x2="13.5" y2="10" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="13" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <path d="M4 12.5C6 10 10 9 12 4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="25" viewBox="0 0 20 25">
      <g id="window-maximize" transform="translate(-3.25 -3.25)">
        <path id="Path_989" data-name="Path 989" d="M20.107,23.25H13.25a.857.857,0,1,1,0-1.714h6.857a1.429,1.429,0,0,0,1.429-1.429V6.393a1.429,1.429,0,0,0-1.429-1.429H6.393A1.429,1.429,0,0,0,4.964,6.393V13.25a.857.857,0,0,1-1.714,0V6.393A3.143,3.143,0,0,1,6.393,3.25H20.107A3.143,3.143,0,0,1,23.25,6.393V20.107a3.143,3.143,0,0,1-3.143,3.143Z" fill="#7c8791"></path>
        <path id="Path_990" data-name="Path 990" d="M16.159,12.934a.785.785,0,0,1-.775-.775V8.8H12.025a.775.775,0,1,1,0-1.55h4.133a.785.785,0,0,1,.775.775v4.133A.785.785,0,0,1,16.159,12.934Z" transform="translate(1.544 0.772)" fill="#7c8791"></path>
        <path id="Path_991" data-name="Path 991" d="M11.523,13.449a.765.765,0,0,1-.517-.258.775.775,0,0,1,0-1.033l4.65-4.65a.775.775,0,0,1,1.1,1.1L12.04,13.19A.765.765,0,0,1,11.523,13.449Z" transform="translate(1.506 0.807)" fill="#7c8791"></path>
        <path id="Path_992" data-name="Path 992" d="M8.159,20.967h-3.1A1.819,1.819,0,0,1,3.25,19.159v-3.1A1.819,1.819,0,0,1,5.058,14.25h3.1a1.819,1.819,0,0,1,1.808,1.808v3.1A1.819,1.819,0,0,1,8.159,20.967ZM5.058,15.8a.258.258,0,0,0-.258.258v3.1a.258.258,0,0,0,.258.258h3.1a.258.258,0,0,0,.258-.258v-3.1a.258.258,0,0,0-.258-.258Z" transform="translate(0 2.283)" fill="#7c8791"></path>
      </g>
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

export function NavBar({ version, themes = [], selectedThemeId = '', onThemeChange, onPublish, canUndo = false, canRedo = false, onUndo, onRedo, onExpand }: NavBarProps) {
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

      {/* Right: history + content actions + theme + publish */}
      <div className="navbar-right">
        <button className="navbar-icon-btn" type="button" title="Undo" disabled={!canUndo} onClick={onUndo}>
          <UndoIcon />
        </button>
        <button className="navbar-icon-btn" type="button" title="Redo" disabled={!canRedo} onClick={onRedo}>
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
        <button className="navbar-icon-btn" type="button" title="Expand" onClick={onExpand}>
          <ExpandIcon />
        </button>
        <select
          className="navbar-theme-select"
          value={selectedThemeId}
          onChange={(e) => onThemeChange?.(e.target.value)}
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
