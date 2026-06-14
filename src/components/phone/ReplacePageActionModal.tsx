import ReactDOM from "react-dom";
import "./ReplacePageActionModal.css";

interface ReplacePageActionModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function ReplacePageActionModal({ onConfirm, onClose }: ReplacePageActionModalProps) {
  return ReactDOM.createPortal(
    <div className="rpa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rpa-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rpa-header">
          <span className="rpa-title">Confirmation</span>
          <button className="rpa-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="rpa-body">
          <p className="rpa-message">
            This tile is already linked to a page. Do you want to replace it?
          </p>
        </div>
        <div className="rpa-footer">
          <button className="rpa-btn rpa-btn--primary" type="button" onClick={onConfirm}>
            Confirm
          </button>
          <button className="rpa-btn rpa-btn--secondary" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body,
  );
}
