import { useState, useEffect } from 'react';
import './SidebarRight.css';
import type { ThemeCtaColor } from '../types';
import { ctaIcons } from '../data/ctaIcons';
import { dataStore } from '../data/datastore';

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

export function SidebarCtaControls({ selectedCta, palette, onEditCta, onBeforeCtaEdit, onWeblinkSave, onAddressSave, onLiveCtaLabel, onEndLiveCtaLabel }: {
  selectedCta: any;
  palette: ThemeCtaColor[];
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
  onBeforeCtaEdit?: () => void;
  onWeblinkSave?: (url: string, label: string) => void;
  onAddressSave?: (address: string, label: string) => void;
  onLiveCtaLabel?: (id: string, label: string) => void;
  onEndLiveCtaLabel?: () => void;
}) {
  const attrs = selectedCta?.CtaAttributes ?? {};
  const ctaId = selectedCta?.InfoId;
  const patch = (p: Record<string, any>) => onEditCta?.(ctaId, p);

  const [ctaLabel, setCtaLabel] = useState(attrs.CtaLabel ?? '');
  const [ctaAction, setCtaAction] = useState(attrs.CtaAction ?? '');

  useEffect(() => { setCtaLabel(attrs.CtaLabel ?? ''); }, [ctaId, attrs.CtaLabel]);
  useEffect(() => { setCtaAction(attrs.CtaAction ?? ''); }, [ctaId]);

  const allForms: any[] = dataStore.get('SDT_DynamicFormsCollection') ?? [];
  const NULL_GUID = '00000000-0000-0000-0000-000000000000';
  const rawSupplierId = attrs.CtaConnectedSupplierId;
  const supplierId: string = (rawSupplierId && rawSupplierId !== NULL_GUID)
    ? String(rawSupplierId)
    : '';
  const forms = supplierId
    ? allForms.filter(f => String(f.SupplierId) === supplierId)
    : allForms;
  const selectedFormId = forms.find(f => f.FormUrl === attrs.CtaAction)?.FormId?.toString() ?? '';

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
          value={ctaLabel}
          onChange={e => { setCtaLabel(e.target.value); onLiveCtaLabel?.(ctaId, e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          onBlur={() => { onEndLiveCtaLabel?.(); if (ctaLabel !== (attrs.CtaLabel ?? '')) { onBeforeCtaEdit?.(); patch({ CtaLabel: ctaLabel }); } }}
        />
      </div>

      {/* CtaAction — form dropdown or plain text */}
      <div className="sr-section" style={{ paddingTop: 0 }}>
        {attrs.CtaType === 'Form' ? (
          <select
            className="sr-input sr-select"
            value={selectedFormId}
            onChange={e => {
              const form = forms.find(f => f.FormId?.toString() === e.target.value);
              if (form) {
                patch({ CtaAction: form.FormUrl, CtaLabel: attrs.CtaLabel || form.PageName });
                if (form.FormUrl) onWeblinkSave?.(form.FormUrl, attrs.CtaLabel || form.PageName);
              } else {
                patch({ CtaAction: '' });
              }
            }}
          >
            <option value="">Select a form…</option>
            {forms.map(f => (
              <option key={f.FormId} value={f.FormId?.toString()}>{f.PageName}</option>
            ))}
          </select>
        ) : (
          <input
            className="sr-input"
            type="text"
            placeholder={attrs.CtaType === 'Phone' ? 'Phone number' : attrs.CtaType === 'Email' ? 'Email address' : attrs.CtaType === 'Weblink' ? 'URL' : 'Value'}
            value={ctaAction}
            onFocus={() => onBeforeCtaEdit?.()}
            onChange={e => setCtaAction(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            onBlur={() => {
              if (ctaAction !== (attrs.CtaAction ?? '')) {
                if (attrs.CtaType === 'Weblink') {
                  onWeblinkSave?.(ctaAction, ctaLabel);
                } else if (attrs.CtaType === 'Address') {
                  onAddressSave?.(ctaAction, ctaLabel);
                } else {
                  patch({ CtaAction: ctaAction });
                }
              }
            }}
          />
        )}
      </div>

      {/* CtaColor — light / dark text & icon */}
      <div className="sr-toolbar">
        <div className="sr-text-color-group">
          <button
            className={`sr-tool-btn sr-tool-btn--in-group${attrs.CtaColor === '#ffffff' ? ' sr-tool-btn-active' : ''}`}
            type="button"
            title="Light text & icon"
            onClick={() => patch({ CtaColor: '#ffffff' })}
          >
            <SquareOutlineIcon />
          </button>
          <div className="sr-group-separator" />
          <button
            className={`sr-tool-btn sr-tool-btn--in-group${attrs.CtaColor === '#333333' ? ' sr-tool-btn-active' : ''}`}
            type="button"
            title="Dark text & icon"
            onClick={() => patch({ CtaColor: '#333333' })}
          >
            <SquareFilledIcon />
          </button>
        </div>
      </div>

      {/* CtaButtonIcon — icon grid (Round and Icon types only) */}
      {(attrs.CtaButtonType === 'Round' || attrs.CtaButtonType === 'Icon') && (
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
      )}

    </>
  );
}
