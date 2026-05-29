import { useEffect, useMemo, useRef, useState } from 'react';
import {
  gatherUrlCandidates,
  checkTileText,
  checkCtaText,
  extractUrlFingerprint,
  type AnalysisIssue,
} from '../utils/analysisUtils';
import { checkLink } from '../utils/linkChecker';

interface UseAnalysisParams {
  infoContent: any[];
  navContents: Record<string, any[]>;
  pages: any[];
  versionId?: string;
}

export function useAnalysis({ infoContent, navContents, pages, versionId }: UseAnalysisParams) {
  // Sync issues (text length, etc.) update quickly; URL issues update after network checks.
  // Separating them lets the count reflect content changes immediately without waiting for HTTP.
  const [syncIssues, setSyncIssues] = useState<AnalysisIssue[]>([]);
  const [urlIssues, setUrlIssues] = useState<AnalysisIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef(false);
  // url → true (valid) | false (invalid). Persists across runs so only new/changed URLs are fetched.
  const urlCacheRef = useRef<Map<string, boolean>>(new Map());
  // True once the first full URL scan for the current version has completed.
  // Holds back syncIssues from the return value until both passes are done.
  const firstUrlDoneRef = useRef(false);

  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef(navContents);
  const pagesRef = useRef(pages);
  infoContentRef.current = infoContent;
  navContentsRef.current = navContents;
  pagesRef.current = pages;

  const PAGE_LINK_TYPES = new Set(['Information', 'BulletinBoard', 'Calendar', 'MyActivity', 'Map']);

  function homeInfo() {
    const allPages = pagesRef.current;
    const home = allPages.find((p: any) => p.PageName?.toLowerCase() === 'home');
    return { homeId: home?.PageId ?? 'home', homeName: home?.PageName ?? 'Home' };
  }

  // Parses content blocks for a page from live navContents or from PageStructure in the version.
  function blocksForPage(pageId: string): any[] {
    const live = navContentsRef.current[pageId];
    if (live !== undefined) return live;
    const page = pagesRef.current.find((p: any) => p.PageId === pageId);
    if (!page?.PageStructure) return [];
    try { return JSON.parse(page.PageStructure).InfoContent ?? []; }
    catch { return []; }
  }

  // Extracts pageIds directly linked from a set of blocks via tile navigation actions.
  function linkedPageIds(blocks: any[]): string[] {
    const ids: string[] = [];
    for (const block of blocks) {
      if (block.InfoType !== 'TileGrid') continue;
      for (const col of block.Columns ?? []) {
        for (const tile of col.Tiles ?? []) {
          if (PAGE_LINK_TYPES.has(tile.Action?.ObjectType) && tile.Action?.ObjectId) {
            ids.push(tile.Action.ObjectId);
          }
        }
      }
    }
    return ids;
  }

  // BFS from home through tile navigation links — returns only pages reachable from home.
  // Prefers live navContents so unsaved edits are reflected; falls back to PageStructure
  // so all linked pages are covered even before they have been visited in the UI.
  function reachablePages(): Array<{ pageId: string; pageName: string; blocks: any[] }> {
    const { homeId } = homeInfo();
    const result: Array<{ pageId: string; pageName: string; blocks: any[] }> = [];
    const visited = new Set<string>([homeId]);
    const queue = linkedPageIds(infoContentRef.current);

    while (queue.length > 0) {
      const pageId = queue.shift()!;
      if (visited.has(pageId)) continue;
      visited.add(pageId);

      const page = pagesRef.current.find((p: any) => p.PageId === pageId);
      if (!page) continue;

      const blocks = blocksForPage(pageId);
      result.push({ pageId, pageName: page.PageName ?? pageId, blocks });

      for (const childId of linkedPageIds(blocks)) {
        if (!visited.has(childId)) queue.push(childId);
      }
    }
    return result;
  }

  // Fast path: sync-only checks (tile text length, future non-network checks).
  // Add new sync checks here as a checkXxx call so they also benefit from the fast update.
  function runSyncChecks(): AnalysisIssue[] {
    const { homeId, homeName } = homeInfo();
    const issues: AnalysisIssue[] = [
      ...checkTileText(infoContentRef.current, homeId, homeName),
      ...checkCtaText(infoContentRef.current, homeId, homeName),
    ];
    for (const { pageId, pageName, blocks } of reachablePages()) {
      issues.push(...checkTileText(blocks, pageId, pageName));
      issues.push(...checkCtaText(blocks, pageId, pageName));
    }
    return issues;
  }

  // Gathers all URL candidates for the current reachable pages.
  function allCandidates() {
    const { homeId, homeName } = homeInfo();
    const candidates = gatherUrlCandidates(infoContentRef.current, homeId, homeName);
    for (const { pageId, pageName, blocks } of reachablePages()) {
      candidates.push(...gatherUrlCandidates(blocks, pageId, pageName));
    }
    return candidates;
  }

  // Rebuilds urlIssues from cache for the given candidates — no HTTP requests.
  function rebuildUrlIssues(candidates: ReturnType<typeof allCandidates>) {
    const issues: AnalysisIssue[] = [];
    candidates.forEach((c, i) => {
      if (urlCacheRef.current.get(c.url) === false) {
        issues.push({
          id: `url-${c.blockId}-${c.tileId ?? i}`,
          category: 1,
          subcategory: 'invalid-url',
          pageId: c.pageId,
          pageName: c.pageName,
          blockId: c.blockId,
          subItemId: c.tileId,
          location: c.location,
          detail: `Unreachable URL: ${c.url}`,
          value: c.url,
        });
      }
    });
    setUrlIssues(issues);
  }

  // Slow path: async URL checks. Only fetches URLs not already in urlCacheRef.
  // Pass force=true (rerun) to clear the cache and re-check everything.
  async function runUrlChecks(force = false) {
    cancelRef.current = false;
    setIsAnalyzing(true);
    try {
      const candidates = allCandidates();

      if (force) urlCacheRef.current.clear();

      // Deduplicated list of URLs not yet in cache
      const uncached = [...new Set(
        candidates.map(c => c.url).filter(u => !urlCacheRef.current.has(u))
      )];

      if (uncached.length > 0) {
        const results = await Promise.all(
          uncached.map(url => checkLink({
            url,
            type: /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ? 'image' : 'weblink',
          }))
        );
        if (cancelRef.current) return;
        uncached.forEach((url, i) => urlCacheRef.current.set(url, results[i]));
      }

      if (cancelRef.current) return;
      rebuildUrlIssues(candidates);
      firstUrlDoneRef.current = true;
    } finally {
      if (!cancelRef.current) setIsAnalyzing(false);
    }
  }

  // On version switch, clear stale URL issues and cache so the new version is fully re-scanned.
  useEffect(() => {
    urlCacheRef.current.clear();
    firstUrlDoneRef.current = false;
    setUrlIssues([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  // Fast path: 300 ms debounce — reflects tile text changes almost immediately.
  useEffect(() => {
    if (fastTimerRef.current) clearTimeout(fastTimerRef.current);
    fastTimerRef.current = setTimeout(() => setSyncIssues(runSyncChecks()), 300);
    return () => { if (fastTimerRef.current) clearTimeout(fastTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoContent, navContents, pages, versionId]);

  // Fingerprint changes only when actual URL values change — not on every text/tile edit.
  const urlFingerprint = useMemo(
    () => extractUrlFingerprint(infoContent, navContents),
    [infoContent, navContents],
  );

  // Fingerprint of navigation links (which tiles point to which pages).
  // Changes when a page is linked or unlinked, even if no URL values change.
  const pageLinkFingerprint = useMemo(() => {
    const parts: string[] = [];
    function scan(blocks: any[]) {
      for (const b of blocks) {
        if (b.InfoType !== 'TileGrid') continue;
        for (const col of b.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Action?.ObjectId) parts.push(`${b.InfoId}:${tile.Id}:${tile.Action.ObjectId}`);
          }
        }
      }
    }
    scan(infoContent);
    for (const blocks of Object.values(navContents)) scan(blocks);
    return parts.sort().join('|');
  }, [infoContent, navContents]);

  // When page links change (link/unlink) but no URLs changed, rebuild issues from cache
  // immediately — no HTTP needed since all URL results are already cached.
  const pageLinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlCacheRef.current.size === 0) return; // initial load — slow path covers this
    if (pageLinkTimerRef.current) clearTimeout(pageLinkTimerRef.current);
    pageLinkTimerRef.current = setTimeout(() => rebuildUrlIssues(allCandidates()), 100);
    return () => { if (pageLinkTimerRef.current) clearTimeout(pageLinkTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLinkFingerprint]);

  // Slow path: debounced URL check, only fires when URLs themselves change.
  useEffect(() => {
    cancelRef.current = true;
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(runUrlChecks, 4000);
    return () => {
      cancelRef.current = true;
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFingerprint, versionId]);

  function rerun() {
    setSyncIssues(runSyncChecks());
    runUrlChecks(true);
  }

  return { issues: firstUrlDoneRef.current ? [...urlIssues, ...syncIssues] : [], isAnalyzing, rerun };
}
