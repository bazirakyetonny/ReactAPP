import { useEffect, useRef, useState } from "react";
import { dataStore } from "../../data/datastore";
import comfortaLogo from "../../assets/ComfortaLogo1.png";

function ProfileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="18"
      viewBox="0 0 19.422 21.363"
    >
      <path
        id="Path_1327"
        data-name="Path 1327"
        d="M15.711,5a6.8,6.8,0,0,0-3.793,12.442A9.739,9.739,0,0,0,6,26.364H7.942a7.769,7.769,0,1,1,15.537,0h1.942A9.739,9.739,0,0,0,19.5,17.442,6.8,6.8,0,0,0,15.711,5Zm0,1.942A4.855,4.855,0,1,1,10.855,11.8,4.841,4.841,0,0,1,15.711,6.942Z"
        transform="translate(-6 -5)"
        fill="#fff"
      ></path>
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      data-name="Group 14"
      width="40"
      height="40"
      viewBox="0 0 47 47"
    >
      <g
        id="Ellipse_6"
        data-name="Ellipse 6"
        fill="none"
        stroke="#262626"
        stroke-width="1"
      >
        <circle cx="23.5" cy="23.5" r="23.5" stroke="none"></circle>
        <circle cx="23.5" cy="23.5" r="23" fill="none"></circle>
      </g>
      <path
        id="Icon_ionic-ios-arrow-round-up"
        data-name="Icon ionic-ios-arrow-round-up"
        d="M13.242,7.334a.919.919,0,0,1-1.294.007L7.667,3.073V19.336a.914.914,0,0,1-1.828,0V3.073L1.557,7.348A.925.925,0,0,1,.263,7.341.91.91,0,0,1,.27,6.054L6.106.26h0A1.026,1.026,0,0,1,6.394.07.872.872,0,0,1,6.746,0a.916.916,0,0,1,.64.26l5.836,5.794A.9.9,0,0,1,13.242,7.334Z"
        transform="translate(13 30.501) rotate(-90)"
        fill="#262626"
      ></path>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 2l2 2L3.5 11.5H1.5v-2L9 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneAppHeader() {
  const logo: string | undefined = dataStore.get("OrganisationLogo");
  return (
    <div className="phone-app-header">
      <div className="phone-app-logo">
        <img
          src={logo || comfortaLogo}
          alt="Organisation logo"
          className="phone-app-logo-img"
        />
      </div>
      <div className="phone-app-profile">
        <ProfileIcon />
      </div>
    </div>
  );
}

export function PhoneLinkedHeader({
  pageName,
  isNew,
  onBack,
  onRename,
  hideBack = false,
  editOnClick = false,
}: {
  pageName: string;
  isNew?: boolean;
  onBack: () => void;
  onRename?: (name: string) => void;
  /** Hide the back button (e.g. home page in translation sidebar) */
  hideBack?: boolean;
  /** Activate edit mode on single click instead of double-click */
  editOnClick?: boolean;
}) {
  const [editing, setEditing] = useState(isNew ?? false);
  const [draft, setDraft] = useState(isNew ? "" : pageName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing && !isNew) setDraft(pageName);
  }, [pageName, editing, isNew]);
  useEffect(() => {
    if (editing) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [editing]);

  function commit() {
    const name = draft.trim();
    if (isNew) {
      if (name) onRename?.(name);
      // empty name: stay in edit mode, don't cancel
    } else {
      if (name && name !== pageName) onRename?.(name);
      else setDraft(pageName);
      setEditing(false);
    }
  }

  return (
    <div className="phone-app-header phone-linked-header">
      {!hideBack && (
        <button
          className="phone-back-btn"
          type="button"
          aria-label="Go back"
          onClick={onBack}
          onMouseDown={isNew ? (e) => e.preventDefault() : undefined}
        >
          <BackArrowIcon />
        </button>
      )}

      {editing ? (
        <input
          ref={inputRef}
          className="phone-linked-page-name-input"
          value={draft}
          placeholder={isNew ? "Page name…" : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (isNew) {
              if (draft.trim()) commit();
              // empty name: keep edit mode, user must type something
            } else {
              commit();
            }
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              if (isNew) {
                onBack();
              } else {
                setDraft(pageName);
                setEditing(false);
              }
            }
          }}
        />
      ) : (
        <div
          className={`phone-linked-page-name-wrap${onRename ? " phone-linked-page-name-wrap--editable" : ""}`}
          onDoubleClick={
            !editOnClick ? () => onRename && setEditing(true) : undefined
          }
          onClick={editOnClick ? () => onRename && setEditing(true) : undefined}
        >
          <span className="phone-linked-page-name">{draft.toUpperCase()}</span>
          {onRename && !editOnClick && (
            <button
              className="phone-linked-edit-btn"
              type="button"
              aria-label="Rename page"
              onClick={() => setEditing(true)}
            >
              <PencilIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
