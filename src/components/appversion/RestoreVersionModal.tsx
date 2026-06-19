import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/RestoreVersionModal.css";
import { i18n } from "../../i18n/i18n";

interface RestoreVersionModalProps {
  date: string;
  publisher: string;
  versionName: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

function formatDetailDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

export function RestoreVersionModal({
  date,
  publisher,
  versionName,
  onClose,
  onConfirm,
}: RestoreVersionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch {
      setError(i18n.t("version_history.restore_failure_message"));
      setLoading(false);
    }
  }

  const modal = (
    <div className="rvm-overlay" onMouseDown={onClose}>
      <div className="rvm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rvm-header">
          <span className="rvm-title">
            {i18n.t("version_history.restoreThisVersion")}
          </span>
          <button
            className="rvm-close"
            type="button"
            aria-label={i18n.t("version_history.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="rvm-body">
          <div className="rvm-warning">
            <span className="rvm-warning-icon" aria-hidden="true">⚠</span>
            <span>{i18n.t("version_history.restore_warning")}</span>
          </div>

          <div className="rvm-details">
            <p className="rvm-details-title">
              {i18n.t("version_history.version_details")}
            </p>
            <div className="rvm-details-row">
              <span className="rvm-details-label">{i18n.t("version_history.date")}: </span>
              {formatDetailDate(date)}
            </div>
            <div className="rvm-details-row">
              <span className="rvm-details-label">{i18n.t("version_history.publisher")}: </span>
              {publisher}
            </div>
            <div className="rvm-details-row">
              <span className="rvm-details-label">{i18n.t("version_history.version")}: </span>
              {versionName}
            </div>
          </div>

          <div>
            <p className="rvm-disclaimer-heading">{i18n.t("version_history.important")}</p>
            <p className="rvm-disclaimer">
              {i18n.t("version_history.disclaimer_message")}
            </p>
          </div>

          {error && <div className="rvm-error">{error}</div>}
        </div>

        <div className="rvm-footer">
          <button
            className="rvm-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {i18n.t("version_history.cancel")}
          </button>
          <button
            className="rvm-btn-primary"
            type="button"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading
              ? i18n.t("version_history.restoring")
              : i18n.t("version_history.restoreThisVersion")}
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
