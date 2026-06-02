import { useEffect, useRef, useState } from 'react';
import './PreviewLayout.css';
import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../types';
import type { LinkedFrame } from './MainCanvas';
import { MainCanvas } from './MainCanvas';
import { getTranslatedPage } from '../services/translationApi';

interface PreviewLayoutProps {
  infoContent: any[];
  linkedFrames: LinkedFrame[];
  homePageId: string;
  appVersionId: string;
  appVersionLanguage: string;
  appVersionMultiLanguages: string[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  themeCtaColors?: ThemeCtaColor[];
  onSelectTile: (id: string) => void;
  onTileNavigate: (pageId: string, parentIndex: number) => void;
  onCollapseDescendants: (parentIndex: number) => void;
  activeNavTileIds?: Set<string>;
  onActiveFrameChange?: (pageId: string | null) => void;
}

const noop = () => {};

export function PreviewLayout({
  infoContent,
  linkedFrames,
  homePageId,
  appVersionLanguage,
  appVersionMultiLanguages,
  themeColors,
  themeIcons,
  themeCtaColors,
  onSelectTile,
  onTileNavigate,
  onCollapseDescendants,
  activeNavTileIds,
  onActiveFrameChange,
}: PreviewLayoutProps) {
  const displayLanguages = appVersionMultiLanguages.filter(
    (l) => l.toLowerCase() !== appVersionLanguage.toLowerCase(),
  );

  const [previewLang, setPreviewLang] = useState<string | null>(null);
  const [translatedContents, setTranslatedContents] = useState<Record<string, any[]>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Fetch home page translation when language changes
  useEffect(() => {
    if (!previewLang || !homePageId) {
      setTranslatedContents({});
      return;
    }
    getTranslatedPage(homePageId, previewLang)
      .then((result) => {
        const content = (result as any)?.SDT_TranslatedPage?.PageStructure?.InfoContent ?? null;
        if (isMounted.current && content) {
          setTranslatedContents({ [homePageId]: content });
        }
      })
      .catch(() => {});
  }, [previewLang, homePageId]);

  // Fetch linked page translations as frames appear
  useEffect(() => {
    if (!previewLang) return;
    linkedFrames?.forEach((frame) => {
      if (!frame.pageId || translatedContents[frame.pageId]) return;
      getTranslatedPage(frame.pageId, previewLang)
        .then((result) => {
          const content = (result as any)?.SDT_TranslatedPage?.PageStructure?.InfoContent ?? null;
          if (isMounted.current && content) {
            setTranslatedContents((prev) => ({ ...prev, [frame.pageId]: content }));
          }
        })
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedFrames, previewLang]);

  const effectiveInfoContent =
    previewLang && translatedContents[homePageId]
      ? translatedContents[homePageId]
      : infoContent;

  const effectiveLinkedFrames: LinkedFrame[] = (linkedFrames ?? []).map((frame) => ({
    ...frame,
    infoContent:
      previewLang && translatedContents[frame.pageId]
        ? translatedContents[frame.pageId]
        : frame.infoContent,
  }));

  const langSelect = displayLanguages.length > 0 ? (
    <select
      className="preview-status-lang-select"
      value={previewLang ?? appVersionLanguage}
      onChange={(e) => {
        const val = e.target.value;
        setPreviewLang(val === appVersionLanguage ? null : val);
        setTranslatedContents({});
      }}
    >
      <option value={appVersionLanguage}>{appVersionLanguage.toUpperCase()}</option>
      {displayLanguages.map((l) => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  ) : undefined;

  return (
    <div className="preview-layout">
      <MainCanvas
        isPreviewMode
        infoContent={effectiveInfoContent}
        linkedFrames={effectiveLinkedFrames}
        selectedTileId={null}
        onSelectTile={onSelectTile}
        onTileNavigate={onTileNavigate}
        onCollapseDescendants={onCollapseDescendants}
        activeNavTileIds={activeNavTileIds}
        themeColors={themeColors}
        themeIcons={themeIcons}
        themeCtaColors={themeCtaColors}
        onActiveFrameChange={onActiveFrameChange}
        onAddColumn={noop}
        onDeleteTile={noop}
        onEditTile={noop}
        statusBarExtra={langSelect}
      />
    </div>
  );
}
