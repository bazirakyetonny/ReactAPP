import React from 'react';
import type { ThemeCtaColor } from '../../types';
import { resolveCtaColor } from '../../utils/tileUtils';
import { ctaIcons } from '../../data/ctaIcons';

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 33 33" aria-hidden="true">
      <g fill="#fff" stroke="#5068a8" strokeWidth="1">
        <circle cx="16.5" cy="16.5" r="16.5" stroke="none" />
        <circle cx="16.5" cy="16.5" r="16" fill="none" />
      </g>
      <g transform="translate(9.75 9)">
        <path d="M4.5,9H18" transform="translate(-4.5 -6)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
        <path d="M18.572,6V16.5A1.542,1.542,0,0,1,16.99,18H9.082A1.542,1.542,0,0,1,7.5,16.5V6M9.872,6V4.5A1.542,1.542,0,0,1,11.454,3h3.163A1.542,1.542,0,0,1,16.2,4.5V6" transform="translate(-6.286 -3)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
        <path d="M15,16.5v3.643" transform="translate(-9.75 -9.199)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
        <path d="M21,16.5v3.643" transform="translate(-12.75 -9.199)" fill="none" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
      </g>
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
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 33 33" aria-hidden="true">
      <g fill="#fff" stroke="#5068a8" strokeWidth="2">
        <circle cx="16.5" cy="16.5" r="16.5" stroke="none" />
        <circle cx="16.5" cy="16.5" r="16" fill="none" />
      </g>
      <path d="M12.834,3.8a1.854,1.854,0,0,1,2.622,2.622L6.606,15.274,3,16.257l.983-3.606Z" transform="translate(7 6.742)" fill="#fff" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <g fill="#fdfdfd" stroke="#5068a8" strokeWidth="1">
        <circle cx="11" cy="11" r="11" stroke="none" />
        <circle cx="11" cy="11" r="10.5" fill="none" />
      </g>
      <path d="M18.342,13.342H14.587V9.587a.623.623,0,1,0-1.245,0v3.755H9.587a.623.623,0,0,0,0,1.245h3.755v3.755a.623.623,0,1,0,1.245,0V14.587h3.755a.623.623,0,1,0,0-1.245Z" transform="translate(-2.965 -2.965)" fill="#5068a8" />
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
  /** Translation sidebar: show label as an editable input */
  editableLabel?: boolean;
  /** Translation sidebar: fire when label span is clicked (to enter edit mode) */
  onLabelClick?: () => void;
  /** Translation sidebar: fire on input blur with the new value */
  onLabelBlur?: (value: string) => void;
}

export function CtaBlock({ block, ctaColors, interactive = false, isDragging = false, isSelected = false, onSelect, onDelete, onDragStart, onSelectImage, liveLabel, isAnalysisHighlight = false, editableLabel = false, onLabelClick, onLabelBlur }: CtaBlockProps) {
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
      className={[
        'phone-cta-block',
        interactive ? 'phone-cta-block--interactive' : '',
        isDragging ? 'phone-cta-block--dragging' : '',
        isSelected ? 'phone-cta-block--selected' : '',
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
                  {imgUrl ? <PenIcon /> : <AddIcon />}
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
