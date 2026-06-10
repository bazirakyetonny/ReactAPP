import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { dataStore } from "../../data/datastore";
import { AddCtaModal } from "../phone/AddCtaModal";
import "./TileActionMenu.css";

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
  pos: { x: number; y: number };
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

const MODULE_LABELS: Record<string, string> = {
  BulletinBoard: "Bulletin Board",
  Calendar: "Calendar",
  MyActivity: "My Activity",
  Map: "Map",
};

const DIRECT_LINK_TYPES = [
  { id: "Email", label: "Email" },
  { id: "Phone", label: "Phone" },
  { id: "Weblink", label: "Web link" },
] as const;

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
  const directLinkTypeRef = useRef<string | null>(null);
  directLinkTypeRef.current = directLinkType;

  const cv = dataStore.get("Current_Version");
  const pages: any[] = cv?.Pages ?? [];
  const allPagesWithContent: any[] = cv?.Page ?? [];
  const infoPages = pages.filter(
    (p: any) =>
      !MODULE_TYPES.has(p.PageType) && p.PageName?.toLowerCase() !== "home",
  );
  const modulePages = pages.filter((p: any) => MODULE_TYPES.has(p.PageType));
  const forms: any[] = dataStore.get("SDT_DynamicFormsCollection") ?? [];

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

  function act(action: TileMenuAction) {
    onAction(tileId, action);
    onClose();
  }

  const menuItems = [
    { id: "new-page", label: "New Page", hasSub: false },
    { id: "existing-pages", label: "Existing Pages", hasSub: true },
    { id: "direct-link", label: "Direct Link", hasSub: true },
    { id: "forms", label: "Forms", hasSub: true },
    { id: "modules", label: "Modules", hasSub: true },
    { id: "copy-tile", label: "Copy Tile", hasSub: false },
  ];

  return ReactDOM.createPortal(
    <>
      <div ref={ref} className="tam" style={{ left: pos.x, top: pos.y }}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="tam__item-wrap"
            onMouseEnter={() => setActiveItem(item.id)}
            onMouseLeave={() => setActiveItem(null)}
          >
            <button
              className={`tam__item${activeItem === item.id && item.hasSub ? " tam__item--expanded" : ""}`}
              onMouseDown={(e) => {
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
                  {infoPages.length === 0 ? (
                    <div className="tam__sub-empty">No pages yet</div>
                  ) : (
                    infoPages.map((p: any) => {
                      const connected = isPageConnected(
                        p.PageId,
                        allPagesWithContent,
                      );
                      return (
                        <button
                          key={p.PageId}
                          className="tam__sub-item"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            act({
                              type: "existing-page",
                              pageId: p.PageId,
                              objectType: p.PageType,
                              objectUrl: pageObjectUrl(p),
                            });
                          }}
                        >
                          {p.PageName}
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

            {/* Direct Link submenu — Email / Phone / Web link */}
            {item.id === "direct-link" && activeItem === "direct-link" && (
              <div className="tam__sub">
                {DIRECT_LINK_TYPES.map((lt) => (
                  <button
                    key={lt.id}
                    className="tam__sub-item"
                    onMouseDown={(e) => {
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
                {forms.length === 0 ? (
                  <div className="tam__sub-empty">No forms available</div>
                ) : (
                  forms.map((f: any) => (
                    <button
                      key={f.FormId}
                      className="tam__sub-item"
                      onMouseDown={(e) => {
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
                {modulePages.length === 0 ? (
                  <div className="tam__sub-empty">No modules available</div>
                ) : (
                  modulePages.map((p: any) => (
                    <button
                      key={p.PageId}
                      className="tam__sub-item"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        act({
                          type: "existing-page",
                          pageId: p.PageId,
                          objectType: p.PageType,
                          objectUrl: pageObjectUrl(p),
                        });
                      }}
                    >
                      {MODULE_LABELS[p.PageType] ?? p.PageName}
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
