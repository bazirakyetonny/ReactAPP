import { useState, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import "./css/TrashModal.css";
import {
  getTrash,
  bulkRestoreTrash,
  bulkDeleteTrash,
  type TrashItem,
} from "../../services/trashApi";

type TabKey = "pages" | "versions";
type ConfirmAction = "restore" | "delete" | "emptyTrash";

interface TrashModalProps {
  onClose: () => void;
  onChanged: () => void;
}

function relativeTime(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return "Less than a minute ago";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  const d = Math.floor(diff / 86400);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
}

export function TrashModal({ onClose, onChanged }: TrashModalProps) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pages");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => { loadItems(); }, []);

  function loadItems() {
    setLoading(true);
    setError(null);
    getTrash()
      .then((data) => {
        setItems(data);
        setSelectedIds(new Set());
      })
      .catch(() => setError("Failed to load trash."))
      .finally(() => setLoading(false));
  }

  const tabItems = useMemo(() => {
    const base = items.filter((i) =>
      activeTab === "pages" ? i.Type === "Page" : i.Type !== "Page"
    );
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((i) => {
      const name = activeTab === "pages" ? i.Page : i.Version;
      return (name ?? "").toLowerCase().includes(q);
    });
  }, [items, activeTab, search]);

  const selectedTabItems = tabItems.filter((i) => selectedIds.has(i.TrashId));
  const hasSelection = selectedTabItems.length > 0;

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    setActing(true);
    setError(null);
    try {
      const targets =
        confirmAction === "emptyTrash" ? tabItems : selectedTabItems;
      if (confirmAction === "restore") {
        await bulkRestoreTrash(targets);
      } else {
        await bulkDeleteTrash(targets);
      }
      onChanged();
      loadItems();
      setConfirmAction(null);
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActing(false);
    }
  }

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    setSearch("");
    setSelectedIds(new Set());
    setConfirmAction(null);
    setError(null);
  }

  const confirmLabels: Record<ConfirmAction, string> = {
    restore: `Restore ${selectedTabItems.length} item${selectedTabItems.length !== 1 ? "s" : ""}?`,
    delete: `Permanently delete ${selectedTabItems.length} item${selectedTabItems.length !== 1 ? "s" : ""}? This cannot be undone.`,
    emptyTrash: `Permanently delete all ${tabItems.length} item${tabItems.length !== 1 ? "s" : ""} on this tab? This cannot be undone.`,
  };

  const modal = (
    <div className="tm-overlay" onMouseDown={onClose}>
      <div className="tm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="tm-header">
          <div className="tm-title-row">
            <span className="tm-title">Trash</span>
            <button
              className="tm-close"
              type="button"
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="tm-controls">
            <div className="tm-search-wrap">
              <SearchIcon />
              <input
                className="tm-search"
                type="text"
                placeholder="Search Trash"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {hasSelection ? (
              <div className="tm-action-btns">
                <button
                  className="tm-btn-restore"
                  type="button"
                  disabled={acting}
                  onClick={() => setConfirmAction("restore")}
                >
                  Restore
                </button>
                <button
                  className="tm-btn-danger"
                  type="button"
                  disabled={acting}
                  onClick={() => setConfirmAction("delete")}
                >
                  Delete Forever
                </button>
              </div>
            ) : (
              <button
                className="tm-btn-empty"
                type="button"
                disabled={tabItems.length === 0 || acting}
                onClick={() => setConfirmAction("emptyTrash")}
              >
                <TrashIconSm /> Empty Trash
              </button>
            )}
          </div>
          <div className="tm-tabs" role="tablist">
            <button
              className={`tm-tab${activeTab === "pages" ? " tm-tab--active" : ""}`}
              role="tab"
              type="button"
              onClick={() => switchTab("pages")}
            >
              Pages
            </button>
            <button
              className={`tm-tab${activeTab === "versions" ? " tm-tab--active" : ""}`}
              role="tab"
              type="button"
              onClick={() => switchTab("versions")}
            >
              Versions
            </button>
          </div>
        </div>

        <div className="tm-body">
          {loading && <div className="tm-status">Loading…</div>}
          {!loading && error && !confirmAction && (
            <div className="tm-error-msg">{error}</div>
          )}
          {!loading && !error && tabItems.length === 0 && (
            <div className="tm-status">
              No deleted {activeTab === "pages" ? "pages" : "versions"}
            </div>
          )}
          {!loading && tabItems.length > 0 && (
            <ul className="tm-list">
              {tabItems.map((item) => {
                const name = activeTab === "pages" ? item.Page : item.Version;
                const checked = selectedIds.has(item.TrashId);
                return (
                  <li
                    key={item.TrashId}
                    className={`tm-item${checked ? " tm-item--checked" : ""}`}
                  >
                    <label className="tm-item-label">
                      <input
                        type="checkbox"
                        className="tm-checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.TrashId)}
                      />
                      <span className="tm-item-name">{name}</span>
                    </label>
                    <span className="tm-item-time">
                      {relativeTime(item.DeletedAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {confirmAction && (
          <div className="tm-confirm">
            {error && <div className="tm-error-msg">{error}</div>}
            <p className="tm-confirm-msg">{confirmLabels[confirmAction]}</p>
            <div className="tm-confirm-btns">
              <button
                className="tm-btn-secondary"
                type="button"
                disabled={acting}
                onClick={() => {
                  setConfirmAction(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                className={
                  confirmAction === "restore" ? "tm-btn-primary" : "tm-btn-danger"
                }
                type="button"
                disabled={acting}
                onClick={handleConfirm}
              >
                {acting
                  ? "…"
                  : confirmAction === "restore"
                  ? "Restore"
                  : "Delete Forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body
  );
}

function SearchIcon() {
  return (
    <svg
      className="tm-search-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function TrashIconSm() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
