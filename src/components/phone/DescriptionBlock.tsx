interface DescriptionBlockProps {
  block: { InfoId: string; InfoValue?: string };
  interactive?: boolean;
  isDragging?: boolean;
  onEdit?: (infoId: string) => void;
  onDelete?: (infoId: string) => void;
  onDragStart?: (e: React.MouseEvent, infoId: string, el: HTMLElement) => void;
}

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

export function DescriptionBlock({ block, interactive = false, isDragging = false, onEdit, onDelete, onDragStart }: DescriptionBlockProps) {
  return (
    <div
      className={[
        'phone-desc-block',
        interactive ? 'phone-desc-block--interactive' : '',
        isDragging ? 'phone-desc-block--dragging' : '',
      ].filter(Boolean).join(' ')}
      onMouseDown={interactive && onDragStart
        ? (e) => onDragStart(e, block.InfoId, e.currentTarget as HTMLElement)
        : undefined}
    >
      <div
        className="phone-desc-content"
        dangerouslySetInnerHTML={{ __html: block.InfoValue || '' }}
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
