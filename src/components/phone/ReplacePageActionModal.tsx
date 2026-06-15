import ReactDOM from "react-dom";
import { i18n } from "../../i18n/i18n";
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
          <span className="rpa-title">{i18n.t("sidebar.confirmation_title")}</span>
          <button className="rpa-close" type="button" onClick={onClose}>✕</button>
        </div>
        <div className="rpa-body">
          <p className="rpa-message">
            {i18n.t("messages.confirm.replace_page_link")}
          </p>
        </div>
        <div className="rpa-footer">
          <button className="rpa-btn rpa-btn--primary" type="button" onClick={onConfirm}>
            {i18n.t("sidebar.confirmation_accept")}
          </button>
          <button className="rpa-btn rpa-btn--secondary" type="button" onClick={onClose}>
            {i18n.t("sidebar.confirmation_cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("root") ?? document.body,
  );
}
