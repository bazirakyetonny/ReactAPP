import { useState, useRef, useEffect } from "react";
import "./SidebarRight.css";
import type { ThemeColors, ThemeCtaColor, ThemeIcon } from "../types";
import { SidebarCtaControls } from "./SidebarCtaControls";
import { ColorPalette } from "./sidebar_right/ColorPalette";
import { TileIconSelector } from "./sidebar_right/TileIconSelector";
import { MultiSelectPanel } from "./sidebar_right/MultiSelectPanel";
import { i18n } from "../i18n/i18n";
import { validateWeblinkUrl, normalizeYoutubeUrl } from "../utils/urlValidators";

// ── Icons ─────────────────────────────────────────────────────────────────────

function AddImageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="2.5"
        width="12"
        height="9"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M1 9.5l3-3.5 2.5 2.5 2-2 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="4.5" cy="5.5" r="1" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14.5"
      height="16"
      viewBox="0 0 14.5 16"
    >
      <g
        id="Icon_feather-trash-2"
        data-name="Icon feather-trash-2"
        transform="translate(0.5 0.5)"
      >
        <path
          id="Path_68"
          data-name="Path 68"
          d="M4.5,9H18"
          transform="translate(-4.5 -6)"
          fill="none"
          stroke="#4c5357"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
        />
        <path
          id="Path_69"
          data-name="Path 69"
          d="M18.572,6V16.5A1.542,1.542,0,0,1,16.99,18H9.082A1.542,1.542,0,0,1,7.5,16.5V6M9.872,6V4.5A1.542,1.542,0,0,1,11.454,3h3.163A1.542,1.542,0,0,1,16.2,4.5V6"
          transform="translate(-6.285 -3)"
          fill="none"
          stroke="#4c5357"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
        />
        <path
          id="Path_70"
          data-name="Path 70"
          d="M15,16.5v3.643"
          transform="translate(-9.75 -9.199)"
          fill="none"
          stroke="#4c5357"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
        />
        <path
          id="Path_71"
          data-name="Path 71"
          d="M21,16.5v3.643"
          transform="translate(-12.75 -9.199)"
          fill="none"
          stroke="#4c5357"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
        />
      </g>
    </svg>
  );
}

function SquareOutlineIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1.5"
        y="1.5"
        width="11"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function SquareFilledIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" fill="#1f2937" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12.7"
      height="14.626"
      viewBox="0 0 12.7 14.626"
    >
      <path
        id="Group_2344-converted"
        data-name="Group 2344-converted"
        d="M5.863,1.868V3.736L5.031,2.9,4.2,2.073l-.336.341-.336.342,1.411,1.41L6.35,5.577,7.758,4.17,9.165,2.762l-.333-.333L8.5,2.1l-.831.817-.83.817V0H5.863V1.868M0,7.313v.794H12.7V6.519H0v.794m4.937,3.149-1.4,1.4.333.333.334.333.83-.816.831-.817v3.729h.974V10.89l.832.832.831.832.336-.342.336-.341L7.766,10.465c-.773-.773-1.41-1.406-1.416-1.406s-.642.631-1.413,1.4"
        fill-rule="evenodd"
        fill="#696969"
      />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="1"
        y1="3"
        x2="13"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="6"
        x2="9"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="9"
        x2="13"
        y2="9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="12"
        x2="7"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SidebarRight({
  themeIcons = [],
  themeColors,
  ctaColors = [],
  selectedTile,
  onEditTile,
  onOpenTileImage,
  onBeforeOpacityChange,
  onBeforeTileTextEdit,
  onLiveTileText,
  onEndLiveTileText,
  onBeforeTileActionEdit,
  pageName,
  selectedCta,
  onEditCta,
  onBeforeCtaEdit,
  onCtaWeblinkSave,
  onCtaAddressSave,
  onTileWeblinkSave,
  onLiveCtaLabel,
  onEndLiveCtaLabel,
  moodId,
  selectedTileIds,
  selectedCtaIds,
  onBulkEditTiles,
  onBulkEditCtas,
  selectedThemeId,
}: {
  themeIcons?: ThemeIcon[];
  themeColors?: ThemeColors;
  ctaColors?: ThemeCtaColor[];
  selectedTile?: any;
  onEditTile?: (tileId: string, patch: Record<string, any>) => void;
  onOpenTileImage?: () => void;
  onBeforeOpacityChange?: () => void;
  onBeforeTileTextEdit?: () => void;
  onLiveTileText?: (id: string, text: string) => void;
  onEndLiveTileText?: () => void;
  onBeforeTileActionEdit?: () => void;
  pageName?: string;
  selectedCta?: any;
  onEditCta?: (ctaId: string, patch: Record<string, any>) => void;
  onBeforeCtaEdit?: () => void;
  onCtaWeblinkSave?: (ctaId: string, url: string, label: string) => void;
  onCtaAddressSave?: (ctaId: string, address: string, label: string) => void;
  onTileWeblinkSave?: (tileId: string, url: string) => void;
  onLiveCtaLabel?: (id: string, label: string) => void;
  onEndLiveCtaLabel?: () => void;
  moodId?: string;
  selectedTileIds?: Set<string>;
  selectedCtaIds?: Set<string>;
  onBulkEditTiles?: (patch: Record<string, any>) => void;
  onBulkEditCtas?: (patch: Record<string, any>) => void;
  selectedThemeId?: string;
}) {
  const [tileText, setTileText] = useState(selectedTile?.Text ?? "");
  const isEditingTextRef = useRef(false);
  // Tile the current focus session belongs to — guards against committing
  // stale text onto a tile selected after focus (e.g. a freshly added tile)
  const editingTileIdRef = useRef<string | null>(null);
  const [actionUrl, setActionUrl] = useState(
    selectedTile?.Action?.ObjectUrl ?? "",
  );
  const [urlError, setUrlError] = useState<string | null>(null);
  const isEditingActionRef = useRef(false);
  const tileTextInputRef = useRef<HTMLInputElement>(null);
  const autoFocusedRef = useRef(false);
  const snapshotDeferredRef = useRef(false);
  // Always-current tile text — avoids stale closure reads in onKeyDown/onBlur
  const tileTextRef = useRef(tileText);
  tileTextRef.current = tileText;

  // Selection changed: any in-progress edit belongs to the previous tile,
  // so end the session and re-sync unconditionally
  useEffect(() => {
    isEditingTextRef.current = false;
    editingTileIdRef.current = null;
    setTileText(selectedTile?.Text ?? "");
  }, [selectedTile?.Id]);

  useEffect(() => {
    if (!isEditingTextRef.current) setTileText(selectedTile?.Text ?? "");
  }, [selectedTile?.Text]);

  useEffect(() => {
    if (!isEditingActionRef.current) {
      setActionUrl(selectedTile?.Action?.ObjectUrl ?? "");
      setUrlError(null);
    }
  }, [selectedTile?.Id, selectedTile?.Action?.ObjectUrl]);

  useEffect(() => {
    if (selectedTile?.Id) {
      autoFocusedRef.current = true;
      snapshotDeferredRef.current = true;
      tileTextInputRef.current?.focus();
    }
  }, [selectedTile?.Id]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Resolve the selected tile's current BGColor to a hex so we can highlight the active chip
  const activeBgHex: string | undefined = selectedTile?.BGColor
    ? selectedTile.BGColor.startsWith("#")
      ? selectedTile.BGColor
      : themeColors?.[selectedTile.BGColor as keyof ThemeColors]
    : undefined;

  return (
    <aside className="app-sidebar-right">
      {/* 1. Page name */}
      <div className="sr-page-name">{(pageName ?? "").toUpperCase()}</div>

      {/* Multi-select bulk-edit panel */}
      <MultiSelectPanel
        selectedTileIds={selectedTileIds}
        selectedCtaIds={selectedCtaIds}
        moodId={moodId}
        ctaColors={ctaColors}
        onBulkEditTiles={onBulkEditTiles}
        onBulkEditCtas={onBulkEditCtas}
      />

      {!selectedTile &&
        !selectedCta &&
        (selectedTileIds?.size ?? 0) === 0 &&
        (selectedCtaIds?.size ?? 0) === 0 && (
          <div className="sr-empty-state">
            {i18n.t("sidebar.select_tile_placeholder")}
          </div>
        )}

      {selectedCta && !selectedTile && (
        <SidebarCtaControls
          selectedCta={selectedCta}
          palette={ctaColors}
          onEditCta={onEditCta}
          onBeforeCtaEdit={onBeforeCtaEdit}
          onWeblinkSave={(url, label) =>
            onCtaWeblinkSave?.(selectedCta?.InfoId, url, label)
          }
          onAddressSave={(address, label) =>
            onCtaAddressSave?.(selectedCta?.InfoId, address, label)
          }
          onLiveCtaLabel={onLiveCtaLabel}
          onEndLiveCtaLabel={onEndLiveCtaLabel}
        />
      )}

      {selectedTile && (
        <>
          <ColorPalette
            selectedTile={selectedTile}
            activeBgHex={activeBgHex}
            onEditTile={onEditTile}
            moodId={moodId}
            selectedThemeId={selectedThemeId}
          />
          {/* 2b. Image tools */}
          <div className="sr-image-tools">
            <div className="sr-text-color-group">
              <button
                className="sr-icon-btn sr-icon-btn--in-group"
                type="button"
                title={selectedTile?.BGImageUrl ? i18n.t("sidebar.change_image") : i18n.t("sidebar.add_image")}
                disabled={!selectedTile}
                onClick={onOpenTileImage}
              >
                <span className="plus">
                  <i className="fa fa-plus"></i>
                </span>
                <span className="image-icon">
                  <i className="fa fa-image"></i>
                </span>
              </button>
              {selectedTile?.BGImageUrl && (
                <>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(Number(selectedTile.Opacity ?? 0))}
                    className="sr-opacity-slider"
                    onPointerDown={onBeforeOpacityChange}
                    onChange={(e) =>
                      selectedTile &&
                      onEditTile?.(selectedTile.Id, {
                        Opacity: e.target.value,
                      })
                    }
                  />
                  <span className="sr-zoom-label">
                    {Math.round(Number(selectedTile.Opacity ?? 0))}%
                  </span>
                </>
              )}
            </div>
            {selectedTile?.BGImageUrl && (
              <>
                <button
                  className="sr-icon-btn sr-icon-btn--danger"
                  type="button"
                  title={i18n.t("sidebar.remove_image")}
                  onClick={() =>
                    onEditTile?.(selectedTile.Id, {
                      BGImageUrl: null,
                      OriginalImageUrl: null,
                      Opacity: null,
                    })
                  }
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </div>
          {/* 2c. Text input — bound to selected tile */}
          <div className="sr-section">
            <input
              ref={tileTextInputRef}
              className="sr-input"
              type="text"
              placeholder={
                selectedTile ? i18n.t("sidebar.input_place_holder") : i18n.t("sidebar.select_tile")
              }
              value={tileText}
              disabled={!selectedTile}
              onFocus={() => {
                isEditingTextRef.current = true;
                editingTileIdRef.current = selectedTile?.Id ?? null;
                if (autoFocusedRef.current) {
                  autoFocusedRef.current = false;
                } else {
                  snapshotDeferredRef.current = false;
                  onBeforeTileTextEdit?.();
                }
              }}
              onChange={(e) => {
                // Typing always edits the currently selected tile, even if the
                // selection changed without the input re-firing focus
                isEditingTextRef.current = true;
                editingTileIdRef.current = selectedTile?.Id ?? null;
                if (snapshotDeferredRef.current) {
                  snapshotDeferredRef.current = false;
                  onBeforeTileTextEdit?.();
                }
                const val = e.target.value.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
                setTileText(val);
                if (selectedTile)
                  onLiveTileText?.(selectedTile.Id, val);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                // Save immediately using the ref so the value is never stale.
                // Null out editingTileIdRef so the onBlur that follows doesn't double-save.
                const editedTileId = editingTileIdRef.current;
                isEditingTextRef.current = false;
                editingTileIdRef.current = null;
                autoFocusedRef.current = false;
                snapshotDeferredRef.current = false;
                if (selectedTile && selectedTile.Id === editedTileId && tileTextRef.current !== (selectedTile.Text ?? ""))
                  onEditTile?.(selectedTile.Id, { Text: tileTextRef.current });
                onEndLiveTileText?.();
                e.currentTarget.blur();
              }}
              onBlur={() => {
                const editedTileId = editingTileIdRef.current;
                isEditingTextRef.current = false;
                editingTileIdRef.current = null;
                autoFocusedRef.current = false;
                snapshotDeferredRef.current = false;
                if (
                  selectedTile &&
                  selectedTile.Id === editedTileId &&
                  tileText !== (selectedTile.Text ?? "")
                )
                  onEditTile?.(selectedTile.Id, { Text: tileText });
                onEndLiveTileText?.();
              }}
            />
          </div>
          {/* 2d. WebLink URL input */}
          {selectedTile?.Action?.ObjectType === "WebLink" && (
            <div className="sr-section">
              <input
                className={`sr-input${urlError ? " sr-input--error" : ""}`}
                type="text"
                placeholder="https://example.com"
                value={actionUrl}
                onFocus={() => {
                  isEditingActionRef.current = true;
                  onBeforeTileActionEdit?.();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  setActionUrl(val);
                  setUrlError(null);
                  if (selectedTile)
                    onEditTile?.(selectedTile.Id, {
                      Action: { ...selectedTile.Action, ObjectUrl: val },
                    });
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  isEditingActionRef.current = false;
                  const err = validateWeblinkUrl(actionUrl);
                  if (err) { setUrlError(err); e.currentTarget.blur(); return; }
                  const normalized = normalizeYoutubeUrl(actionUrl.trim());
                  if (selectedTile) onTileWeblinkSave?.(selectedTile.Id, normalized);
                  e.currentTarget.blur();
                }}
                onBlur={() => {
                  isEditingActionRef.current = false;
                  const err = validateWeblinkUrl(actionUrl);
                  if (err) { setUrlError(err); return; }
                  const normalized = normalizeYoutubeUrl(actionUrl.trim());
                  if (selectedTile) onTileWeblinkSave?.(selectedTile.Id, normalized);
                }}
              />
              {urlError && <span className="sr-url-error">{urlError}</span>}
            </div>
          )}
          {/* 3. Format toolbar */}
          <div className="sr-toolbar">
            {/* Text colour group: Light + Dark */}
            <div className="sr-text-color-group">
              {/* Light (#ffffff) */}
              <button
                className={`sr-tool-btn sr-tool-btn--in-group${selectedTile?.Color === "#ffffff" ? " sr-tool-btn-active" : ""}`}
                type="button"
                title={i18n.t("sidebar.text_color")}
                disabled={!selectedTile}
                onClick={() =>
                  selectedTile &&
                  onEditTile?.(selectedTile.Id, { Color: "#ffffff" })
                }
              >
                <SquareOutlineIcon />
              </button>
              <div className="sr-group-separator" />
              {/* Dark (#333333) */}
              <button
                className={`sr-tool-btn sr-tool-btn--in-group${selectedTile?.Color === "#333333" ? " sr-tool-btn-active" : ""}`}
                type="button"
                title={i18n.t("sidebar.text_color")}
                disabled={!selectedTile}
                onClick={() =>
                  selectedTile &&
                  onEditTile?.(selectedTile.Id, { Color: "#333333" })
                }
              >
                <SquareFilledIcon />
              </button>
            </div>
            {/* Alignment group: Center + Left */}
            <div className="sr-text-color-group">
              <button
                className={`sr-tool-btn sr-tool-btn--in-group${selectedTile?.Align === "left" ? " sr-tool-btn-active" : ""}`}
                type="button"
                title={i18n.t("sidebar.align_left")}
                disabled={!selectedTile}
                onClick={() =>
                  selectedTile &&
                  onEditTile?.(selectedTile.Id, { Align: "left" })
                }
              >
                <AlignLeftIcon />
              </button>
              <div className="sr-group-separator" />
              <button
                className={`sr-tool-btn sr-tool-btn--in-group${!selectedTile?.Align || selectedTile?.Align === "center" ? " sr-tool-btn-active" : ""}`}
                type="button"
                title={i18n.t("sidebar.align_center")}
                disabled={!selectedTile}
                onClick={() =>
                  selectedTile &&
                  onEditTile?.(selectedTile.Id, { Align: "center" })
                }
              >
                <AlignCenterIcon />
              </button>
            </div>
          </div>
          {/* 4. Icon selector */}
          <TileIconSelector
            themeIcons={themeIcons}
            selectedTile={selectedTile}
            onEditTile={onEditTile}
          />
        </>
      )}
    </aside>
  );
}
