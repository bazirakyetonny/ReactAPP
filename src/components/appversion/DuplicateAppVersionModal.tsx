import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/DuplicateAppVersionModal.css";
import { copyAppVersion } from "../../services/appVersionsApi";

interface DuplicateAppVersionModalProps {
  versionId: string;
  currentName: string;
  onClose: () => void;
  onDuplicated: () => void;
}

export function DuplicateAppVersionModal({
  versionId,
  currentName,
  onClose,
  onDuplicated,
}: DuplicateAppVersionModalProps) {
  const [name, setName] = useState(`${currentName} - Copy`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Version name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await copyAppVersion(versionId, trimmed);
      onDuplicated();
    } catch {
      setError("Failed to duplicate version. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) handleSave();
    if (e.key === "Escape") onClose();
  }

  const modal = (
    <div className="dv-overlay" onMouseDown={onClose}>
      <div className="dv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dv-header">
          <span className="dv-title">Duplicate version</span>
          <button
            className="dv-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="dv-body">
          <input
            className="dv-input"
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {error && <div className="dv-error">{error}</div>}
        </div>

        <div className="dv-footer">
          <button
            className="dv-btn-primary"
            type="button"
            disabled={loading || !name.trim()}
            onClick={handleSave}
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            className="dv-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
