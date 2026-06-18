import { useState } from "react";
import ReactDOM from "react-dom";
import type { AppVersionHistoryEntry } from "../../services/appVersionsApi";
import { restoreHistoryVersion } from "../../services/appVersionsApi";
import "./css/RestoreVersionModal.css";
import { i18n } from "../../i18n/i18n";

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

interface RestoreVersionModalProps {
  appVersionId: string;
  entry: AppVersionHistoryEntry;
  onClose: () => void;
  onRestored: () => void;
}

export function RestoreVersionModal({
  appVersionId,
  entry,
  onClose,
  onRestored,
}: RestoreVersionModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      await restoreHistoryVersion(appVersionId, entry.AppVersionNumber);
      onRestored();
    } catch {
      setLoading(false);
    }
  }

  const modal = (
    <div className="rvm-overlay" onMouseDown={onClose}>
      <div className="rvm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rvm-header">
          <span className="rvm-title">
            {i18n.t("version_history.restore_modal.title")}
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
            <span className="rvm-warning-icon" aria-hidden="true">
              ⚠
            </span>
            <span>{i18n.t("version_history.restore_warning")}</span>
          </div>

          <div className="rvm-details">
            <p className="rvm-details-heading">
              {i18n.t("version_history.restore_modal.version_details")}
            </p>
            <p className="rvm-detail-row">
              <strong>{i18n.t("version_history.restore_modal.date")}:</strong>{" "}
              {formatDetailDate(entry.PublishDate)}
            </p>
            <p className="rvm-detail-row">
              <strong>
                {i18n.t("version_history.restore_modal.publisher")}:
              </strong>{" "}
              {entry.PublishedBy}
            </p>
            <p className="rvm-detail-row">
              <strong>
                {i18n.t("version_history.restore_modal.version")}:
              </strong>{" "}
              {entry.AppVersionName}
            </p>
          </div>

          <div className="rvm-disclaimer">
            <p className="rvm-disclaimer-label">
              {i18n.t("version_history.restore_modal.important")}:
            </p>
            <p className="rvm-disclaimer-text">
              {i18n.t("version_history.disclaimer_message")}
            </p>
          </div>
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
            onClick={handleRestore}
          >
            {loading
              ? i18n.t("version_history.restoring")
              : i18n.t("version_history.restore_modal.restore_version")}
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
