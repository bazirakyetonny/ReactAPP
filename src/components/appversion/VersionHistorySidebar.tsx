import { useEffect, useRef, useState } from "react";
import type { AppVersionHistoryEntry } from "../../services/appVersionsApi";
import {
  copyHistoryVersion,
  getVersionHistory,
  restoreHistoryVersion,
} from "../../services/appVersionsApi";
import { RestoreVersionModal } from "./RestoreVersionModal";
import { CopyVersionModal } from "./CopyVersionModal";
import "./css/VersionHistorySidebar.css";
import { i18n } from "../../i18n/i18n";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHistoryDate(iso: string): string {
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

// ── Entry dropdown menu ───────────────────────────────────────────────────────

interface EntryMenuProps {
  item: AppVersionHistoryEntry;
  appVersionId: string;
  onRestored?: () => void;
  onClose: () => void;
}

function EntryMenu({
  item,
  appVersionId,
  onRestored,
  onClose,
}: EntryMenuProps) {
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  async function handleConfirmRestore() {
    await restoreHistoryVersion(appVersionId, item.AppVersionNumber);
    onRestored?.();
  }

  return (
    <>
      <div className="vhs-dropdown" ref={ref} role="menu" onClick={(e) => e.stopPropagation()}>
        <button
          className="vhs-dropdown-item"
          type="button"
          role="menuitem"
          onClick={() => setShowRestoreModal(true)}
        >
          {i18n.t("version_history.restoreThisVersion")}
        </button>
        <button
          className="vhs-dropdown-item"
          type="button"
          role="menuitem"
          onClick={() => setShowCopyModal(true)}
        >
          {i18n.t("version_history.makeACopy")}
        </button>
      </div>
      {showRestoreModal && (
        <RestoreVersionModal
          date={item.PublishDate}
          publisher={item.PublishedBy}
          versionName={item.AppVersionName}
          onClose={() => { setShowRestoreModal(false); onClose(); }}
          onConfirm={handleConfirmRestore}
        />
      )}
      {showCopyModal && (
        <CopyVersionModal
          appVersionId={appVersionId}
          historyNumber={item.AppVersionNumber}
          defaultName={`${item.AppVersionName} Copy`}
          onClose={() => { setShowCopyModal(false); onClose(); }}
        />
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface VersionHistorySidebarProps {
  appVersionId?: string;
  onClose?: () => void;
  onRestored?: () => void;
  onPreviewVersion?: (item: AppVersionHistoryEntry) => void;
  previewingNumber?: number | null;
  loadingPreview?: boolean;
}

export function VersionHistorySidebar({
  appVersionId,
  onClose,
  onRestored,
  onPreviewVersion,
  previewingNumber,
  loadingPreview,
}: VersionHistorySidebarProps) {
  const [items, setItems] = useState<AppVersionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [restoringIndex, setRestoringIndex] = useState<number | null>(null);

  function handleCardClick(item: AppVersionHistoryEntry) {
    if (restoringIndex !== null || loadingPreview) return;
    if (item.AppVersionNumber === previewingNumber) return;
    onPreviewVersion?.(item);
  }

  useEffect(() => {
    if (!appVersionId) return;
    setLoading(true);
    setError(null);
    getVersionHistory(appVersionId)
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => b.AppVersionNumber - a.AppVersionNumber,
        );
        setItems(sorted);
      })
      .catch(() => setError(i18n.t("version_history.load_failed")))
      .finally(() => setLoading(false));
  }, [appVersionId]);

  return (
    <aside className="vhs-panel" aria-label={i18n.t("version_history.versionHistory")}>
      <div className="vhs-header">
        <h2 className="vhs-title">{i18n.t("version_history.versionHistory")}</h2>
        <button
          className="vhs-close-btn"
          type="button"
          title={i18n.t("version_history.close")}
          onClick={onClose}
          aria-label={i18n.t("version_history.close")}
        >
          ×
        </button>
      </div>
      <hr className="vhs-divider" />

      <div className="vhs-list">
        {loading && (
          <div className="vhs-state">
            <div className="vhs-spinner" aria-hidden="true" />
            <span>{i18n.t("version_history.loading_history")}</span>
          </div>
        )}

        {!loading && error && <div className="vhs-state">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="vhs-state">{i18n.t("version_history.no_version_history")}</div>
        )}

        {!loading &&
          !error &&
          items.map((item, idx) => {
            const isSelected = item.AppVersionNumber === previewingNumber;
            const isLoadingThis = isSelected && loadingPreview;
            return (
              <div
                className={`vhs-item${restoringIndex === idx ? " vhs-item--restoring" : ""}${isSelected ? " vhs-item--selected" : ""}${isLoadingThis ? " vhs-item--loading" : ""}`}
                key={item.AppVersionNumber}
                role="button"
                tabIndex={0}
                title={i18n.t("version_history.preview_version")}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => e.key === "Enter" && handleCardClick(item)}
              >
                <div className="vhs-item-row">
                  {isLoadingThis
                    ? <div className="vhs-spinner vhs-spinner--inline" aria-hidden="true" />
                    : <i className="fa fa-angle-right vhs-chevron" aria-hidden="true" />}
                  <span className="vhs-date">
                    {isLoadingThis ? i18n.t("version_history.loading_version") : formatHistoryDate(item.PublishDate)}
                  </span>
                  <button
                    className="vhs-dots-btn"
                    type="button"
                    title={i18n.t("version_history.options")}
                    aria-label={i18n.t("version_history.options")}
                    aria-haspopup="menu"
                    aria-expanded={openMenuIndex === idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuIndex((prev) => (prev === idx ? null : idx));
                    }}
                  >
                    ⋮
                  </button>
                </div>

                <div className="vhs-publisher">
                  <span className="vhs-publisher-dot" aria-hidden="true" />
                  <span>{item.PublishedBy}</span>
                </div>

                {openMenuIndex === idx && appVersionId && (
                  <EntryMenu
                    item={item}
                    appVersionId={appVersionId}
                    onRestored={onRestored}
                    onClose={() => setOpenMenuIndex(null)}
                  />
                )}
              </div>
            );
          })}
      </div>
    </aside>
  );
}
