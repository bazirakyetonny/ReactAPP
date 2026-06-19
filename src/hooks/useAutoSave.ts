import { useEffect, useRef, useState } from 'react';
import { dataStore } from '../data/datastore';
import { savePage } from '../services/pagesApi';

export function useAutoSave(
  infoContent: any[],
  navContents: Record<string, any[]>,
  versionId: string | undefined,
  disabled = false
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isMountedRef    = useRef(false);
  const skipNextHomeRef = useRef(false);
  const homeTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNavContentsRef = useRef<Record<string, any[]>>({});
  const dirtyNavIdsRef  = useRef<string[]>([]);

  // When the version changes, skip the next infoContent save (content was just loaded from server)
  useEffect(() => {
    if (isMountedRef.current) skipNextHomeRef.current = true;
  }, [versionId]);

  // ── Home page ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMountedRef.current) { isMountedRef.current = true; return; }
    if (skipNextHomeRef.current) { skipNextHomeRef.current = false; return; }
    if (disabled) return;

    if (homeTimerRef.current) clearTimeout(homeTimerRef.current);
    setIsDirty(true);
    homeTimerRef.current = setTimeout(async () => {
      homeTimerRef.current = null;
      const cv = dataStore.get('Current_Version');
      const homePage = (cv?.Page ?? []).find((p: any) => p.PageName?.toLowerCase() === 'home');
      if (!cv || !homePage) { setIsDirty(false); return; }
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
        setIsDirty(false);
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
    if (disabled) return;
    const prev = prevNavContentsRef.current;
    const dirtyIds = Object.keys(navContents).filter(id => prev[id] !== undefined && navContents[id] !== prev[id]);
    prevNavContentsRef.current = navContents;
    if (dirtyIds.length === 0) return;

    dirtyNavIdsRef.current = [...new Set([...dirtyNavIdsRef.current, ...dirtyIds])];

    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setIsDirty(true);
    navTimerRef.current = setTimeout(async () => {
      navTimerRef.current = null;
      const idsToSave = [...dirtyNavIdsRef.current];
      dirtyNavIdsRef.current = [];
      const cv = dataStore.get('Current_Version');
      if (!cv) { setIsDirty(false); return; }
      setIsSaving(true); setSaveError(false);
      try {
        await Promise.all(idsToSave.map(pageId => {
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
        setIsDirty(false);
      }
    }, 1500);
    return () => { if (navTimerRef.current) clearTimeout(navTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navContents]);

  async function runSave(fn: () => Promise<void>) {
    setIsSaving(true); setIsDirty(true); setSaveError(false);
    try {
      await fn();
      setSavedAt(Date.now());
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
      setIsDirty(false);
    }
  }

  // Cancels any pending debounce timer for pageId and saves immediately.
  // No-ops if no save is pending for that page.
  async function flushSave(pageId: string) {
    const cv = dataStore.get('Current_Version');
    if (!cv) return;
    const page = (cv.Page ?? []).find((p: any) => p.PageId === pageId);
    if (!page) return;

    const isHome = page.PageName?.toLowerCase() === 'home';

    if (isHome) {
      if (!homeTimerRef.current) return;
      clearTimeout(homeTimerRef.current);
      homeTimerRef.current = null;
      await runSave(async () => {
        await savePage({
          AppVersionId: cv.AppVersionId,
          PageId: page.PageId,
          PageName: page.PageName,
          PageType: page.PageType,
          PageStructure: JSON.stringify({ InfoContent: infoContent }),
        });
      });
    } else {
      if (!navTimerRef.current) return;
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
      const idsToSave = [...dirtyNavIdsRef.current];
      dirtyNavIdsRef.current = [];
      await runSave(async () => {
        await Promise.all(
          idsToSave.map(id => {
            const p = (cv.Page ?? []).find((pg: any) => pg.PageId === id);
            if (!p) return Promise.resolve();
            return savePage({
              AppVersionId: cv.AppVersionId,
              PageId: p.PageId,
              PageName: p.PageName,
              PageType: p.PageType,
              PageStructure: JSON.stringify({ InfoContent: navContents[id] }),
            });
          })
        );
      });
    }
  }

  return { isSaving, isDirty, saveError, savedAt, runSave, flushSave };
}
