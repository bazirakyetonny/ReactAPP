import React from 'react';
import type { ThemeCtaColor } from '../../types';
import { resolveCtaColor } from '../../utils/tileUtils';
import { ctaIcons } from '../../data/ctaIcons';

function TrashIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
      <path d="M1 3h8M4 3V2h2v1M2 3l.5 6h5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <circle cx="3" cy="3" r="1" fill="currentColor" />
      <circle cx="7" cy="3" r="1" fill="currentColor" />
      <circle cx="3" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
      <path d="M6 1L1 7h4l-1 4 5-6H5l1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
      <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function ImgPlaceholderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 10.5l4-4.5 3 3 2.5-2.5L15 12" stroke="currentColor" strokeWidth="1.1"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

interface CtaBlockProps {
  block: any;
  ctaColors?: ThemeCtaColor[];
  interactive?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (infoId: string) => void;
  onDelete?: (infoId: string) => void;
  onDragStart?: (e: React.MouseEvent, infoId: string, el: HTMLElement) => void;
  onSelectImage?: (ctaId: string) => void;
  /** Live label override while sidebar is being typed into */
  liveLabel?: string;
  /** Highlight this block with a red analysis outline */
  isAnalysisHighlight?: boolean;
  isMultiSelected?: boolean;
  /** Translation sidebar: show label as an editable input */
  editableLabel?: boolean;
  /** Translation sidebar: fire when label span is clicked (to enter edit mode) */
  onLabelClick?: () => void;
  /** Translation sidebar: fire on input blur with the new value */
  onLabelBlur?: (value: string) => void;
}

export function CtaBlock({ block, ctaColors, interactive = false, isDragging = false, isSelected = false, onSelect, onDelete, onDragStart, onSelectImage, liveLabel, isAnalysisHighlight = false, isMultiSelected = false, editableLabel = false, onLabelClick, onLabelBlur }: CtaBlockProps) {
  const attrs = block?.CtaAttributes ?? {};
  const label = liveLabel !== undefined ? liveLabel : (attrs.CtaLabel || (onLabelClick ? '' : 'Button'));
  const bg = resolveCtaColor(attrs.CtaBGColor, ctaColors);
  const color = attrs.CtaColor || '#ffffff';
  const type = attrs.CtaButtonType || 'Image';
  const imgUrl: string = attrs.CtaButtonImgUrl || '';

  const LabelEl = editableLabel
    ? <input
        className="phone-cta-label-input"
        defaultValue={attrs.CtaLabel ?? ''}
        autoFocus
        onBlur={(e) => onLabelBlur?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        onClick={(e) => e.stopPropagation()}
      />
    : null;

  const iconSvg = attrs.CtaButtonIcon
    ? (ctaIcons.find(i => i.name === attrs.CtaButtonIcon)?.svg ?? null)
    : null;
  const IconEl = iconSvg
    ? <span className="phone-cta-icon-svg" dangerouslySetInnerHTML={{ __html: iconSvg }} />
    : <BoltIcon />;

  return (
    <div
      data-cta-id={block.InfoId}
      className={[
        'phone-cta-block',
        interactive ? 'phone-cta-block--interactive' : '',
        isDragging ? 'phone-cta-block--dragging' : '',
        isSelected ? 'phone-cta-block--selected' : '',
        isMultiSelected ? 'phone-cta-block--multi-selected' : '',
        isAnalysisHighlight ? 'phone-cta-block--analysis' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={interactive && onDragStart
        ? (e) => onDragStart(e, block.InfoId, e.currentTarget as HTMLElement)
        : undefined}
      onClick={interactive && onSelect ? (e) => { e.stopPropagation(); onSelect(block.InfoId); } : undefined}
    >
      <div className="phone-cta-inner">
        {type === 'Round' && (
          <div className="phone-cta-round-wrap">
            <div className="phone-cta-round" style={{ background: bg, color }}>
              {IconEl}
            </div>
            {(label || editableLabel) && (
              LabelEl ?? <span className="phone-cta-round-label ts-editable-text" onClick={onLabelClick}>{label.toUpperCase()}</span>
            )}
          </div>
        )}

        {type === 'FullWidth' && (
          <div className="phone-cta-fullwidth phone-cta-fullwidth--plain" style={{ background: bg, color }}>
            {LabelEl ?? <span className="phone-cta-label ts-editable-text" onClick={onLabelClick}>{label}</span>}
          </div>
        )}

        {type === 'Icon' && (
          <div className="phone-cta-fullwidth" style={{ background: bg, color }}>
            <span className="phone-cta-icon-box">{IconEl}</span>
            {LabelEl ?? <span className="phone-cta-label ts-editable-text" onClick={onLabelClick}>{label}</span>}
            <ChevronIcon />
          </div>
        )}

        {type === 'Image' && (
          <div className="phone-cta-fullwidth" style={{ background: bg, color }}>
            <span className="phone-cta-img-wrap">
              {imgUrl
                ? <img src={imgUrl} className="phone-cta-img" alt="" />
                : <span className="phone-cta-img-placeholder"><ImgPlaceholderIcon /></span>
              }
              {interactive && onSelectImage && (
                <button
                  className="phone-cta-img-edit"
                  type="button"
                  aria-label="Select image"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onSelectImage(block.InfoId); }}
                >
                  <PenIcon />
                </button>
              )}
            </span>
            {LabelEl ?? <span className="phone-cta-label ts-editable-text" onClick={onLabelClick}>{label}</span>}
            <ChevronIcon />
          </div>
        )}
      </div>

      {interactive && (
        <div className="phone-cta-actions">
          <button className="phone-block-action-btn" onMouseDown={e => e.stopPropagation()} type="button" aria-label="Drag">
            <DragIcon />
          </button>
          <button
            className="phone-block-action-btn"
            type="button"
            aria-label="Delete CTA"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete?.(block.InfoId); }}
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}
