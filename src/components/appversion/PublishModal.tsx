import { useEffect, useId, useState } from "react";
import ReactDOM from "react-dom";
import "./css/PublishModal.css";
import { getLocation } from "../../services/locationApi";
import { publishVersion } from "../../services/publishApi";
import type { SDTAppVersion } from "../../services/appVersionsApi";
import { i18n } from "../../i18n/i18n";

interface PublishModalProps {
  currentVersionId: string;
  currentVersionName: string;
  appVersions: SDTAppVersion[];
  issueCount: number;
  onPublished: () => void;
  onClose: () => void;
  onFixIssues?: () => void;
}

export function PublishModal({
  currentVersionId,
  currentVersionName,
  appVersions,
  issueCount,
  onPublished,
  onClose,
  onFixIssues,
}: PublishModalProps) {
  const checkboxId = useId();
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedVersionName, setPublishedVersionName] = useState<
    string | null
  >(null);

  useEffect(() => {
    getLocation()
      .then((loc) => {
        const match = appVersions.find(
          (v) => v.AppVersionId === loc.PublishedActiveAppVersionId,
        );
        setPublishedVersionName(match?.AppVersionName ?? null);
      })
      .catch(() => {
        setPublishedVersionName(null);
      });
  }, [appVersions]);

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      await publishVersion(currentVersionId, notify);
      onPublished();
    } catch {
      setError(i18n.t("navbar.publish.publish_failed"));
      setLoading(false);
    }
  }

  function handleFixIssues() {
    onClose();
    onFixIssues?.();
  }

  const modal = (
    <div className="pm-overlay" onMouseDown={onClose}>
      <div className="pm-modal" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-header">
          <span className="pm-title">{i18n.t("navbar.publish.label")}</span>
          <button
            className="pm-close"
            type="button"
            aria-label={i18n.t("navbar.share.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="pm-body">
          <p className="pm-info-row">
            <strong>{i18n.t("navbar.publish.current_version")}</strong>{" "}
            {publishedVersionName ?? "—"}
          </p>
          <p className="pm-info-row">
            <strong>{i18n.t("navbar.publish.new_version")}</strong> {currentVersionName}
          </p>
          <p className="pm-description">
            {i18n.t("navbar.publish.modal_description")}
          </p>

          {issueCount > 0 && (
            <div className="pm-warning">
              <span className="pm-warning-icon">⚠</span>
              <span>
                {issueCount} Issue{issueCount !== 1 ? "s" : ""}: {issueCount}{" "}
                Invalid URL{issueCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="pm-checkbox-row">
            <input
              id={checkboxId}
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            <label className="pm-checkbox-label" htmlFor={checkboxId}>
              {i18n.t("navbar.publish.notify_residents")}
            </label>
          </div>

          {error && <div className="pm-error">{error}</div>}
        </div>

        {/* Footer */}
        <div className="pm-footer">
          <button
            className="pm-btn-secondary"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            {i18n.t("navbar.publish.modal_cancel")}
          </button>
          {issueCount > 0 && (
            <button
              className="pm-btn-primary"
              type="button"
              onClick={handleFixIssues}
              disabled={loading}
            >
              {i18n.t("navbar.publish.fix_issues")}
            </button>
          )}
          <button
            className="pm-btn-primary"
            type="button"
            onClick={handlePublish}
            disabled={loading}
          >
            {loading ? i18n.t("navbar.publish.publishing") : i18n.t("navbar.publish.modal_confirm")}
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
