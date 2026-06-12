import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/MoveToTrashModal.css";
import { deleteVersion } from "../../services/appVersionsApi";
import { i18n } from "../../i18n/i18n";

interface MoveToTrashModalProps {
  versionId: string;
  versionName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function MoveToTrashModal({
  versionId,
  versionName,
  onClose,
  onDeleted,
}: MoveToTrashModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await deleteVersion(versionId);
      onDeleted();
    } catch {
      setError(i18n.t("navbar.appversion.move_to_trash_error"));
      setLoading(false);
    }
  }

  const modal = (
    <div className="mtv-overlay" onMouseDown={onClose}>
      <div className="mtv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mtv-header">
          <span className="mtv-title">{i18n.t("navbar.appversion.dropdow.move_to_trash")}</span>
          <button
            className="mtv-close"
            type="button"
            aria-label={i18n.t("version_history.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mtv-body">
          <p className="mtv-message">
            {i18n.t("navbar.appversion.move_to_trash_confirm", { name: versionName })}
          </p>
          {error && <div className="mtv-error">{error}</div>}
        </div>

        <div className="mtv-footer">
          <button
            className="mtv-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {i18n.t("navbar.appversion.cancel")}
          </button>
          <button
            className="mtv-btn-danger"
            type="button"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? i18n.t("navbar.appversion.moving") : i18n.t("navbar.appversion.dropdow.move_to_trash")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
