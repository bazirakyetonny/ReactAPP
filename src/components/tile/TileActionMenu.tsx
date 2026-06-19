import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { dataStore } from "../../data/datastore";
import { AddCtaModal } from "../phone/AddCtaModal";
import "./TileActionMenu.css";
import { i18n } from "../../i18n/i18n";

export type TileMenuAction =
  | { type: "new-page" }
  | {
      type: "existing-page";
      pageId: string;
      objectType: string;
      objectUrl: string;
    }
  | { type: "direct-link"; linkType: string; value: string; label: string }
  | {
      type: "form";
      formId: string;
      pageName: string;
      formReferenceName: string;
    }
  | { type: "copy-tile" };

interface TileActionMenuProps {
  tileId: string;
  pos: { x: number; y: number; containerBottom?: number };
  onAction: (tileId: string, action: TileMenuAction) => void;
  onClose: () => void;
}

const MODULE_TYPES = new Set([
  "BulletinBoard",
  "Calendar",
  "MyActivity",
  "Map",
]);

function pageObjectUrl(p: any): string {
  if (p.PageLinkStructure?.Url) return p.PageLinkStructure.Url;
  if (p.PageStructure) {
    try {
      const s = JSON.parse(p.PageStructure);
      if (s.Url) return s.Url;
    } catch {
      /* ignore */
    }
  }
  return "";
}

function findTilePageId(
  tileId: string,
  allPagesWithContent: any[],
): string | null {
  for (const page of allPagesWithContent) {
    let content: any[] = [];
    try {
      content = JSON.parse(page.PageStructure)?.InfoContent ?? [];
    } catch {
      continue;
    }
    for (const block of content) {
      if (block.InfoType !== "TileGrid") continue;
      for (const col of block.Columns ?? []) {
        if ((col.Tiles ?? []).some((t: any) => t.Id === tileId))
          return page.PageId;
      }
    }
  }
  return null;
}

function isPageConnected(pageId: string, allPagesWithContent: any[]): boolean {
  const homePage = allPagesWithContent.find(
    (p) => p.PageName?.toLowerCase() === "home",
  );
  if (!homePage) return false;
  if (pageId === homePage.PageId) return true;

  const validPageIds = new Set(allPagesWithContent.map((p) => p.PageId));

  function getLinkedPageIds(page: any): string[] {
    let content: any[] = [];
    try {
      content = JSON.parse(page.PageStructure)?.InfoContent ?? [];
    } catch {
      /* ignore */
    }
    const linked: string[] = [];
    for (const block of content) {
      if (block.InfoType === "TileGrid") {
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            const targetId = tile.Action?.ObjectId;
            if (targetId && validPageIds.has(targetId)) linked.push(targetId);
          }
        }
      } else if (block.InfoType === "Cta") {
        const targetId = block.CtaAttributes?.Action?.ObjectId;
        if (targetId && validPageIds.has(targetId)) linked.push(targetId);
      }
    }
    return linked;
  }

  const visited = new Set<string>([homePage.PageId]);
  const queue: any[] = [homePage];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const linkedId of getLinkedPageIds(current)) {
      if (linkedId === pageId) return true;
      if (!visited.has(linkedId)) {
        visited.add(linkedId);
        const linkedPage = allPagesWithContent.find(
          (p) => p.PageId === linkedId,
        );
        if (linkedPage) queue.push(linkedPage);
      }
    }
  }
  return false;
}

