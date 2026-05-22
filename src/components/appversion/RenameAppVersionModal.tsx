import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/RenameAppVersionModal.css";
import { updateAppVersion } from "../../services/appVersionsApi";

interface RenameAppVersionModalProps {
  versionId: string;
  currentName: string;
  currentDescription: string;
  onClose: () => void;
  onRenamed: (newName: string) => void;
}

export function RenameAppVersionModal({
  versionId,
  currentName,
  currentDescription,
  onClose,
  onRenamed,
}: RenameAppVersionModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Version name is required.");
      return;
    }
    if (trimmed === currentName) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateAppVersion(versionId, trimmed, currentDescription);
      onRenamed(trimmed);
    } catch {
      setError("Failed to rename version. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) handleSave();
    if (e.key === "Escape") onClose();
  }

  const modal = (
    <div className="rmv-overlay" onMouseDown={onClose}>
      <div className="rmv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rmv-header">
          <span className="rmv-title">Rename Version</span>
          <button
            className="rmv-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="rmv-body">
          <div className="rmv-field">
            <label className="rmv-label" htmlFor="rmv-name">
              Version name
            </label>
            <input
              id="rmv-name"
              className="rmv-input"
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          {error && <div className="rmv-error">{error}</div>}
        </div>

        <div className="rmv-footer">
          <button
            className="rmv-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="rmv-btn-primary"
            type="button"
            disabled={loading || !name.trim()}
            onClick={handleSave}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
