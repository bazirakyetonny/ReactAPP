import { useEffect, useRef, useState } from 'react';
import {
  gatherUrlCandidates,
  checkUrlCandidates,
  checkTileText,
  type AnalysisIssue,
} from '../utils/analysisUtils';

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

  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef(navContents);
  const pagesRef = useRef(pages);
  infoContentRef.current = infoContent;
  navContentsRef.current = navContents;
  pagesRef.current = pages;

  function homeInfo() {
    const allPages = pagesRef.current;
    const home = allPages.find((p: any) => p.PageName?.toLowerCase() === 'home');
    return { homeId: home?.PageId ?? 'home', homeName: home?.PageName ?? 'Home' };
  }

  // Fast path: sync-only checks (tile text length, future non-network checks).
  // Add new sync checks here as a checkXxx call so they also benefit from the fast update.
  function runSyncChecks(): AnalysisIssue[] {
    const content = infoContentRef.current;
    const nav = navContentsRef.current;
    const { homeId, homeName } = homeInfo();

    const issues: AnalysisIssue[] = checkTileText(content, homeId, homeName);
    for (const [pid, blocks] of Object.entries(nav)) {
      const page = pagesRef.current.find((p: any) => p.PageId === pid);
      issues.push(...checkTileText(blocks, pid, page?.PageName ?? pid));
    }
    return issues;
  }

  // Slow path: async URL checks. Add new URL sources to gatherUrlCandidates in analysisUtils.ts.
  async function runUrlChecks() {
    cancelRef.current = false;
    setIsAnalyzing(true);
    try {
      const content = infoContentRef.current;
      const nav = navContentsRef.current;
      const { homeId, homeName } = homeInfo();

      const candidates = gatherUrlCandidates(content, homeId, homeName);
      for (const [pid, blocks] of Object.entries(nav)) {
        const page = pagesRef.current.find((p: any) => p.PageId === pid);
        candidates.push(...gatherUrlCandidates(blocks, pid, page?.PageName ?? pid));
      }

      const issues = await checkUrlCandidates(candidates);
      if (cancelRef.current) return;
      setUrlIssues(issues);
    } finally {
      if (!cancelRef.current) setIsAnalyzing(false);
    }
  }

  // On version switch, clear stale URL issues immediately so the badge doesn't show old data.
  useEffect(() => {
    setUrlIssues([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  // Fast path: 300 ms debounce — reflects tile text changes almost immediately.
  useEffect(() => {
    if (fastTimerRef.current) clearTimeout(fastTimerRef.current);
    fastTimerRef.current = setTimeout(() => setSyncIssues(runSyncChecks()), 300);
    return () => { if (fastTimerRef.current) clearTimeout(fastTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoContent, navContents, versionId]);

  // Slow path: 4 s debounce — avoids spamming HTTP link checks on every keystroke.
  useEffect(() => {
    cancelRef.current = true;
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(runUrlChecks, 4000);
    return () => {
      cancelRef.current = true;
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoContent, navContents, versionId]);

  function rerun() {
    setSyncIssues(runSyncChecks());
    runUrlChecks();
  }

  return { issues: [...urlIssues, ...syncIssues], isAnalyzing, rerun };
}
