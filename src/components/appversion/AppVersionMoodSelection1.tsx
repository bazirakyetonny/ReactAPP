import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./css/AppVersionMoodSelection1.css";
import type {
  AppVersion,
  ThemeColors,
  ThemeIcon,
  Mood,
  Theme,
} from "../../types";
import { dataStore } from "../../data/datastore";
import { PhoneStatusBar } from "../phone/StatusBar";
import { PhoneAppHeader } from "../phone/PhoneHeaders";
import { TileGrids } from "../tile/TileGrids";
import { DescriptionBlock } from "../phone/DescriptionBlock";
import { ImageBlock } from "../phone/ImageBlock";

interface AppVersionConfigStepProps {
  template: AppVersion | null;
  baseThemeColors: ThemeColors | undefined;
  themeIcons: ThemeIcon[];
  selectedMoodId: string | null;
  onMoodChange: (moodId: string) => void;
}

export function AppVersionMoodSelection1({
  template,
  baseThemeColors,
  themeIcons,
  selectedMoodId,
  onMoodChange,
}: AppVersionConfigStepProps) {
  const moods: Mood[] = dataStore.get("Moods") ?? [];
  const themes: Theme[] = dataStore.get("themes") ?? [];
  const clipRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const pages = template?.Pages ?? [];
  const currentPage = pages[currentPageIndex];
  const pageContent: any[] = useMemo(() => {
    if (
      !currentPage ||
      !("PageStructure" in currentPage) ||
      !(currentPage as any).PageStructure
    )
      return [];
    try {
      return JSON.parse((currentPage as any).PageStructure)?.InfoContent ?? [];
    } catch {
      return [];
    }
  }, [currentPage]);
  const previewColors = useMemo((): ThemeColors | undefined => {
    const mood = moods.find((m) => m.MoodId === selectedMoodId);
    if (!mood || !baseThemeColors) return baseThemeColors;
    const moodTheme = themes.find((t) => t.ThemeId === mood.ThemeId);
    if (!moodTheme) return baseThemeColors;
    let colorNames: string[] = [];
    try { colorNames = JSON.parse(mood.MoodColorNames ?? "[]"); } catch { /* */ }
    const result = { ...baseThemeColors };
    for (const name of colorNames) {
      const value = (moodTheme.ThemeColors as unknown as Record<string, string>)[name];
      if (value) (result as unknown as Record<string, string>)[name] = value;
    }
    return result;
  }, [selectedMoodId, moods, themes, baseThemeColors]);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const clipW = clipRef.current?.offsetWidth ?? 0;
      const frameW = frameRef.current?.offsetWidth ?? 0;
      if (frameW > 0) setScale(clipW / frameW);
    });
    if (clipRef.current) ro.observe(clipRef.current);
    if (frameRef.current) ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="acs-container">
      {/* Left — phone preview */}
      <div className="acs-phone-col">
        <div className="acs-clip" ref={clipRef}>
          <div
            className="phone-frame acs-frame"
            ref={frameRef}
            style={{ transform: `scale(${scale.toFixed(6)})` }}
          >
            <PhoneStatusBar />
            <PhoneAppHeader />
            <div className="phone-screen">
              {pageContent.map((block: any) => {
                if (block.InfoType === "TileGrid")
                  return (
                    <TileGrids
                      key={block.InfoId}
                      tileGrids={[block]}
                      themeColors={previewColors}
                      themeIcons={themeIcons}
                      interactive={false}
                    />
                  );
                if (block.InfoType === "Description")
                  return (
                    <DescriptionBlock
                      key={block.InfoId}
                      block={block}
                      interactive={false}
                    />
                  );
                if (block.InfoType === "Images")
                  return (
                    <ImageBlock
                      key={block.InfoId}
                      block={block}
                      interactive={false}
                    />
                  );
                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Centre — info + page navigation */}
      <div className="acs-info-col">
        <div className="acs-nav-row">
          <button
            className="acs-nav-btn"
            type="button"
            disabled={currentPageIndex === 0}
            onClick={() => setCurrentPageIndex((i) => i - 1)}
          >
            ←
          </button>
          <span className="acs-page-indicator">
            {currentPageIndex + 1} / {pages.length || 1}
          </span>
          <button
            className="acs-nav-btn"
            type="button"
            disabled={currentPageIndex >= pages.length - 1}
            onClick={() => setCurrentPageIndex((i) => i + 1)}
          >
            →
          </button>
        </div>
        <div className="acs-template-name">
          {template?.AppVersionName ?? "Blank Version"}
        </div>
        {template?.AppVersionDescription && (
          <div className="acs-template-desc">
            {template.AppVersionDescription}
          </div>
        )}
        {pages.length > 0 && (
          <div className="acs-page-name">
            {(currentPage as any)?.PageName ?? ""}
          </div>
        )}
      </div>

      {/* Right — mood picker */}
      <div className="acs-mood-col">
        <div className="acs-mood-label">Colour Theme</div>
        <div className="acs-mood-list">
          {moods.map((mood) => (
            <label
              key={mood.MoodId}
              className={`acs-mood-item${selectedMoodId === mood.MoodId ? " acs-mood-item--active" : ""}`}
            >
              <input
                type="radio"
                name="acs-mood"
                value={mood.MoodId}
                checked={selectedMoodId === mood.MoodId}
                onChange={() => onMoodChange(mood.MoodId)}
              />
              <span className="acs-mood-name">{mood.MoodName}</span>
              <span className="acs-mood-swatches">
                {(() => {
                  const moodTheme = themes.find(
                    (t) => t.ThemeId === mood.ThemeId,
                  );
                  let colorNames: string[] = [];
                  try {
                    colorNames = JSON.parse(mood.MoodColorNames ?? "[]");
                  } catch {
                    colorNames = [];
                  }
                  return colorNames.slice(0, 4).map((name) => (
                    <span
                      key={name}
                      className="acs-swatch"
                      style={{
                        background:
                          (
                            moodTheme?.ThemeColors as
                              | Record<string, string>
                              | undefined
                          )?.[name] ?? "#ccc",
                      }}
                    />
                  ));
                })()}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
