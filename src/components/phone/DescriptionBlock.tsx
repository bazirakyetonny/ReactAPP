import React, { useMemo } from 'react';
import { normalizeQuillHtml } from '../../utils/contentTransforms';

interface DescriptionBlockProps {
  block: { InfoId: string; InfoValue?: string };
  interactive?: boolean;
  isDragging?: boolean;
  isMultiSelected?: boolean;
  onEdit?: (infoId: string) => void;
  onDelete?: (infoId: string) => void;
  onDragStart?: (e: React.MouseEvent, infoId: string, el: HTMLElement) => void;
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 33 33" aria-hidden="true">
      <g fill="#fff" stroke="#5068a8" strokeWidth="1">
        <circle cx="16.5" cy="16.5" r="16.5" stroke="none" />
        <circle cx="16.5" cy="16.5" r="16" fill="none" />
      </g>
      <path d="M12.834,3.8a1.854,1.854,0,0,1,2.622,2.622L6.606,15.274,3,16.257l.983-3.606Z" transform="translate(7 6.742)" fill="#fff" stroke="#5068a8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
    </svg>
  );
}

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

export function DescriptionBlock({ block, interactive = false, isDragging = false, isMultiSelected = false, onEdit, onDelete, onDragStart }: DescriptionBlockProps) {
  const html = useMemo(() => normalizeQuillHtml(block.InfoValue || ''), [block.InfoValue]);
  return (
    <div
      data-description-id={block.InfoId}
      className={[
        'phone-desc-block',
        interactive ? 'phone-desc-block--interactive' : '',
        isDragging ? 'phone-desc-block--dragging' : '',
        isMultiSelected ? 'phone-desc-block--multi-selected' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={interactive && onDragStart
        ? (e) => onDragStart(e, block.InfoId, e.currentTarget as HTMLElement)
        : undefined}
    >
      <div
        className="phone-desc-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {interactive && (
        <>
          <button
            className="phone-desc-edit-btn"
            type="button"
            aria-label="Edit description"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit?.(block.InfoId); }}
          >
            <PencilIcon />
          </button>
          <button
            className="phone-desc-delete-btn"
            type="button"
            aria-label="Delete description"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete?.(block.InfoId); }}
          >
            <TrashIcon />
          </button>
        </>
      )}
    </div>
  );
}
