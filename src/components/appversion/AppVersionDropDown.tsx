import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./css/AppVersionDropDown.css";
import type { AppVersion } from "../../types";

interface AppVersionDropDownProps {
  versionName?: string;
  appVersions?: AppVersion[];
  selectedVersionId?: string;
  onVersionSelect?: (id: string) => void;
  onNewVersion?: () => void;
  onNewTemplate?: () => void;
  onDuplicate?: (id: string) => void;
  onRename?: (id: string) => void;
  onUpdateTranslations?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  disabled?: boolean;
}

function ChevronDownIcon() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L7 6L1 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 2V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 7H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationPinIcon() {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 1C4.24 1 2 3.24 2 6C2 9.75 7 15 7 15C7 15 12 9.75 12 6C12 3.24 9.76 1 7 1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function AppVersionDropDown({
  versionName,
  appVersions = [],
  selectedVersionId,
  onVersionSelect,
  onNewVersion,
  onNewTemplate,
  onDuplicate,
  onRename,
  onUpdateTranslations,
  onMoveToTrash,
  disabled = false,
}: AppVersionDropDownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Submenu: JS-driven so it escapes the overflow-y:auto scroll container
  const [subVersionId, setSubVersionId] = useState<string | null>(null);
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showSub(id: string, rowEl: HTMLElement) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = rowEl.getBoundingClientRect();
    setSubVersionId(id);
    setSubPos({ top: rect.top - 4, left: rect.right + 2 });
  }

  function scheduleSubHide() {
    hideTimer.current = setTimeout(() => {
      setSubVersionId(null);
      setSubPos(null);
    }, 100);
  }

  function cancelSubHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  // Clear submenu when main menu closes
  useEffect(() => {
    if (!open) {
      setSubVersionId(null);
      setSubPos(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !wrapRef.current?.contains(target) &&
        !subMenuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="vd-wrap" ref={wrapRef}>
      <button
        className="navbar-dropdown"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
      >
        {versionName ?? "My version"}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="vd-menu" role="listbox">
          <button
            className="vd-item vd-new"
            type="button"
            onClick={() => {
              onNewVersion?.();
              setOpen(false);
            }}
          >
            <PlusIcon />
            New Version
          </button>

          <button
            className="vd-item vd-new"
            type="button"
            onClick={() => {
              onNewTemplate?.();
              setOpen(false);
            }}
          >
            <PlusIcon />
            New Template
          </button>

          <div className="vd-sep" role="separator" />

          <div className="vd-versions-list">
            {appVersions.map((v) => {
              const isActive = v.AppVersionId === selectedVersionId;
              return (
                <div
                  key={v.AppVersionId}
                  className="vd-item-wrap"
                  onMouseEnter={(e) => showSub(v.AppVersionId, e.currentTarget)}
                  onMouseLeave={scheduleSubHide}
                >
                  <div
                    className={`vd-item-row${isActive ? " vd-item-row--active" : ""}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onVersionSelect?.(v.AppVersionId);
                      setOpen(false);
                    }}
                  >
                    <LocationPinIcon />
                    <span className="vd-item-label">{v.AppVersionName}</span>
                    <ChevronRightIcon />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submenu portal — fixed position, escapes overflow container */}
          {subVersionId && subPos &&
            ReactDOM.createPortal(
              (() => {
                const v = appVersions.find((a) => a.AppVersionId === subVersionId);
                if (!v) return null;
                return (
                  <div
                    className="vd-submenu-fixed"
                    ref={subMenuRef}
                    style={{ top: subPos.top, left: subPos.left }}
                    onMouseEnter={cancelSubHide}
                    onMouseLeave={scheduleSubHide}
                  >
                    <button className="vd-sub-item" type="button"
                      onClick={(e) => { e.stopPropagation(); onDuplicate?.(v.AppVersionId); setOpen(false); }}>
                      Duplicate
                    </button>
                    <button className="vd-sub-item" type="button"
                      onClick={(e) => { e.stopPropagation(); onRename?.(v.AppVersionId); setOpen(false); }}>
                      Rename
                    </button>
                    <button className="vd-sub-item" type="button"
                      onClick={(e) => { e.stopPropagation(); onUpdateTranslations?.(v.AppVersionId); setOpen(false); }}>
                      Update Translations
                    </button>
                    <button className="vd-sub-item vd-sub-item--danger" type="button"
                      onClick={(e) => { e.stopPropagation(); onMoveToTrash?.(v.AppVersionId); setOpen(false); }}>
                      Move To Trash
                    </button>
                  </div>
                );
              })(),
              document.getElementById("root") ?? document.body,
            )
          }
        </div>
      )}
    </div>
  );
}
