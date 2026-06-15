import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '../../i18n/i18n';

export interface AddBlockMenuProps {
  pos: { x: number; y: number };
  onSelect: (blockType: string) => void;
  onClose: () => void;
  hasPaste?: boolean;
  onPaste?: () => void;
}

export function AddBlockMenu({ pos, onSelect, onClose, hasPaste, onPaste }: AddBlockMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ctaHovered, setCtaHovered] = useState(false);

  const ctaSubItems = [
    { label: i18n.t("sidebar.action_list.dropdown.address"), type: 'Cta_Address' },
    { label: i18n.t("sidebar.action_list.dropdown.phone"),   type: 'Cta_Phone' },
    { label: i18n.t("sidebar.action_list.dropdown.email"),   type: 'Cta_Email' },
    { label: i18n.t("sidebar.action_list.dropdown.form"),    type: 'Cta_Form' },
    { label: i18n.t("sidebar.action_list.dropdown.weblink"), type: 'Cta_Weblink' },
  ] as const;

  const addBlockItems = [
    { label: i18n.t("sidebar.action_list.call_to_action"), type: 'Cta',         sub: true },
    { label: i18n.t("sidebar.action_list.description"),    type: 'Description',  sub: false },
    { label: i18n.t("sidebar.action_list.image"),          type: 'Image',        sub: false },
    { label: i18n.t("sidebar.action_list.tile"),           type: 'TileGrid',     sub: false },
  ] as const;

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
      {addBlockItems.map(item => (
        <div
          key={item.type}
          className="add-block-menu__item-wrap"
          onMouseEnter={item.sub ? () => setCtaHovered(true) : undefined}
          onMouseLeave={item.sub ? () => setCtaHovered(false) : undefined}
        >
          <button
            className={`add-block-menu__item${item.sub && ctaHovered ? ' add-block-menu__item--expanded' : ''}`}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={e => {
              e.preventDefault();
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
              {ctaSubItems.map(sub => (
                <button
                  key={sub.type}
                  className="add-block-menu__sub-item"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onSelect(sub.type); }}
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
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); onPaste?.(); onClose(); }}
          >
            <span>{i18n.t("sidebar.action_list.paste")}</span>
          </button>
        </div>
      )}
    </div>,
    document.getElementById("root") ?? document.body
  );
}
