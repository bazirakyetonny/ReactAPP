import { useState } from 'react';
import type { Image } from '../../types';

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M7.5 1.5l2 2L3 10H1v-2L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden="true">
      <path d="M1 3h8M4 3V2h2v1M2 3l.5 6h5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageCarousel({ images }: { images: Image[] }) {
  const [idx, setIdx] = useState(0);
  const clamped = Math.min(idx, images.length - 1);
  const img = images[clamped];
  return (
    <div className="phone-image-carousel">
      <img src={img.InfoImageValue} alt="" className="phone-carousel-img" draggable={false} />
      <button
        className="phone-carousel-prev"
        type="button"
        aria-label="Previous image"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
      >
        ‹
      </button>
      <button
        className="phone-carousel-next"
        type="button"
        aria-label="Next image"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
      >
        ›
      </button>
      <div className="phone-carousel-dots">
        {images.map((_, i) => (
          <span key={i} className={`phone-carousel-dot${i === clamped ? ' phone-carousel-dot--active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

interface ImageBlockProps {
  block: { InfoId: string; Images?: Image[] };
  interactive?: boolean;
  isDragging?: boolean;
  isMultiSelected?: boolean;
  onEdit?: (infoId: string) => void;
  onDelete?: (infoId: string) => void;
  onDragStart?: (e: React.MouseEvent, infoId: string, el: HTMLElement) => void;
}

export function ImageBlock({ block, interactive = false, isDragging = false, isMultiSelected = false, onEdit, onDelete, onDragStart }: ImageBlockProps) {
  const images = block.Images ?? [];
  return (
    <div
      data-image-id={block.InfoId}
      className={[
        'phone-image-block',
        interactive ? 'phone-image-block--interactive' : '',
        isDragging ? 'phone-image-block--dragging' : '',
        isMultiSelected ? 'phone-image-block--multi-selected' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={interactive && onDragStart
        ? (e) => onDragStart(e, block.InfoId, e.currentTarget as HTMLElement)
        : undefined}
    >
      {images.length === 0 && (
        <div className="phone-image-empty">No image selected</div>
      )}
      {images.length === 1 && (
        <img src={images[0].InfoImageValue} alt="" className="phone-image-single" draggable={false} />
      )}
      {images.length > 1 && (
        <ImageCarousel images={images} />
      )}
      {interactive && (
        <>
          <button
            className="phone-image-edit-btn"
            type="button"
            aria-label="Edit images"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onEdit?.(block.InfoId); }}
          >
            <PencilIcon />
          </button>
          <button
            className="phone-image-delete-btn"
            type="button"
            aria-label="Delete image block"
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
