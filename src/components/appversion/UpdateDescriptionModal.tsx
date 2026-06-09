import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/UpdateDescriptionModal.css";
import { updateAppVersion } from "../../services/appVersionsApi";

interface UpdateDescriptionModalProps {
  versionId: string;
  currentName: string;
  currentDescription: string;
  onClose: () => void;
  onUpdated: (description: string) => void;
}

export function UpdateDescriptionModal({
  versionId,
  currentName,
  currentDescription,
  onClose,
  onUpdated,
}: UpdateDescriptionModalProps) {
  const [description, setDescription] = useState(currentDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateAppVersion(versionId, currentName, description.trim());
      onUpdated(description.trim());
    } catch {
      setError("Failed to update description. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="udm-overlay" onMouseDown={onClose}>
      <div className="udm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="udm-header">
          <span className="udm-title">Edit Description</span>
          <button
            className="udm-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="udm-body">
          <textarea
            className="udm-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />
          {error && <div className="udm-error">{error}</div>}
        </div>

        <div className="udm-footer">
          <button
            className="udm-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="udm-btn-primary"
            type="button"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
