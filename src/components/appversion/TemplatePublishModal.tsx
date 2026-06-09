import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/TemplatePublishModal.css";
import { publishVersion } from "../../services/publishApi";

interface TemplatePublishModalProps {
  mode: "publish" | "unpublish";
  versionId: string;
  onConfirmed: () => void;
  onClose: () => void;
}

export function TemplatePublishModal({
  mode,
  versionId,
  onConfirmed,
  onClose,
}: TemplatePublishModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPublish = mode === "publish";

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await publishVersion(versionId, false);
      onConfirmed();
    } catch {
      setError(`Failed to ${isPublish ? "publish" : "unpublish"}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="tpm-overlay" onMouseDown={onClose}>
      <div className="tpm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tpm-header">
          <span className="tpm-title">
            {isPublish ? "Publish as Template" : "Unpublish Template"}
          </span>
          <button
            className="tpm-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="tpm-body">
          <p className="tpm-text">
            {isPublish
              ? "Are you sure you want to publish? Once published, the template will be visible to all Organisations."
              : "Are you sure you want to unpublish? Once unpublished, the template will no longer be visible to Organisations."}
          </p>
          {error && <p className="tpm-error">{error}</p>}
        </div>

        <div className="tpm-footer">
          <button
            className="tpm-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="tpm-btn-primary"
            type="button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? isPublish ? "Publishing…" : "Unpublishing…"
              : isPublish ? "Publish" : "Unpublish"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.getElementById("root") ?? document.body);
}
