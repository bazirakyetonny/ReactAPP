import { useEffect, useRef, useState } from 'react';
import './PreviewLayout.css';
import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../types';
import type { LinkedFrame } from './MainCanvas';
import { MainCanvas } from './MainCanvas';
import { dataStore } from '../data/datastore';
import { getTranslatedPage } from '../services/translationApi';

interface PreviewLayoutProps {
  infoContent: any[];
  linkedFrames: LinkedFrame[];
  homePageId: string;
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

function getLanguages(): { baseLanguage: string; allLanguages: string[] } {
  const cv = dataStore.get("Current_Version");
  const baseLanguage: string = cv?.AppVersionLanguage ?? "";
  let multiLanguages: string[] = [];
  try {
    multiLanguages = JSON.parse(cv?.AppVersionMultiLanguages ?? "[]");
  } catch {}
  const allLanguages = [
    baseLanguage,
    ...multiLanguages.filter((l) => l.toLowerCase() !== baseLanguage.toLowerCase()),
  ].filter(Boolean);
  return { baseLanguage, allLanguages };
}

export function PreviewLayout({
  infoContent,
  linkedFrames,
  homePageId,
  themeColors,
  themeIcons,
  themeCtaColors,
  onSelectTile,
  onTileNavigate,
  onCollapseDescendants,
  activeNavTileIds,
  onActiveFrameChange,
}: PreviewLayoutProps) {
  const { baseLanguage, allLanguages } = getLanguages();

  const [previewLang, setPreviewLang] = useState<string>(baseLanguage);
  const [translatedContents, setTranslatedContents] = useState<Record<string, any[]>>({});
  const isMounted = useRef(false);
  const fetchingRef = useRef<Set<string>>(new Set());
  const translatedRef = useRef(translatedContents);
  translatedRef.current = translatedContents;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const isBaseLanguage = previewLang.toLowerCase() === baseLanguage.toLowerCase();

  // The currently visible page in preview: last linked frame, or home
  const activePageId =
    linkedFrames.length > 0 ? linkedFrames[linkedFrames.length - 1].pageId : homePageId;

  // Fetch translation only for the currently visible page, on demand
  useEffect(() => {
    if (isBaseLanguage || !activePageId) {
      setTranslatedContents({});
      fetchingRef.current.clear();
      return;
    }
    if (translatedRef.current[activePageId] || fetchingRef.current.has(activePageId)) return;
    fetchingRef.current.add(activePageId);
    getTranslatedPage(activePageId, previewLang)
      .then((result) => {
        const content = (result as any)?.SDT_TranslatedPage?.PageStructure?.InfoContent ?? null;
        if (isMounted.current && content) {
          setTranslatedContents((prev) => ({ ...prev, [activePageId]: content }));
        }
      })
      .catch(() => {})
      .finally(() => { fetchingRef.current.delete(activePageId); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, previewLang, isBaseLanguage]);

  const effectiveInfoContent =
    !isBaseLanguage && translatedContents[homePageId]
      ? translatedContents[homePageId]
      : infoContent;

  const effectiveLinkedFrames: LinkedFrame[] = (linkedFrames ?? []).map((frame) => ({
    ...frame,
    infoContent:
      !isBaseLanguage && translatedContents[frame.pageId]
        ? translatedContents[frame.pageId]
        : frame.infoContent,
  }));

  const langSelect = allLanguages.length > 1 ? (
    <select
      className="preview-status-lang-select"
      value={previewLang}
      onChange={(e) => {
        setPreviewLang(e.target.value);
        setTranslatedContents({});
        fetchingRef.current.clear();
      }}
    >
      {allLanguages.map((l) => (
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
