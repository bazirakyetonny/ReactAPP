import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/MoveToTrashModal.css";
import { deleteVersion } from "../../services/appVersionsApi";

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
      setError("Failed to move version to trash. Please try again.");
      setLoading(false);
    }
  }

  const modal = (
    <div className="mtv-overlay" onMouseDown={onClose}>
      <div className="mtv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mtv-header">
          <span className="mtv-title">Move to Trash</span>
          <button
            className="mtv-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mtv-body">
          <p className="mtv-message">
            Are you sure you want to move{" "}
            <strong>{versionName}</strong> to trash? This action cannot
            be undone.
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
            Cancel
          </button>
          <button
            className="mtv-btn-danger"
            type="button"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Moving…" : "Move to Trash"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
