import { useState } from "react";
import ReactDOM from "react-dom";
import { copyHistoryVersion } from "../../services/appVersionsApi";
import type { AppVersionHistoryEntry } from "../../services/appVersionsApi";
import "./css/CopyHistoryVersionModal.css";
import { i18n } from "../../i18n/i18n";

interface CopyHistoryVersionModalProps {
  appVersionId: string;
  entry: AppVersionHistoryEntry;
  onClose: () => void;
  onCopied: () => void;
}

export function CopyHistoryVersionModal({
  appVersionId,
  entry,
  onClose,
  onCopied,
}: CopyHistoryVersionModalProps) {
  const [name, setName] = useState(`${entry.AppVersionName} Copy`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(i18n.t("version_history.copy_modal.name_required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await copyHistoryVersion(appVersionId, entry.AppVersionNumber, trimmed);
      onCopied();
    } catch {
      setError(i18n.t("version_history.copy_failure_message"));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) handleDuplicate();
    if (e.key === "Escape") onClose();
  }

  const modal = (
    <div className="chv-overlay" onMouseDown={onClose}>
      <div className="chv-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="chv-header">
          <span className="chv-title">
            {i18n.t("version_history.copy_modal.title")}
          </span>
          <button
            className="chv-close"
            type="button"
            aria-label={i18n.t("version_history.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="chv-body">
          <label className="chv-label">
            {i18n.t("version_history.copy_modal.enter_version_name")}
          </label>
          <input
            className={`chv-input${error ? " chv-input--error" : ""}`}
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {error && <div className="chv-error">{error}</div>}
        </div>

        <div className="chv-footer">
          <button
            className="chv-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {i18n.t("version_history.cancel")}
          </button>
          <button
            className="chv-btn-primary"
            type="button"
            disabled={loading || !name.trim()}
            onClick={handleDuplicate}
          >
            {loading
              ? i18n.t("version_history.copying")
              : i18n.t("version_history.copy_modal.save")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
