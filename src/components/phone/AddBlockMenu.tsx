import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export interface AddBlockMenuProps {
  pos: { x: number; y: number };
  onSelect: (blockType: string) => void;
  onClose: () => void;
  hasPaste?: boolean;
  onPaste?: () => void;
}

const CTA_SUB_ITEMS = [
  { label: 'Address',  type: 'Cta_Address' },
  { label: 'Phone',    type: 'Cta_Phone' },
  { label: 'Email',    type: 'Cta_Email' },
  { label: 'Form',     type: 'Cta_Form' },
  { label: 'Weblink',  type: 'Cta_Weblink' },
] as const;

const ADD_BLOCK_ITEMS = [
  { label: 'Call To Action', type: 'Cta',         sub: true },
  { label: 'Description',    type: 'Description',  sub: false },
  { label: 'Image',          type: 'Image',        sub: false },
  { label: 'Tile',           type: 'TileGrid',     sub: false },
] as const;

export function AddBlockMenu({ pos, onSelect, onClose, hasPaste, onPaste }: AddBlockMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ctaHovered, setCtaHovered] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={ref} className="add-block-menu" style={{ left: pos.x, top: pos.y }}>
      {ADD_BLOCK_ITEMS.map(item => (
        <div
          key={item.type}
          className="add-block-menu__item-wrap"
          onMouseEnter={item.sub ? () => setCtaHovered(true) : undefined}
          onMouseLeave={item.sub ? () => setCtaHovered(false) : undefined}
        >
          <button
            className={`add-block-menu__item${item.sub && ctaHovered ? ' add-block-menu__item--expanded' : ''}`}
            onMouseDown={e => {
              e.stopPropagation();
              if (!item.sub) onSelect(item.type);
            }}
          >
            <span>{item.label}</span>
            {item.sub && (
              <span className="add-block-menu__chevron">›</span>
            )}
          </button>

          {item.sub && ctaHovered && (
            <div className="add-block-menu__sub">
              {CTA_SUB_ITEMS.map(sub => (
                <button
                  key={sub.type}
                  className="add-block-menu__sub-item"
                  onMouseDown={e => { e.stopPropagation(); onSelect(sub.type); }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {hasPaste && (
        <div className="add-block-menu__item-wrap">
          <button
            className="add-block-menu__item"
            onMouseDown={e => { e.stopPropagation(); onPaste?.(); onClose(); }}
          >
            <span>Paste</span>
          </button>
        </div>
      )}
    </div>,
    document.getElementById("root") ?? document.body
  );
}
