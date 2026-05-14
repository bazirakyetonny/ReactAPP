import './SidebarRight.css';

const PALETTE = ['#000000', '#374151', '#92400e', '#d97706', '#f97316', '#dc2626', '#e5e7eb', '#ffffff'];

// ── Alignment icons ───────────────────────────────────────────────────────────

function AlignLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function AlignCenter() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="3" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="2" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function AlignRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="3" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function AlignJustify() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="1" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7" y1="4" x2="7" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="4" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Feature icons ─────────────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="6" y="2" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 9.5C3 12.5 5.7 15 9 15C12.3 15 15 12.5 15 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 9L9 3L16 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="9" width="10" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="7" y="12" width="4" height="4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1.5 7C3.8 4.7 6.3 3.5 9 3.5C11.7 3.5 14.2 4.7 16.5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 10C5.5 8.5 7.2 7.5 9 7.5C10.8 7.5 12.5 8.5 14 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 13C7.7 12.3 8.3 12 9 12C9.7 12 10.3 12.3 11 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="9" cy="15.5" r="1" fill="currentColor" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M14 4C13 3 11.5 2.5 10 3C8 3.5 7 5.5 7.5 7.5L3 12C2.6 12.4 2.6 13 3 13.4L4.6 15C5 15.4 5.6 15.4 6 15L10.5 10.5C12.5 11 14.5 10 15 8C15.5 6.5 15 4.5 14 4Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="5" y="2" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="9" cy="14" r="0.8" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2L11 7H16L12 10.5L13.5 15.5L9 12.5L4.5 15.5L6 10.5L2 7H7L9 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5 2H11L15 6V16C15 16.6 14.6 17 14 17H4C3.4 17 3 16.6 3 16V3C3 2.4 3.4 2 4 2H5Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M11 2V6H15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 2V4M9 14V16M2 9H4M14 9H16M4.22 4.22L5.64 5.64M12.36 12.36L13.78 13.78M13.78 4.22L12.36 5.64M5.64 12.36L4.22 13.78" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ── Service icons ─────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="2" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2" x2="6" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2C6.8 2 5 3.8 5 6C5 9 9 14 9 14C9 14 13 9 13 6C13 3.8 11.2 2 9 2Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="9" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 9L8 11.5L12.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.3" />
      <line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="5.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

// ── View toggle icons ─────────────────────────────────────────────────────────

function Grid4Icon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Grid2Icon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="4" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="7" y="1" width="4" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { label: 'Mic', icon: <MicIcon /> },
  { label: 'Housing', icon: <HouseIcon /> },
  { label: 'Network', icon: <WifiIcon /> },
  { label: 'Tools', icon: <WrenchIcon /> },
  { label: 'Mobile', icon: <PhoneIcon /> },
  { label: 'Rating', icon: <StarIcon /> },
  { label: 'Files', icon: <FileIcon /> },
  { label: 'Settings', icon: <GearIcon /> },
];

const SERVICES = [
  { label: 'Calendar', icon: <CalendarIcon /> },
  { label: 'Location', icon: <MapPinIcon /> },
  { label: 'Status', icon: <CheckCircleIcon /> },
  { label: 'Info', icon: <InfoIcon /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SidebarRight() {
  return (
    <aside className="app-sidebar-right">
      <div className="sidebar-palette">
        {PALETTE.map(color => (
          <button key={color} className="palette-chip" style={{ background: color }} type="button" aria-label={color} />
        ))}
      </div>

      <div className="sidebar-section">
        <input className="sidebar-input" type="text" placeholder="Enter title" />
      </div>

      <div className="sidebar-toolbar">
        <button className="sidebar-tool-btn" type="button" title="Align left"><AlignLeft /></button>
        <button className="sidebar-tool-btn" type="button" title="Align center"><AlignCenter /></button>
        <button className="sidebar-tool-btn" type="button" title="Align right"><AlignRight /></button>
        <button className="sidebar-tool-btn sidebar-tool-btn-active" type="button" title="Justify"><AlignJustify /></button>
        <button className="sidebar-tool-btn" type="button" title="Add"><PlusCircle /></button>
      </div>

      <div className="sidebar-icon-grid">
        {FEATURES.map(f => (
          <button key={f.label} className="sidebar-icon-cell" type="button">
            <div className="sidebar-icon-wrap">{f.icon}</div>
            <span className="sidebar-icon-label">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-view-row">
        <button className="sidebar-view-btn sidebar-view-btn-active" type="button" title="Grid view"><Grid4Icon /></button>
        <button className="sidebar-view-btn" type="button" title="Two columns"><Grid2Icon /></button>
        <button className="sidebar-view-btn" type="button" title="List view"><ListIcon /></button>
      </div>

      <div className="sidebar-section-label">Services</div>

      <div className="sidebar-icon-grid">
        {SERVICES.map(s => (
          <button key={s.label} className="sidebar-icon-cell" type="button">
            <div className="sidebar-icon-wrap">{s.icon}</div>
            <span className="sidebar-icon-label">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-view-row">
        <button className="sidebar-view-btn sidebar-view-btn-active" type="button" title="Grid view"><Grid4Icon /></button>
        <button className="sidebar-view-btn" type="button" title="Two columns"><Grid2Icon /></button>
        <button className="sidebar-view-btn" type="button" title="List view"><ListIcon /></button>
      </div>
    </aside>
  );
}
