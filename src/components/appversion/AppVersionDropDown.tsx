import { useEffect, useRef, useState } from "react";
import "./css/AppVersionDropDown.css";
import type { AppVersion } from "../../types";

interface AppVersionDropDownProps {
  versionName?: string;
  appVersions?: AppVersion[];
  selectedVersionId?: string;
  onVersionSelect?: (id: string) => void;
  onNewVersion?: () => void;
  onDuplicate?: (id: string) => void;
  onRename?: (id: string) => void;
  onUpdateTranslations?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
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
  onDuplicate,
  onRename,
  onUpdateTranslations,
  onMoveToTrash,
}: AppVersionDropDownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
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

          <div className="vd-sep" role="separator" />

          {appVersions.map((v) => {
            const isActive = v.AppVersionId === selectedVersionId;
            return (
              <div key={v.AppVersionId} className="vd-item-wrap">
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

                <div className="vd-submenu">
                  <button
                    className="vd-sub-item"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(v.AppVersionId);
                      setOpen(false);
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    className="vd-sub-item"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename?.(v.AppVersionId);
                      setOpen(false);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="vd-sub-item"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateTranslations?.(v.AppVersionId);
                      setOpen(false);
                    }}
                  >
                    Update Translations
                  </button>
                  <button
                    className="vd-sub-item vd-sub-item--danger"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToTrash?.(v.AppVersionId);
                      setOpen(false);
                    }}
                  >
                    Move To Trash
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
