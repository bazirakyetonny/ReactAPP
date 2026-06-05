import type { ThemeCtaColor } from "../../types";
import { ColorPalette } from "./ColorPalette";
import "./MultiSelectPanel.css";

// ── Icons ─────────────────────────────────────────────────────────────────────

function SquareOutlineIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SquareFilledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" fill="#1f2937" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
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

// ── Constants ─────────────────────────────────────────────────────────────────

const MULTI_CTA_TYPES = [
  { id: "Round",     label: "Round",      Preview: RoundPreview },
  { id: "FullWidth", label: "Full Width", Preview: FullWidthPreview },
  { id: "Icon",      label: "Icon",       Preview: IconPreview },
  { id: "Image",     label: "Image",      Preview: ImagePreview },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface MultiSelectPanelProps {
  selectedTileIds?: Set<string>;
  selectedCtaIds?: Set<string>;
  moodId?: string;
  ctaColors: ThemeCtaColor[];
  onBulkEditTiles?: (patch: Record<string, any>) => void;
  onBulkEditCtas?: (patch: Record<string, any>) => void;
}

export function MultiSelectPanel({
  selectedTileIds,
  selectedCtaIds,
  moodId,
  ctaColors,
  onBulkEditTiles,
  onBulkEditCtas,
}: MultiSelectPanelProps) {
  const tileCount = selectedTileIds?.size ?? 0;
  const ctaCount = selectedCtaIds?.size ?? 0;

  if (tileCount === 0 && ctaCount === 0) return null;

  return (
    <div className="sr-multi-select">
      <div className="sr-multi-select-header">
        {tileCount > 0 && (
          <span>{tileCount} tile{tileCount !== 1 ? "s" : ""}</span>
        )}
        {tileCount > 0 && ctaCount > 0 && <span>, </span>}
        {ctaCount > 0 && (
          <span>{ctaCount} button{ctaCount !== 1 ? "s" : ""}</span>
        )}
        <span> selected</span>
      </div>

      {tileCount > 0 && (
        <>
          <ColorPalette
            selectedTile={{ Id: "bulk" }}
            onEditTile={(_id, patch) => onBulkEditTiles?.(patch)}
            moodId={moodId}
          />
          <div className="sr-toolbar">
            <div className="sr-text-color-group">
              <button
                className="sr-tool-btn sr-tool-btn--in-group"
                type="button"
                title="Light text & icon (#ffffff)"
                onClick={() => onBulkEditTiles?.({ Color: "#ffffff" })}
              >
                <SquareOutlineIcon />
              </button>
              <button
                className="sr-tool-btn sr-tool-btn--in-group"
                type="button"
                title="Dark text & icon (#333333)"
                onClick={() => onBulkEditTiles?.({ Color: "#333333" })}
              >
                <SquareFilledIcon />
              </button>
            </div>
          </div>
        </>
      )}

      {ctaCount > 0 && (
        <>
          <div className="sr-cta-types">
            <div className="sr-cta-type-row">
              {MULTI_CTA_TYPES.slice(0, 2).map(({ id, label, Preview }) => (
                <button
                  key={id}
                  type="button"
                  className={`sr-cta-type sr-cta-type--${id.toLowerCase()}`}
                  title={label}
                  onClick={() => onBulkEditCtas?.({ CtaButtonType: id })}
                >
                  <Preview />
                </button>
              ))}
            </div>
            {MULTI_CTA_TYPES.slice(2).map(({ id, label, Preview }) => (
              <button
                key={id}
                type="button"
                className="sr-cta-type"
                title={label}
                onClick={() => onBulkEditCtas?.({ CtaButtonType: id })}
              >
                <Preview />
              </button>
            ))}
          </div>
          <div className="sr-palette-row">
            <div className="sr-palette">
              {ctaColors.map((c) => (
                <button
                  key={c.CtaColorId}
                  className="sr-palette-chip"
                  style={{ background: c.CtaColorCode }}
                  type="button"
                  aria-label={c.CtaColorName}
                  onClick={() => onBulkEditCtas?.({ CtaBGColor: c.CtaColorName })}
                />
              ))}
            </div>
          </div>
          <div className="sr-toolbar">
            <div className="sr-text-color-group">
              <button
                className="sr-tool-btn sr-tool-btn--in-group"
                type="button"
                title="Light text (#ffffff)"
                onClick={() => onBulkEditCtas?.({ CtaColor: "#ffffff" })}
              >
                <SquareOutlineIcon />
              </button>
              <button
                className="sr-tool-btn sr-tool-btn--in-group"
                type="button"
                title="Dark text (#333333)"
                onClick={() => onBulkEditCtas?.({ CtaColor: "#333333" })}
              >
                <SquareFilledIcon />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
