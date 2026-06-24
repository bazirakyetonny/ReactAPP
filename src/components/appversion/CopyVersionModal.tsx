import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/DuplicateAppVersionModal.css";
import { copyHistoryVersion } from "../../services/appVersionsApi";
import { i18n } from "../../i18n/i18n";

interface CopyVersionModalProps {
  appVersionId: string;
  historyNumber: number;
  defaultName: string;
  onClose: () => void;
  onCopied?: (newVersionId: string) => void;
}

export function CopyVersionModal({
  appVersionId,
  historyNumber,
  defaultName,
  onClose,
  onCopied,
}: CopyVersionModalProps) {
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(i18n.t("messages.error.empty_version_name"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newVersion = await copyHistoryVersion(
        appVersionId,
        historyNumber,
        trimmed,
      );
      console.log("Copied version:", newVersion);
      onClose();
      onCopied?.(newVersion.AppVersionId);
    } catch (e) {
      setError(i18n.t("version_history.copy_failure_message"));
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
          <span className="dv-title">
            {i18n.t("version_history.makeACopy")}
          </span>
          <button
            className="dv-close"
            type="button"
            aria-label={i18n.t("version_history.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="dv-body">
          <label style={{ fontSize: 13, color: "#374151" }}>
            {i18n.t("navbar.appversion.enter_version_name")}
          </label>
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
            className="dv-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {i18n.t("navbar.appversion.cancel")}
          </button>
          <button
            className="dv-btn-primary"
            type="button"
            disabled={loading || !name.trim()}
            onClick={handleSave}
          >
            {loading
              ? i18n.t("version_history.copying")
              : i18n.t("navbar.appversion.save")}
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
