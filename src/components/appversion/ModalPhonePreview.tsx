import { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./css/ModalPhonePreview.css";
import type { ThemeColors, ThemeIcon } from "../../types";
import { PhoneStatusBar } from "../phone/StatusBar";
import { PhoneAppHeader, PhoneLinkedHeader } from "../phone/PhoneHeaders";
import { TileGrids } from "../tile/TileGrids";
import { DescriptionBlock } from "../phone/DescriptionBlock";
import { ImageBlock } from "../phone/ImageBlock";

interface ModalPhonePreviewProps {
  currentPage: any;
  previewColors: ThemeColors | undefined;
  themeIcons: ThemeIcon[];
  onBack: () => void;
}

export function ModalPhonePreview({
  currentPage,
  previewColors,
  themeIcons,
  onBack,
}: ModalPhonePreviewProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const isHomePage =
    !currentPage || currentPage.PageName?.toLowerCase() === "home";

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
    <div className="mpv-col">
      <div className="mpv-clip" ref={clipRef}>
        <div
          className="mpv-frame"
          ref={frameRef}
          style={{ transform: `scale(${scale.toFixed(6)})` }}
        >
          <PhoneStatusBar />
          {isHomePage ? (
            <PhoneAppHeader />
          ) : (
            <PhoneLinkedHeader
              pageName={(currentPage as any)?.PageName ?? ""}
              onBack={onBack}
              hideBack={false}
            />
          )}
          <div className="mpv-screen">
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
  );
}
