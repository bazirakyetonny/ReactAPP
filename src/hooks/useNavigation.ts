import { useState } from "react";
import { dataStore } from "../data/datastore";

export function useNavigation() {
  const [navStack, setNavStack] = useState<string[]>([]);
  const [navContents, setNavContents] = useState<Record<string, any[]>>({});

  function navUpdater(pageId: string) {
    return (transform: (blocks: any[]) => any[]) =>
      setNavContents((prev) => ({
        ...prev,
        [pageId]: transform(prev[pageId] ?? []),
      }));
  }

  function handleTileNavigate(pageId: string, parentIndex: number) {
    const cv = dataStore.get("Current_Version");
    const pageExists = (cv?.Pages ?? []).some((p: any) => p.PageId === pageId);
    if (!pageExists) return;

    const insertAt = parentIndex + 1;
    setNavStack((prev) =>
      prev[insertAt] === pageId
        ? prev.slice(0, insertAt + 1)
        : [...prev.slice(0, insertAt), pageId]
    );
    setNavContents((prev) => {
      if (prev[pageId] !== undefined) return prev;
      const page = (cv?.Pages ?? []).find((p: any) => p.PageId === pageId);
      if (!page?.PageStructure) return prev;
      try {
        return {
          ...prev,
          [pageId]: JSON.parse(page.PageStructure).InfoContent ?? [],
        };
      } catch {
        return { ...prev, [pageId]: [] };
      }
    });
  }

  function handleCollapseDescendants(parentIndex: number) {
    setNavStack((prev) =>
      prev.length <= parentIndex + 1 ? prev : prev.slice(0, parentIndex + 1)
    );
  }

  function handleNavigateToPath(pageIds: string[]) {
    setNavStack(pageIds);
    setNavContents((prev) => {
      const next = { ...prev };
      for (const pageId of pageIds) {
        if (next[pageId] !== undefined) continue;
        const page = (dataStore.get("Current_Version")?.Page ?? []).find(
          (p: any) => p.PageId === pageId
        );
        if (!page?.PageStructure) {
          next[pageId] = [];
          continue;
        }
        try {
          next[pageId] = JSON.parse(page.PageStructure).InfoContent ?? [];
        } catch {
          next[pageId] = [];
        }
      }
      return next;
    });
  }

  function handleDeletePage(pageId: string) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    dataStore.set("Current_Version", {
      ...cv,
      Page: (cv.Page ?? []).filter((p: any) => p.PageId !== pageId),
      Pages: (cv.Pages ?? []).filter((p: any) => p.PageId !== pageId),
    });
    setNavStack((prev) => prev.filter((id) => id !== pageId));
    setNavContents((prev) => {
      const n = { ...prev };
      delete n[pageId];
      return n;
    });
  }

  function handleCloseFromIndex(stackIndex: number) {
    setNavStack((prev) => prev.slice(0, stackIndex));
  }

  return {
    navStack,
    setNavStack,
    navContents,
    setNavContents,
    navUpdater,
    handleTileNavigate,
    handleCollapseDescendants,
    handleNavigateToPath,
    handleDeletePage,
    handleCloseFromIndex,
  };
}
