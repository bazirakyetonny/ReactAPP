import { useEffect, useRef, useState } from 'react';
import { dataStore } from '../data/datastore';
import { savePage } from '../services/pagesApi';

export function useAutoSave(
  infoContent: any[],
  navContents: Record<string, any[]>,
  versionId: string | undefined
) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isMountedRef    = useRef(false);
  const skipNextHomeRef = useRef(false);
  const homeTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNavContentsRef = useRef<Record<string, any[]>>({});

  // When the version changes, skip the next infoContent save (content was just loaded from server)
  useEffect(() => {
    if (isMountedRef.current) skipNextHomeRef.current = true;
  }, [versionId]);

  // ── Home page ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    if (skipNextHomeRef.current) { skipNextHomeRef.current = false; return; }

    if (homeTimerRef.current) clearTimeout(homeTimerRef.current);
    homeTimerRef.current = setTimeout(async () => {
      const cv = dataStore.get('Current_Version');
      const homePage = (cv?.Page ?? []).find((p: any) => p.PageName?.toLowerCase() === 'home');
      if (!cv || !homePage) return;
      setIsSaving(true); setSaveError(false);
      try {
        await savePage({
          AppVersionId: cv.AppVersionId,
          PageId: homePage.PageId,
          PageName: homePage.PageName,
          PageType: homePage.PageType,
          PageStructure: JSON.stringify({ InfoContent: infoContent }),
        });
        setSavedAt(Date.now());
      } catch {
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
    return () => { if (homeTimerRef.current) clearTimeout(homeTimerRef.current); };
  // versionId intentionally omitted — read via skipNextHomeRef set by the effect above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoContent]);

  // ── Nav pages ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(navContents).length === 0) {
      prevNavContentsRef.current = {};
      return;
    }
    const prev = prevNavContentsRef.current;
    const dirtyIds = Object.keys(navContents).filter(id => prev[id] !== undefined && navContents[id] !== prev[id]);
    prevNavContentsRef.current = navContents;
    if (dirtyIds.length === 0) return;

    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(async () => {
      const cv = dataStore.get('Current_Version');
      if (!cv) return;
      setIsSaving(true); setSaveError(false);
      try {
        await Promise.all(dirtyIds.map(pageId => {
          const page = (cv.Page ?? []).find((p: any) => p.PageId === pageId);
          if (!page) return Promise.resolve();
          return savePage({
            AppVersionId: cv.AppVersionId,
            PageId: page.PageId,
            PageName: page.PageName,
            PageType: page.PageType,
            PageStructure: JSON.stringify({ InfoContent: navContents[pageId] }),
          });
        }));
        setSavedAt(Date.now());
      } catch {
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    }, 1500);
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navContents]);

  async function runSave(fn: () => Promise<void>) {
    setIsSaving(true); setSaveError(false);
    try {
      await fn();
      setSavedAt(Date.now());
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return { isSaving, saveError, savedAt, runSave };
}
