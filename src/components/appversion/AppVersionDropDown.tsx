import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./css/AppVersionDropDown.css";
import type { AppVersion, CategoryTemplates } from "../../types";
import { dataStore } from "../../data/datastore";

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
  onUpdateDescription?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  onCategoryChange?: (versionId: string, categoryId: string) => void;
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

function PublishedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14.231"
      height="16.53"
      viewBox="0 0 14.231 16.53"
      aria-hidden="true"
    >
      <path
        d="M2.817.041A2.141,2.141,0,0,0,1.112,1.768c-.015.1-.025.8-.025,1.856a7.169,7.169,0,0,0,.049,1.81.491.491,0,0,0,.226.26.681.681,0,0,0,.484.055.706.706,0,0,0,.334-.3c.052-.1.052-.109.065-1.837l.012-1.738.075-.157a.954.954,0,0,1,.656-.528c.091-.019.956-.027,2.964-.027H8.787V2.526c0,1.495,0,1.549.146,1.918a2.2,2.2,0,0,0,1.181,1.181c.37.142.424.146,1.918.146H13.4v4.381c0,3.149-.008,4.416-.027,4.509a.834.834,0,0,1-.234.435,1.029,1.029,0,0,1-.4.267c-.061.022-1.4.032-5.657.041l-5.577.012-.1.052a.571.571,0,0,0-.055,1l.1.066H7.132c5.625,0,5.677,0,5.852-.049a2.141,2.141,0,0,0,1.505-1.508l.055-.193V4.263l-.065-.109C14.4,4.019,10.5.121,10.381.059A29.1,29.1,0,0,0,6.651.01c-3.052,0-3.676,0-3.833.031m9.356,4.592a4.981,4.981,0,0,1-1.662-.09,1.022,1.022,0,0,1-.408-.353c-.157-.238-.156-.221-.156-1.664v-1.3l1.7,1.7,1.7,1.7-1.177.007m-6.9,3.9A16.439,16.439,0,0,0,3.791,9.958L2.427,11.324,1.8,10.7c-.671-.668-.684-.677-.925-.678a.586.586,0,0,0-.56.551c0,.251-.008.24.915,1.171a8.631,8.631,0,0,0,.963.913.62.62,0,0,0,.468,0c.078-.035.513-.457,1.721-1.669C5.271,10.1,6.013,9.339,6.031,9.3a.731.731,0,0,0,.046-.2.53.53,0,0,0-.153-.44.515.515,0,0,0-.383-.176.423.423,0,0,0-.267.049"
        transform="translate(-0.314 -0.009)"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function UnpublishedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14.527"
      height="16.53"
      viewBox="0 0 14.527 16.53"
      aria-hidden="true"
    >
      <path
        d="M3.164.042a2.1,2.1,0,0,0-1.62,1.6A6.6,6.6,0,0,0,1.49,3.217c0,1.5-.007,1.432.165,1.614A.544.544,0,0,0,2.136,5a.556.556,0,0,0,.41-.309l.057-.12.012-1.351.012-1.351.066-.143a1.049,1.049,0,0,1,.474-.477l.163-.08,2.8-.007,2.8-.007V2.475c0,1.471.01,1.592.153,1.964a2.119,2.119,0,0,0,1.378,1.272,5.907,5.907,0,0,0,1.564.065l1.387.008-.007,4.433L13.4,14.65l-.063.155a.947.947,0,0,1-.513.53l-.151.065-.932.012c-1.028.014-1,.009-1.156.179a.606.606,0,0,0-.107.634.673.673,0,0,0,.286.289c.034.013.5.024,1.074.024h1.014l.2-.066a2.111,2.111,0,0,0,1.447-1.7c.017-.1.025-1.808.025-5.3a47.933,47.933,0,0,0-.049-5.267c-.038-.087-.484-.563-1.967-2.1C11.414.972,10.553.1,10.5.069L10.4.015l-3.524,0c-2.958,0-3.554,0-3.714.032M13.343,4.613c0,.011-.574.016-1.277.012-1.272-.008-1.278-.008-1.416-.065a1.068,1.068,0,0,1-.481-.46l-.083-.158-.007-1.363-.007-1.364L11.708,2.9c.9.928,1.635,1.7,1.635,1.709M4.686,6.183A4.914,4.914,0,0,0,1.865,7.325a6.962,6.962,0,0,0-.854.913,5.372,5.372,0,0,0-.985,3.651,5.438,5.438,0,0,0,1.1,2.748,5.583,5.583,0,0,0,1.252,1.144,5.214,5.214,0,0,0,1.863.72,7.847,7.847,0,0,0,1.574,0,4.969,4.969,0,0,0,2.861-1.558,5.305,5.305,0,0,0,1.319-2.706,7.931,7.931,0,0,0,.035-1.469,5.209,5.209,0,0,0-2.847-4.1,4.889,4.889,0,0,0-2.494-.483m.926,1.188A3.8,3.8,0,0,1,7.8,8.524a4.117,4.117,0,0,1,.775,4.525,3.852,3.852,0,0,1-5.593,1.76A4.422,4.422,0,0,1,1.909,13.8a4.237,4.237,0,0,1-.736-1.784A5.6,5.6,0,0,1,1.16,10.8,3.993,3.993,0,0,1,4.435,7.37a4.977,4.977,0,0,1,1.177,0m-.835,1.94a.613.613,0,0,0-.27.3,4.386,4.386,0,0,0-.039,1.063c0,1.084,0,1.074.165,1.244.083.085,1.289.874,1.407.919a.6.6,0,0,0,.556-.119.712.712,0,0,0,.184-.43.657.657,0,0,0-.184-.423q-.263-.185-.534-.357l-.465-.3-.007-.767c-.007-.73-.01-.772-.06-.868a.585.585,0,0,0-.28-.274.642.642,0,0,0-.472.014"
        transform="translate(-0.001 -0.01)"
        fill="currentColor"
        fillRule="evenodd"
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
  onUpdateDescription,
  onMoveToTrash,
  onCategoryChange,
  disabled = false,
}: AppVersionDropDownProps) {
  const userRoles: string[] = dataStore.get("UserRoles") ?? [];
  const canCreateVersion =
    userRoles.includes("Receptionist") ||
    userRoles.includes("Organisation Manager");
  const canCreateTemplate = userRoles.includes("Comforta Admin");
  const templatesCollection: CategoryTemplates[] =
    dataStore.get("TemplatesCollection") ?? [];

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Submenu: JS-driven so it escapes the overflow-y:auto scroll container
  const [subVersionId, setSubVersionId] = useState<string | null>(null);
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [catSubVersionId, setCatSubVersionId] = useState<string | null>(null);
  const [catSubPos, setCatSubPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const catSubRef = useRef<HTMLDivElement>(null);
  const catHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function showCatSub(id: string, rowEl: HTMLElement) {
    if (catHideTimer.current) clearTimeout(catHideTimer.current);
    const rect = rowEl.getBoundingClientRect();
    setCatSubVersionId(id);
    setCatSubPos({ top: rect.top - 4, left: rect.right + 2 });
  }

  function scheduleCatSubHide() {
    catHideTimer.current = setTimeout(() => {
      setCatSubVersionId(null);
      setCatSubPos(null);
    }, 100);
  }

  function cancelCatSubHide() {
    if (catHideTimer.current) clearTimeout(catHideTimer.current);
  }

  // Clear both submenus when main menu closes
  useEffect(() => {
    if (!open) {
      setSubVersionId(null);
      setSubPos(null);
      setCatSubVersionId(null);
      setCatSubPos(null);
    }
  }, [open]);

  // Clear cat submenu when version submenu changes
  useEffect(() => {
    if (!subVersionId) {
      setCatSubVersionId(null);
      setCatSubPos(null);
    }
  }, [subVersionId]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !wrapRef.current?.contains(target) &&
        !subMenuRef.current?.contains(target) &&
        !catSubRef.current?.contains(target)
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
        <span className={`vd-chevron${open ? " vd-chevron--open" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div className="vd-menu" role="listbox">
          {canCreateVersion && (
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
          )}

          {canCreateTemplate && (
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
          )}

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
                    {canCreateTemplate ? (
                      v.IsPublishedTemplate ? (
                        <PublishedIcon />
                      ) : (
                        <UnpublishedIcon />
                      )
                    ) : (
                      <LocationPinIcon />
                    )}
                    <span className="vd-item-label">{v.AppVersionName}</span>
                    <ChevronRightIcon />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submenu portal — fixed position, escapes overflow container */}
          {subVersionId &&
            subPos &&
            ReactDOM.createPortal(
              (() => {
                const v = appVersions.find(
                  (a) => a.AppVersionId === subVersionId,
                );
                if (!v) return null;
                return (
                  <div
                    className="vd-submenu-fixed"
                    ref={subMenuRef}
                    style={{ top: subPos.top, left: subPos.left }}
                    onMouseEnter={cancelSubHide}
                    onMouseLeave={scheduleSubHide}
                  >
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
                    {canCreateTemplate ? (
                      <button
                        className="vd-sub-item"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateDescription?.(v.AppVersionId);
                          setOpen(false);
                        }}
                      >
                        Description
                      </button>
                    ) : (
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
                    )}
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
                    {canCreateTemplate && (
                      <button
                        className="vd-sub-item vd-sub-item--has-sub"
                        type="button"
                        onMouseEnter={(e) => {
                          cancelSubHide();
                          showCatSub(v.AppVersionId, e.currentTarget);
                        }}
                        onMouseLeave={scheduleCatSubHide}
                      >
                        <span>
                          Category [{v.TemplateCategoryName || "None"}]
                        </span>
                        <ChevronRightIcon />
                      </button>
                    )}
                  </div>
                );
              })(),
              document.getElementById("root") ?? document.body,
            )}

          {catSubVersionId &&
            catSubPos &&
            ReactDOM.createPortal(
              (() => {
                const cv = appVersions.find(
                  (a) => a.AppVersionId === catSubVersionId,
                );
                if (!cv) return null;
                const otherCats = templatesCollection.filter(
                  (c) => c.TemplateCategoryId !== cv.TemplateCategoryId,
                );
                return (
                  <div
                    className="vd-submenu-fixed"
                    ref={catSubRef}
                    style={{ top: catSubPos.top, left: catSubPos.left }}
                    onMouseEnter={() => {
                      cancelSubHide();
                      cancelCatSubHide();
                    }}
                    onMouseLeave={scheduleCatSubHide}
                  >
                    {otherCats.length === 0 ? (
                      <span className="vd-sub-empty">No other categories</span>
                    ) : (
                      otherCats.map((cat) => (
                        <button
                          key={cat.TemplateCategoryId}
                          className="vd-sub-item"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCategoryChange?.(
                              cv.AppVersionId,
                              cat.TemplateCategoryId,
                            );
                            setOpen(false);
                          }}
                        >
                          {cat.TemplateCategoryName}
                        </button>
                      ))
                    )}
                  </div>
                );
              })(),
              document.getElementById("root") ?? document.body,
            )}
        </div>
      )}
    </div>
  );
}
