import { useEffect, useState } from "react";
import { CheckboxSpan } from '../widgets/CheckboxSpan';
import ReactDOM from "react-dom";
import "./css/PublishModal.css";
import { getLocation } from "../../services/locationApi";
import { publishVersion } from "../../services/publishApi";
import { translateAppVersionBeforePublish } from "../../services/translationApi";
import type { SDTAppVersion } from "../../services/appVersionsApi";

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
      const version = appVersions.find(
        (v) => v.AppVersionId === currentVersionId,
      );
      let langs: string[] = [];
      try {
        const parsed = JSON.parse(version?.AppVersionMultiLanguages ?? "[]");
        langs = Array.isArray(parsed) ? parsed : [];
      } catch {
        // ignore malformed language list
      }
      if (version && langs.length) {
        try {
          await translateAppVersionBeforePublish(
            currentVersionId,
            version.AppVersionLanguage,
            langs,
          );
        } catch {
          // a translation failure should not block publishing
        }
      }
      await publishVersion(currentVersionId, notify);
      onPublished();
    } catch {
      setError("Failed to publish. Please try again.");
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
          <span className="pm-title">Publish</span>
          <button
            className="pm-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="pm-body">
          <p className="pm-info-row">
            <strong>Current published version:</strong>{" "}
            {publishedVersionName ?? "—"}
          </p>
          <p className="pm-info-row">
            <strong>Version being published:</strong> {currentVersionName}
          </p>
          <p className="pm-description">
            Are you sure you want to publish? Publishing this version will
            replace the current version for all users.
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

          <div className="pm-checkbox-row" onClick={() => setNotify(!notify)}>
            <CheckboxSpan checked={notify} onChange={() => setNotify(!notify)} ariaLabel="Notify users" />
            <span className="pm-checkbox-label">
              Send &lsquo;A new version is available&rsquo; message to users.
            </span>
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
            Cancel
          </button>
          {issueCount > 0 && (
            <button
              className="pm-btn-primary"
              type="button"
              onClick={handleFixIssues}
              disabled={loading}
            >
              Fix Issues
            </button>
          )}
          <button
            className="pm-btn-primary"
            type="button"
            onClick={handlePublish}
            disabled={loading}
          >
            {loading ? "Publishing…" : "Publish"}
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
