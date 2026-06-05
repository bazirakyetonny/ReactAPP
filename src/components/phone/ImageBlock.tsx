import { useState } from 'react';
import type { Image } from '../../types';

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
