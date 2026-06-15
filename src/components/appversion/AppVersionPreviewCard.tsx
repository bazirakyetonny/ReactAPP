import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./css/AppVersionPreviewCard.css";
import type { AppVersion, ThemeColors, ThemeIcon } from "../../types";
import { dataStore } from "../../data/datastore";
import { PhoneStatusBar } from "../phone/StatusBar";
import { PhoneAppHeader } from "../phone/PhoneHeaders";
import { TileGrids } from "../tile/TileGrids";
import { DescriptionBlock } from "../phone/DescriptionBlock";
import { ImageBlock } from "../phone/ImageBlock";

interface AppVersionPreviewCardProps {
  version: AppVersion | null;
  isSelected: boolean;
  onClick: () => void;
  name: string;
  description?: string;
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
}

function parseHomeContent(version: AppVersion | null): any[] {
  if (!version?.Pages?.length) return [];
  const homePage =
    version.Pages.find((p) => p.PageName?.toLowerCase() === "home") ??
    version.Pages[0];
  if (!homePage?.PageStructure) return [];
  try {
    return JSON.parse(homePage.PageStructure)?.InfoContent ?? [];
  } catch {
    return [];
  }
}

export function AppVersionPreviewCard({
  version,
  isSelected,
  onClick,
  name,
  description,
  themeColors,
  themeIcons,
}: AppVersionPreviewCardProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const infoContent = useMemo(() => parseHomeContent(version), [version]);

  const resolvedThemeColors = useMemo(() => {
    const themes = dataStore.get("themes") ?? [];
    const versionTheme = themes.find((t: any) => t.ThemeId === version?.ThemeId);
    return (versionTheme?.ThemeColors as ThemeColors | undefined) ?? themeColors;
  }, [version, themeColors]);

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
    <div
      className={`cav-card${isSelected ? " cav-card--selected" : ""}`}
      onClick={onClick}
    >
      {version === null ? (
        <div className="avc-clip avc-clip--blank" ref={clipRef} />
      ) : (
        <div className="avc-clip" ref={clipRef}>
          <div
            className="avc-frame"
            ref={frameRef}
            style={{ transform: `scale(${scale.toFixed(6)})` }}
          >
            <PhoneStatusBar />
            <PhoneAppHeader />
            <div className="avc-screen">
              {infoContent.map((block: any) => {
                if (block.InfoType === "TileGrid")
                  return (
                    <TileGrids
                      key={block.InfoId}
                      tileGrids={[block]}
                      themeColors={resolvedThemeColors}
                      themeIcons={themeIcons ?? []}
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
      )}

      <div className="cav-card-footer">
        <div className="cav-card-name">{name}</div>
        {description && <div className="cav-card-desc">{description}</div>}
      </div>
    </div>
  );
}
