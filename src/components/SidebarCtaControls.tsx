import './SidebarRight.css';
import type { ThemeCtaColor } from '../types';
import { ctaIcons } from '../data/ctaIcons';

// ── Icons ──────────────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 9l3-3.5 2.5 2.5 2-2L12 10" stroke="currentColor" strokeWidth="1.1"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="5.5" r="1" fill="currentColor" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path d="M7 1L1 8h5l-1 5 6-7H6l1-5z" stroke="currentColor" strokeWidth="1.2"
        strokeLinejoin="round" />
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

// ── Button type previews ───────────────────────────────────────────────────────

function RoundPreview() {
  return (
    <div className="sr-cta-preview sr-cta-preview--round">
      <span className="sr-cta-preview-icon"><StarIcon /></span>
    </div>
  );
}

function FullWidthPreview() {
  return (
    <div className="sr-cta-preview sr-cta-preview--plain">
      <span className="sr-cta-preview-label">Button</span>
    </div>
  );
}

function IconPreview() {
  return (
    <div className="sr-cta-preview sr-cta-preview--row">
      <span className="sr-cta-preview-icon"><BoltIcon /></span>
      <span className="sr-cta-preview-label">Button</span>
    </div>
  );
}

function ImagePreview() {
  return (
    <div className="sr-cta-preview sr-cta-preview--row">
      <span className="sr-cta-preview-icon"><ImagePlaceholderIcon /></span>
      <span className="sr-cta-preview-label">Button</span>
    </div>
  );
}

const CTA_BUTTON_TYPES = [
  { id: 'Round',     label: 'Round',      Preview: RoundPreview },
  { id: 'FullWidth', label: 'Full Width',  Preview: FullWidthPreview },
  { id: 'Icon',      label: 'Icon',       Preview: IconPreview },
  { id: 'Image',     label: 'Image',      Preview: ImagePreview },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function SidebarCtaControls({ selectedCta, palette, onEditCta }: {
  selectedCta: any;
  palette: ThemeCtaColor[];
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
}) {
  const attrs = selectedCta?.CtaAttributes ?? {};
  const ctaId = selectedCta?.InfoId;
  const patch = (p: Record<string, any>) => onEditCta?.(ctaId, p);

  return (
    <>
      {/* CtaButtonType — visual design */}
      <div className="sr-cta-types">
        {/* Round + FullWidth share the first row */}
        <div className="sr-cta-type-row">
          {CTA_BUTTON_TYPES.slice(0, 2).map(({ id, label, Preview }) => (
            <button
              key={id}
              type="button"
              className={`sr-cta-type sr-cta-type--${id.toLowerCase()}${attrs.CtaButtonType === id ? ' sr-cta-type--active' : ''}`}
              title={label}
              onClick={() => patch({ CtaButtonType: id })}
            >
              <Preview />
            </button>
          ))}
        </div>
        {/* Image + Icon as full-width rows */}
        {CTA_BUTTON_TYPES.slice(2).map(({ id, label, Preview }) => (
          <button
            key={id}
            type="button"
            className={`sr-cta-type${attrs.CtaButtonType === id ? ' sr-cta-type--active' : ''}`}
            title={label}
            onClick={() => patch({ CtaButtonType: id })}
          >
            <Preview />
          </button>
        ))}
      </div>

      {/* CtaBGColor — background color */}
      <div className="sr-palette-row">
        <div className="sr-palette">
          {palette.map(c => (
            <button
              key={c.CtaColorId}
              className={`sr-palette-chip${attrs.CtaBGColor === c.CtaColorName ? ' sr-palette-chip--active' : ''}`}
              style={{ background: c.CtaColorCode }}
              type="button"
              aria-label={c.CtaColorName}
              onClick={() => patch({ CtaBGColor: c.CtaColorName })}
            />
          ))}
        </div>
      </div>

      {/* CtaLabel */}
      <div className="sr-section">
        <input
          className="sr-input"
          type="text"
          placeholder="Label"
          value={attrs.CtaLabel ?? ''}
          onChange={e => patch({ CtaLabel: e.target.value })}
        />
      </div>

      {/* CtaAction — value / phone / email / url etc. */}
      <div className="sr-section" style={{ paddingTop: 0 }}>
        <input
          className="sr-input"
          type="text"
          placeholder={attrs.CtaType === 'Phone' ? 'Phone number' : attrs.CtaType === 'Email' ? 'Email address' : attrs.CtaType === 'Weblink' ? 'URL' : 'Value'}
          value={attrs.CtaAction ?? ''}
          onChange={e => patch({ CtaAction: e.target.value })}
        />
      </div>

      {/* CtaColor — light / dark text & icon */}
      <div className="sr-toolbar">
        <button
          className={`sr-tool-btn${attrs.CtaColor === '#ffffff' ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Light text & icon"
          onClick={() => patch({ CtaColor: '#ffffff' })}
        >
          <SquareOutlineIcon />
        </button>
        <button
          className={`sr-tool-btn${attrs.CtaColor === '#333333' ? ' sr-tool-btn-active' : ''}`}
          type="button"
          title="Dark text & icon"
          onClick={() => patch({ CtaColor: '#333333' })}
        >
          <SquareFilledIcon />
        </button>
      </div>

      {/* CtaButtonIcon — icon grid */}
      <div className="sr-icon-grid">
        {ctaIcons.map(icon => (
          <button
            key={icon.name}
            className={`sr-icon-cell${attrs.CtaButtonIcon === icon.name ? ' sr-icon-cell--active' : ''}`}
            type="button"
            title={icon.name}
            onClick={() => patch({ CtaButtonIcon: icon.name })}
          >
            <span
              className="sr-icon-wrap"
              dangerouslySetInnerHTML={{ __html: icon.svg }}
            />
          </button>
        ))}
      </div>
    </>
  );
}