export function TileActionMenu({
  tileId,
  pos,
  onAction,
  onClose,
}: TileActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [directLinkType, setDirectLinkType] = useState<string | null>(null);
  const [subSearch, setSubSearch] = useState("");
  const directLinkTypeRef = useRef<string | null>(null);
  directLinkTypeRef.current = directLinkType;

  const [computedPos, setComputedPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const menuH = ref.current.offsetHeight;
    const menuW = ref.current.offsetWidth;
    const boundary = pos.containerBottom ?? window.innerHeight;
    const top = pos.y + menuH > boundary - 8
      ? Math.max(8, pos.y - menuH - 28)
      : pos.y;
    const left = Math.min(pos.x, window.innerWidth - menuW - 8);
    setComputedPos({ left, top });
  }, [pos.x, pos.y, pos.containerBottom]);

  const cv = dataStore.get("Current_Version");
  const pages: any[] = cv?.Pages ?? [];
  const allPagesWithContent: any[] = cv?.Page ?? [];
  const currentPageId = findTilePageId(tileId, allPagesWithContent);
  const infoPages = pages.filter(
    (p: any) =>
      !MODULE_TYPES.has(p.PageType) &&
      p.PageName?.toLowerCase() !== "home" &&
      p.PageId !== currentPageId,
  );
  const modulePages = pages.filter((p: any) => MODULE_TYPES.has(p.PageType));
  const forms: any[] = dataStore.get("SDT_DynamicFormsCollection") ?? [];

  const menuItems = [
    { id: "new-page", label: i18n.t("tile.information_page"), hasSub: false },
    {
      id: "existing-pages",
      label: i18n.t("tile.existing_pages"),
      hasSub: true,
    },
    { id: "direct-link", label: i18n.t("tile.call_to_action"), hasSub: true },
    { id: "forms", label: i18n.t("tile.forms"), hasSub: true },
    { id: "modules", label: i18n.t("tile.modules"), hasSub: true },
    // { id: "copy-tile", label: i18n.t("tile.copy_tile"), hasSub: false },
  ];

  const directLinkTypes = [
    { id: "Email", label: i18n.t("tile.email") },
    { id: "Phone", label: i18n.t("tile.phone") },
    { id: "Weblink", label: i18n.t("sidebar.action_list.dropdown.weblink") },
  ];

  const moduleLabels: Record<string, string> = {
    BulletinBoard: i18n.t("default.bulletinboard"),
    Calendar: i18n.t("default.calendar"),
    MyActivity: i18n.t("default.myactivity"),
    Map: i18n.t("default.map"),
  };

  useEffect(() => {
    setSubSearch("");
  }, [activeItem]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (directLinkTypeRef.current) return;
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (directLinkTypeRef.current) {
          setDirectLinkType(null);
          return;
        }
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const searchLower = subSearch.toLowerCase();
  const filteredInfoPages = infoPages.filter((p: any) =>
    (p.PageName ?? "").toLowerCase().includes(searchLower),
  );
  const filteredForms = forms.filter((f: any) =>
    (f.PageName ?? f.FormName ?? "").toLowerCase().includes(searchLower),
  );
  const filteredModulePages = modulePages.filter((p: any) =>
    (moduleLabels[p.PageType] ?? p.PageName ?? "")
      .toLowerCase()
      .includes(searchLower),
  );

  function act(action: TileMenuAction) {
    onAction(tileId, action);
    onClose();
  }

  return ReactDOM.createPortal(
    <>
      <div
        ref={ref}
        className="tam"
        style={computedPos
          ? { left: computedPos.left, top: computedPos.top }
          : { left: pos.x, top: pos.y, visibility: 'hidden' }
        }
      >
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="tam__item-wrap"
            onMouseEnter={() => setActiveItem(item.id)}
            onMouseLeave={() => setActiveItem(null)}
          >
            <button
              className={`tam__item${activeItem === item.id && item.hasSub ? " tam__item--expanded" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.id === "new-page") act({ type: "new-page" });
                if (item.id === "copy-tile") act({ type: "copy-tile" });
              }}
            >
              <span>{item.label}</span>
              {item.hasSub && <span className="tam__chevron">›</span>}
            </button>

            {/* Existing Pages submenu */}
            {item.id === "existing-pages" &&
              activeItem === "existing-pages" && (
                <div className="tam__sub">
                  <div className="tam__sub-search">
                    <span className="tam__sub-search-icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      autoFocus
                      className="tam__sub-search-input"
                      type="text"
                      placeholder={i18n.t("messages.menu.search")}
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredInfoPages.length === 0 ? (
                    <div className="tam__sub-empty">
                      {i18n.t("messages.menu.no_pages_available")}
                    </div>
                  ) : (
                    filteredInfoPages.map((p: any) => {
                      const connected = isPageConnected(
                        p.PageId,
                        allPagesWithContent,
                      );
                      return (
                        <button
                          key={p.PageId}
                          className="tam__sub-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            act({
                              type: "existing-page",
                              pageId: p.PageId,
                              objectType: p.PageType,
                              objectUrl: pageObjectUrl(p),
                            });
                          }}
                        >
                          <span style={{ textTransform: "capitalize" }}>
                            {p.PageName}
                          </span>
                          {!connected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14.574"
                              height="12.666"
                              viewBox="0 0 14.574 12.666"
                              style={{ flexShrink: 0 }}
                            >
                              <path
                                id="Path_1041"
                                data-name="Path 1041"
                                d="M8.823,3.029a1.153,1.153,0,0,0-1,.555L1.693,13.9a1.209,1.209,0,0,0,1,1.8H14.949a1.21,1.21,0,0,0,1-1.8L9.827,3.584A1.153,1.153,0,0,0,8.823,3.029Zm0,1.6,5.736,9.657H3.087Zm-.7,2.609v3.524H9.519V7.237Zm0,4.934v1.41H9.519v-1.41Z"
                                transform="translate(-1.536 -3.029)"
                                fill="#bb2e2e"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

            {/* Direct Link submenu */}
            {item.id === "direct-link" && activeItem === "direct-link" && (
              <div className="tam__sub">
                {directLinkTypes.map((lt) => (
                  <button
                    key={lt.id}
                    className="tam__sub-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDirectLinkType(lt.id);
                    }}
                  >
                    {lt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Forms submenu */}
            {item.id === "forms" && activeItem === "forms" && (
              <div className="tam__sub">
                <div className="tam__sub-search">
                  <span className="tam__sub-search-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    autoFocus
                    className="tam__sub-search-input"
                    type="text"
                    placeholder={i18n.t("messages.menu.search")}
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredForms.length === 0 ? (
                  <div className="tam__sub-empty">
                    {i18n.t("messages.menu.no_forms_available")}
                  </div>
                ) : (
                  filteredForms.map((f: any) => (
                    <button
                      key={f.FormId}
                      className="tam__sub-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        act({
                          type: "form",
                          formId: String(f.FormId),
                          pageName: f.PageName ?? f.FormName ?? "Form",
                          formReferenceName: f.ReferenceName ?? "",
                        });
                      }}
                    >
                      {f.PageName ?? f.FormName}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Modules submenu */}
            {item.id === "modules" && activeItem === "modules" && (
              <div className="tam__sub">
                <div className="tam__sub-search">
                  <span className="tam__sub-search-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    autoFocus
                    className="tam__sub-search-input"
                    type="text"
                    placeholder={i18n.t("messages.menu.search")}
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredModulePages.length === 0 ? (
                  <div className="tam__sub-empty">
                    {i18n.t("messages.menu.no_modules_available")}
                  </div>
                ) : (
                  filteredModulePages.map((p: any) => (
                    <button
                      key={p.PageId}
                      className="tam__sub-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        act({
                          type: "existing-page",
                          pageId: p.PageId,
                          objectType: p.PageType,
                          objectUrl: pageObjectUrl(p),
                        });
                      }}
                    >
                      {moduleLabels[p.PageType] ?? p.PageName}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {directLinkType && (
        <AddCtaModal
          ctaType={directLinkType}
          hideSupplier
          onConfirm={(attrs) => {
            onAction(tileId, {
              type: "direct-link",
              linkType: directLinkType,
              value: attrs.CtaAction,
              label: attrs.CtaLabel,
            });
            onClose();
          }}
          onCancel={() => {
            setDirectLinkType(null);
            onClose();
          }}
        />
      )}
    </>,
    document.getElementById("root") ?? document.body,
  );
}
