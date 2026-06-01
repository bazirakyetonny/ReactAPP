import { useState, useEffect, useRef } from "react";
import "./TranslationSideBar.css";
import type { ThemeColors, ThemeIcon, ThemeCtaColor } from "../../types";
import { PhoneLinkedHeader } from "../phone/PhoneHeaders";
import { DescriptionBlock } from "../phone/DescriptionBlock";
import { ImageBlock } from "../phone/ImageBlock";
import { CtaBlock } from "../phone/CtaBlock";
import { resolveColor, resolveIconSVG } from "../../utils/tileUtils";
import { TILE_H, TILE_GAP } from "../../constants";
import {
  translateAppVersion,
  getTranslatedPage,
  updateTranslatedPage,
} from "../../services/translationApi";

export function TranslationSideBar({
  pageName,
  appVersionId,
  appVersionLanguage,
  appVersionMultiLanguages,
  activePageId,
  themeColors,
  themeIcons,
  ctaColors,
}: {
  pageName?: string;
  appVersionId: string;
  appVersionLanguage: string;
  appVersionMultiLanguages: string[];
  activePageId: string;
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  ctaColors?: ThemeCtaColor[];
}) {
  const displayLanguages = appVersionMultiLanguages.filter(
    (l) => l.toLowerCase() !== appVersionLanguage.toLowerCase(),
  );
  const firstLang = displayLanguages[0] ?? "";
  const [selectedLang, setSelectedLang] = useState(firstLang);
  const [sdtPage, setSdtPage] = useState<any>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useRef(true);
  const isFirstRender = useRef(true);

  const displayContent: any[] = sdtPage?.PageStructure?.InfoContent ?? [];
  const editablePageName: string = sdtPage?.PageName ?? pageName ?? "";

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  function applyResult(result: any) {
    setSdtPage((result as any).SDT_TranslatedPage ?? null);
    setEditingKey(null);
  }

  // On mount: translate then fetch initial language
  useEffect(() => {
    isMounted.current = true;
    async function load() {
      if (!appVersionId || !firstLang) return;
      setIsLoading(true);
      try {
        await translateAppVersion({
          appVersionId,
          languageFrom: appVersionLanguage,
          languageToCollection: appVersionMultiLanguages,
          activePageId,
        });
        const result = await getTranslatedPage(activePageId, firstLang);
        if (isMounted.current) applyResult(result);
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On language change or active page change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!activePageId || !selectedLang) return;
    let cancelled = false;
    setIsLoading(true);
    getTranslatedPage(activePageId, selectedLang)
      .then((result) => {
        if (!cancelled) applyResult(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLang, activePageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save helpers ─────────────────────────────────────────────────────────────

  function saveNow(next: any) {
    updateTranslatedPage(activePageId, selectedLang, next);
  }

  function handlePageNameSave(value: string) {
    const next = { ...sdtPage, PageName: value };
    setSdtPage(next);
    saveNow(next);
  }

  function handleTileBlur(bi: number, ci: number, ti: number, value: string) {
    const content = structuredClone(sdtPage.PageStructure.InfoContent);
    content[bi].Columns[ci].Tiles[ti].Text = value;
    const next = {
      ...sdtPage,
      PageStructure: { ...sdtPage.PageStructure, InfoContent: content },
    };
    setSdtPage(next);
    saveNow(next);
    setEditingKey(null);
  }

  function handleCtaBlur(bi: number, value: string) {
    const content = structuredClone(sdtPage.PageStructure.InfoContent);
    content[bi].CtaAttributes.CtaLabel = value;
    const next = {
      ...sdtPage,
      PageStructure: { ...sdtPage.PageStructure, InfoContent: content },
    };
    setSdtPage(next);
    saveNow(next);
    setEditingKey(null);
  }

  // ── Editable block renderer ───────────────────────────────────────────────────

  function renderEditableBlocks() {
    const out: React.ReactNode[] = [];
    let i = 0;
    while (i < displayContent.length) {
      const block = displayContent[i];
      const bi = i;

      if (block.InfoType === "TileGrid") {
        const cols: any[] = block.Columns ?? [];
        out.push(
          <div key={block.InfoId} className="phone-tilegrid">
            {cols.map((col: any, ci: number) => (
              <div key={col.ColId} className="phone-column">
                {(col.Tiles ?? []).map((tile: any, ti: number) => {
                  const tileKey = `tile-${bi}-${ci}-${ti}`;
                  const bg = resolveColor(tile.BGColor ?? "", themeColors);
                  const iconSVG = resolveIconSVG(tile, themeIcons);
                  // Mirror TileGrids.tsx stretch logic: single tile in a 2-col grid
                  // should fill the height of the opposite column's stacked tiles.
                  let derivedHeight: string | null = null;
                  if (cols.length === 2 && (col.Tiles ?? []).length === 1) {
                    const oppCol = cols.find((c: any) => c.ColId !== col.ColId);
                    const oppCount = (oppCol?.Tiles ?? []).length;
                    if (oppCount > 1) {
                      derivedHeight = `${oppCount * TILE_H + (oppCount - 1) * TILE_GAP}px`;
                    }
                  }
                  const tileHeight = derivedHeight ?? `${tile.Height || TILE_H}px`;
                  return (
                    <div key={tile.Id} className="phone-tile-wrap" style={{ height: tileHeight }}>
                      <div
                        className="phone-tile"
                        style={{
                          background: bg,
                          color: tile.Color ?? "#333",
                          textAlign: tile.Align ?? "center",
                          alignItems: tile.Align === "left" ? "flex-start" : "center",
                          justifyContent: tile.Align === "left" ? "flex-start" : "center",
                        }}
                      >
                        {tile.BGImageUrl && (
                          <div
                            className="phone-tile-bg-img"
                            style={{ backgroundImage: `url(${tile.BGImageUrl})` }}
                          />
                        )}
                        {tile.BGImageUrl && tile.Opacity != null && (
                          <div
                            className="phone-tile-bg-dim"
                            style={{ opacity: 1 - Number(tile.Opacity ?? 0) / 100 }}
                          />
                        )}
                        {iconSVG && (
                          <div className="phone-tile-element">
                            <span
                              className="phone-tile-icon"
                              dangerouslySetInnerHTML={{ __html: iconSVG }}
                            />
                          </div>
                        )}
                        <div
                          className={`phone-tile-element${tile.Align === "left" ? " phone-tile-element--left" : ""}`}
                        >
                          {editingKey === tileKey ? (
                            <input
                              className="ts-editable-input"
                              defaultValue={tile.Text ?? ""}
                              autoFocus
                              style={{ color: tile.Color ?? "#333" }}
                              onBlur={(e) => handleTileBlur(bi, ci, ti, e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            />
                          ) : (
                            <span
                              className="phone-tile-text ts-editable-text"
                              title="Click to edit"
                              onClick={() => setEditingKey(tileKey)}
                            >
                              {tile.Text || " "}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>,
        );
        i++;
      } else if (block.InfoType === "Description") {
        out.push(
          <DescriptionBlock key={block.InfoId} block={block} interactive={false} />,
        );
        i++;
      } else if (block.InfoType === "Images") {
        out.push(
          <ImageBlock key={block.InfoId} block={block} interactive={false} />,
        );
        i++;
      } else if (
        block.InfoType === "Cta" &&
        (block.CtaAttributes?.CtaButtonType || "Image") === "Round"
      ) {
        // Collect consecutive round CTAs (up to 3)
        const row: { block: any; bi: number }[] = [];
        while (
          i < displayContent.length &&
          displayContent[i].InfoType === "Cta" &&
          (displayContent[i].CtaAttributes?.CtaButtonType || "Image") === "Round" &&
          row.length < 3
        ) {
          row.push({ block: displayContent[i], bi: i });
          i++;
        }
        out.push(
          <div key={row[0].block.InfoId} className="phone-round-cta-row">
            {row.map(({ block: rb, bi: rbi }) => {
              const ctaKey = `cta-${rbi}`;
              return (
                <CtaBlock
                  key={rb.InfoId}
                  block={rb}
                  ctaColors={ctaColors}
                  interactive={false}
                  editableLabel={editingKey === ctaKey}
                  onLabelClick={() => setEditingKey(ctaKey)}
                  onLabelBlur={(value) => handleCtaBlur(rbi, value)}
                />
              );
            })}
          </div>,
        );
      } else if (block.InfoType === "Cta") {
        const ctaKey = `cta-${bi}`;
        out.push(
          <CtaBlock
            key={block.InfoId}
            block={block}
            ctaColors={ctaColors}
            interactive={false}
            editableLabel={editingKey === ctaKey}
            onLabelClick={() => setEditingKey(ctaKey)}
            onLabelBlur={(value) => handleCtaBlur(bi, value)}
          />,
        );
        i++;
      } else {
        i++;
      }
    }
    return out;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <aside className="translation-sidebar">
      <div className="ts-phone-wrap">
        {isLoading ? (
          <div className="ts-loading">Translating…</div>
        ) : (
          <div className="phone-frame ts-phone-frame">
            {/* Status bar — lang select sits just before the network/wifi/battery icons */}
            <div className="phone-status-bar">
              <span className="phone-time">9:27</span>
              <div className="ts-status-right">
                {displayLanguages.length > 0 && (
                  <select
                    className="ts-status-lang-select"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    disabled={isLoading}
                  >
                    {displayLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
                <div className="phone-status-icons">
                  <i className="fas fa-signal" aria-hidden="true" />
                  <i className="fas fa-wifi" aria-hidden="true" />
                  <i className="fas fa-battery-full" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Page header — "home" hides back button and disables rename */}
            <PhoneLinkedHeader
              pageName={editablePageName}
              onBack={() => {}}
              onRename={editablePageName.toLowerCase() === "home" ? undefined : handlePageNameSave}
              hideBack={editablePageName.toLowerCase() === "home"}
              editOnClick
            />

            <div className="ts-phone-scroll">{renderEditableBlocks()}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
