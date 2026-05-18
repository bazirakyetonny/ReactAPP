import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export interface AddBlockMenuProps {
  pos: { x: number; y: number };
  onSelect: (blockType: string) => void;
  onClose: () => void;
}

const ADD_BLOCK_ITEMS = [
  { label: 'Call To Action', type: 'Cta', arrow: true, disabled: true },
  { label: 'Description', type: 'Description', disabled: false },
  { label: 'Image', type: 'Image', disabled: true },
  { label: 'Tile', type: 'TileGrid', disabled: false },
] as const;

export function AddBlockMenu({ pos, onSelect, onClose }: AddBlockMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

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
        <button
          key={item.type}
          className={`add-block-menu__item${item.disabled ? ' add-block-menu__item--disabled' : ''}`}
          onMouseDown={e => { e.stopPropagation(); if (!item.disabled) onSelect(item.type); }}
        >
          <span>{item.label}</span>
          {'arrow' in item && item.arrow && <span className="add-block-menu__arrow">›</span>}
        </button>
      ))}
    </div>,
    document.body
  );
}
