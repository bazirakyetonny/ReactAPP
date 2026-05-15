import './SidebarRight.css';

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

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

function HouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 9L9 3L16 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="9" width="10" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="7" y="12" width="4" height="4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SuitcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 7V5C6 4.4 6.4 4 7 4H11C11.6 4 12 4.4 12 5V7" stroke="currentColor" strokeWidth="1.3" />
      <line x1="3" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function BroomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <line x1="9" y1="2" x2="15" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 10C4 10 5 8 8 9C11 10 11 13 11 13L7 15C7 15 3 14 4 10Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
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

function CarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 10L5 5H13L15 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="10" width="14" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.5" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12.5" cy="15" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
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

const SERVICES = [
  { label: 'Wifi',         icon: <WifiIcon /> },
  { label: 'Home',         icon: <HouseIcon /> },
  { label: 'Accessories',  icon: <SuitcaseIcon /> },
  { label: 'Housekeeping', icon: <BroomIcon /> },
  { label: 'Maintenance',  icon: <WrenchIcon /> },
  { label: 'Vehicle',      icon: <CarIcon /> },
];

const CONTACTS = [
  { label: 'Phone',    icon: <PhoneIcon /> },
  { label: 'Email',    icon: <MailIcon /> },
  { label: 'Location', icon: <MapPinIcon /> },
  { label: 'Link',     icon: <LinkIcon /> },
  { label: 'File',     icon: <FileIcon /> },
  { label: 'Star',     icon: <StarIcon /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SidebarRight() {
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

      {/* 3. Enter title input */}
      <div className="sr-section">
        <input className="sr-input" type="text" placeholder="Enter title" />
      </div>

      {/* 4. Format toolbar */}
      <div className="sr-toolbar">
        <button className="sr-tool-btn" type="button" title="Outline style"><SquareOutlineIcon /></button>
        <button className="sr-tool-btn sr-tool-btn-active" type="button" title="Filled style"><SquareFilledIcon /></button>
        <button className="sr-tool-btn" type="button" title="Justify"><AlignJustifyIcon /></button>
        <span className="sr-badge">1</span>
      </div>

      {/* 5. Services section */}
      <button className="sr-section-header" type="button">
        <span className="sr-section-title">Services</span>
        <ChevronDownIcon />
      </button>
      <div className="sr-icon-grid">
        {SERVICES.map(s => (
          <button key={s.label} className="sr-icon-cell" type="button">
            <span className="sr-icon-wrap">{s.icon}</span>
            <span className="sr-icon-label">{s.label}</span>
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
