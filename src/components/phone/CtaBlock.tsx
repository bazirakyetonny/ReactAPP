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

interface CtaBlockProps {
  block: any;
  ctaColors?: ThemeCtaColor[];
  interactive?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (infoId: string) => void;
  onDelete?: (infoId: string) => void;
  onDragStart?: (e: React.MouseEvent, infoId: string, el: HTMLElement) => void;
}

export function CtaBlock({ block, ctaColors, interactive = false, isDragging = false, isSelected = false, onSelect, onDelete, onDragStart }: CtaBlockProps) {
  const attrs = block?.CtaAttributes ?? {};
  const label = attrs.CtaLabel || 'Button';
  const bg = resolveCtaColor(attrs.CtaBGColor, ctaColors);
  const color = attrs.CtaColor || '#ffffff';
  const type = attrs.CtaButtonType || 'Round';
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
            {label && (
              <span className="phone-cta-round-label">{label.toUpperCase()}</span>
            )}
          </div>
        )}
        {(type === 'FullWidth' || type === 'Image') && (
          <div className="phone-cta-fullwidth" style={{ background: bg, color }}>
            {IconEl}
            <span className="phone-cta-label">{label}</span>
          </div>
        )}
        {type === 'Icon' && (
          <div className="phone-cta-icon" style={{ color: bg }}>
            {IconEl}
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
