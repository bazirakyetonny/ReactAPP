import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  getAppVersions,
  getActiveAppVersion,
  activateAppVersion,
  type SDTAppVersion,
} from "./services/appVersionsApi";
import { getBaseUrl } from "./services/apiClient";
import { updateAppVersionTheme } from "./services/themeApi";
import { NavBar } from "./components/NavBar";
import { MainCanvas } from "./components/MainCanvas";
import { EditorModals } from "./components/EditorModals";
import { PreviewLayout } from "./components/PreviewLayout";
import { SidebarRight } from "./components/SidebarRight";
import { TemplateSidebar } from "./components/TemplateSidebar";
import { TranslationSideBar } from "./components/translation/TranslationSideBar";
import { VersionHistorySidebar } from "./components/appversion/VersionHistorySidebar";
import { PageBubbleTree } from "./components/tree/PageBubbleTree";
import { dataStore } from "./data/datastore";
import type { Theme, CategoryTemplates, TrnPageTemplate } from "./types";
import {
  parseInfoContent,
  applyEditTile,
  applyAddBlock,
  applyCopyTile,
} from "./utils/contentTransforms";
import {
  createInfoPage,
  updatePageTitle,
  createLinkPage,
} from "./services/pagesApi";
import { NEW_PAGE_SENTINEL } from "./utils/linkedFrames";
import type { TileMenuAction } from "./components/tile/TileActionMenu";
import { buildLinkedFrames } from "./utils/linkedFrames";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useNavigation } from "./hooks/useNavigation";
import { useContentHandlers } from "./hooks/useContentHandlers";
import { useAutoSave } from "./hooks/useAutoSave";
import { useAnalysis } from "./hooks/useAnalysis";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { BusyModal } from "./components/BusyModal";

function App() {
  const isBusy: boolean = dataStore.get("isBusy") ?? false;
  const [reviewOnly, setReviewOnly] = useState(false);

  const isPreviewMode =
    reviewOnly || (dataStore.get("Mode") ?? "EditorMode") === "PreviewMode";

  const themes: Theme[] = dataStore.get("themes") ?? [];
  const templatesCollection: CategoryTemplates[] =
    dataStore.get("TemplatesCollection") ?? [];
  const pageTemplates: TrnPageTemplate[] =
    dataStore.get("BC_Trn_TemplateCollection") ?? [];

  const [currentVersion, setCurrentVersion] = useState<any>(() =>
    dataStore.get("Current_Version"),
  );
  const [appVersions, setAppVersions] = useState<SDTAppVersion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [renameVersion, setRenameVersion] = useState<SDTAppVersion | null>(
    null,
  );
  const [trashVersion, setTrashVersion] = useState<SDTAppVersion | null>(null);
  const [duplicateVersion, setDuplicateVersion] =
    useState<SDTAppVersion | null>(null);
  const [updateTranslationsVersion, setUpdateTranslationsVersion] =
    useState<SDTAppVersion | null>(null);
  useEffect(() => {
    if (isPreviewMode) return;
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get("CurrentThemeId") ?? themes[0]?.ThemeId ?? "",
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedCtaId, setSelectedCtaId] = useState<string | null>(null);
  const [infoContent, setInfoContent] = useState<any[]>(parseInfoContent);
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [translationPageId, setTranslationPageId] = useState<string | null>(
    null,
  );
  const [tileImageModal, setTileImageModal] = useState<{
    tileId: string;
    tileWidth: number;
    tileHeight: number;
    initialOriginalUrl?: string;
    initialOpacity?: string;
  } | null>(null);
  const [pendingCta, setPendingCta] = useState<{
    blockType: string;
    insertBeforeInfoId: string | null;
    frameId: string | null;
  } | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [liveTileText, setLiveTileText] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [liveCtaLabel, setLiveCtaLabel] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Live refs so hooks always read the current values
  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef<Record<string, any[]>>({});
  const navStackRef = useRef<string[]>([]);
  const themeIdRef = useRef(selectedThemeId);
  const pagesRef = useRef<any[]>(currentVersion?.Pages ?? []);
  useLayoutEffect(() => {
    infoContentRef.current = infoContent;
  });
  useLayoutEffect(() => {
    themeIdRef.current = selectedThemeId;
  });
  useLayoutEffect(() => {
    pagesRef.current = currentVersion?.Pages ?? [];
  });

  const {
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
  } = useNavigation();

  // pageId → the specific tile ID that was clicked to open that page
  const [navSourceTiles, setNavSourceTiles] = useState<Record<string, string>>(
    {},
  );
  // pageId → URL for WebLink pages
  const [navUrls, setNavUrls] = useState<Record<string, string>>({});

  // Drop stale entries whenever the nav stack shrinks
  useEffect(() => {
    const pageSet = new Set(navStack);
    setNavSourceTiles((prev) => {
      const stale = Object.keys(prev).filter((id) => !pageSet.has(id));
      if (!stale.length) return prev;
      const next = { ...prev };
      stale.forEach((id) => delete next[id]);
      return next;
    });
    setNavUrls((prev) => {
      const stale = Object.keys(prev).filter((id) => !pageSet.has(id));
      if (!stale.length) return prev;
      const next = { ...prev };
      stale.forEach((id) => delete next[id]);
      return next;
    });
  }, [navStack]);

  useLayoutEffect(() => {
    navContentsRef.current = navContents;
  });
  useLayoutEffect(() => {
    navStackRef.current = navStack;
  });

  // Ref so onRestorePages (defined before useAutoSave) can reach runSave
  const runSaveRef = useRef<((fn: () => Promise<void>) => void) | null>(null);

  const {
    undoStack,
    redoStack,
    pushSnapshot,
    clearHistory,
    handleUndo,
    handleRedo,
    isResizingRef,
  } = useUndoRedo({
    infoContentRef,
    navContentsRef,
    navStackRef,
    themeIdRef,
    pagesRef,
    setInfoContent,
    setNavContents,
    setNavStack,
    onRestoreTheme: (themeId) => {
      setSelectedThemeId(themeId);
      if (currentVersion?.AppVersionId)
        updateAppVersionTheme(currentVersion.AppVersionId, themeId).catch(
          () => {},
        );
    },
    onRestorePages: (pages) => {
      const cv = dataStore.get("Current_Version");
      if (!cv) return;
      const currentPages: any[] = cv.Page ?? [];
      const renamedPages = pages.filter((p: any) => {
        const cur = currentPages.find((c: any) => c.PageId === p.PageId);
        return cur && cur.PageName !== p.PageName;
      });
      const updated = { ...cv, Page: pages };
      dataStore.set("Current_Version", updated);
      setCurrentVersion(updated);
      if (renamedPages.length > 0) {
        runSaveRef.current?.(() =>
          Promise.all(
            renamedPages.map((p: any) =>
              updatePageTitle(cv.AppVersionId, p.PageId, p.PageName),
            ),
          ).then(() => undefined),
        );
      }
    },
  });

  const {
    handleAddColumn,
    handleDeleteTile,
    handleAddStandaloneTile,
    handleAddBlock,
    handleEditCta,
    handleSelectCta,
    handleAddTilesToColumn,
    handleAddDescription,
    handleEditDescription,
    handleDeleteBlock,
    handleAddImage,
    handleEditImage,
    handleMoveBlock,
    handleCrossFrameBlockDrop,
    handleEditTile,
    handleFreeResizeRelease,
    handleTileDrop,
    handleTileDropAsNewBlock,
    handleCrossFrameTileDrop,
    handleCrossFrameTileDropToEmpty,
    handleCrossFrameTileDropAsNewBlock,
  } = useContentHandlers({
    infoContent,
    setInfoContent,
    navContents,
    setNavContents,
    navStack,
    selectedTileId,
    setSelectedTileId,
    setSelectedCtaId,
    setPendingCta,
    pushSnapshot,
    isResizingRef,
    onNewTileCreated: () => setNavStack([]),
  });

  // ── Version switching ────────────────────────────────────────────────────

  async function handleVersionSelect(id: string) {
    if (id === currentVersion?.AppVersionId) return;
    await activateAppVersion(id);
    const fetched = (await getActiveAppVersion()) as any;
    const fullVersion = {
      ...fetched,
      Page: fetched.Page ?? fetched.Pages ?? [],
    };
    dataStore.set("Current_Version", fullVersion);
    setCurrentVersion(fullVersion);
    setSelectedThemeId(fullVersion.ThemeId ?? themes[0]?.ThemeId ?? "");
    setInfoContent(parseInfoContent());
    setNavStack([]);
    setNavContents({});
    setNavSourceTiles({});
    setNavUrls({});
    clearHistory();
    setSelectedTileId(null);
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  async function handleVersionRestored() {
    try {
      const fetched = (await getActiveAppVersion()) as any;
      const fullVersion = {
        ...fetched,
        Page: fetched.Page ?? fetched.Pages ?? [],
      };
      dataStore.set("Current_Version", fullVersion);
      setCurrentVersion(fullVersion);
      setSelectedThemeId(fullVersion.ThemeId ?? themes[0]?.ThemeId ?? "");
      setInfoContent(parseInfoContent());
      setNavStack([]);
      setNavContents({});
      setNavSourceTiles({});
      setNavUrls({});
      clearHistory();
      setSelectedTileId(null);
      getAppVersions()
        .then(setAppVersions)
        .catch(() => {});
    } catch {
      // silently swallow — sidebar will still close
    } finally {
      setIsHistoryOpen(false);
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const selectedTheme = themes.find((t) => t.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get("Current_Version")?.Page ?? [];
  let activePageId = navStack[navStack.length - 1];
  let activePage = allPages.find((p) => p.PageId === activePageId);
  if (!activePage) {
    activePage = allPages.find((p) => p.PageName.toLowerCase() === "home");
    activePageId = activePage?.PageId;
  }
  const activePageName = activePage?.PageName ?? "Home";

  // Translation sidebar tracks whichever phone frame is visually active (phone-frame--active)
  const homePage = allPages.find(
    (p: any) => p.PageName.toLowerCase() === "home",
  );
  const transPage = translationPageId
    ? allPages.find((p: any) => p.PageId === translationPageId)
    : homePage;
  const transPageId = transPage?.PageId ?? homePage?.PageId ?? "";
  const transPageName = transPage?.PageName ?? "Home";

  function handleActiveFrameChange(pageId: string | null) {
    setTranslationPageId(pageId); // null = home frame active
  }

  const appVersionMultiLanguages: string[] = (() => {
    try {
      return JSON.parse(currentVersion?.AppVersionMultiLanguages ?? "[]");
    } catch {
      return [];
    }
  })();

  const allTiles = [
    ...infoContent.flatMap((b: any) =>
      (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []),
    ),
    ...Object.values(navContents).flatMap((blocks) =>
      blocks.flatMap((b: any) =>
        (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []),
      ),
    ),
  ];
  const selectedTile = selectedTileId
    ? (allTiles.find((t: any) => t.Id === selectedTileId) ?? null)
    : null;

  const allBlocks = [...infoContent, ...Object.values(navContents).flat()];
  const selectedCta = selectedCtaId
    ? (allBlocks.find(
        (b: any) => b.InfoType === "Cta" && b.InfoId === selectedCtaId,
      ) ?? null)
    : null;

  const activeNavTileIds = useMemo(() => {
    const pageSet = new Set(navStack);
    const ids = new Set<string>();
    for (const [pageId, tileId] of Object.entries(navSourceTiles)) {
      if (pageSet.has(pageId)) ids.add(tileId);
    }
    return ids;
  }, [navStack, navSourceTiles]);

  // ── Auto-save ────────────────────────────────────────────────────────────

  const { isSaving, saveError, savedAt, runSave } = useAutoSave(
    infoContent,
    navContents,
    currentVersion?.AppVersionId,
  );
  runSaveRef.current = runSave;

  // ── Analysis ─────────────────────────────────────────────────────────────

  const {
    issues: analysisIssues,
    isAnalyzing,
    rerun: rerunAnalysis,
  } = useAnalysis({
    infoContent,
    navContents,
    pages: currentVersion?.Pages ?? [],
    versionId: currentVersion?.AppVersionId,
    disabled: isPreviewMode,
  });

  const {
    isMultiSelectMode,
    selectedTileIds,
    selectedCtaIds,
    toggleMultiSelectMode,
    exitMultiSelectMode,
    setSelectedTileIds,
    setSelectedCtaIds,
  } = useMultiSelect();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isMultiSelectMode) exitMultiSelectMode();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMultiSelectMode, exitMultiSelectMode]);

  function handleBulkEditTiles(patch: Record<string, any>) {
    setInfoContent((prev: any[]) => {
      let content = prev;
      selectedTileIds.forEach((tileId) => {
        content = applyEditTile(content, tileId, patch);
      });
      return content;
    });
    setNavContents((prev: Record<string, any[]>) => {
      const next = { ...prev };
      for (const [pageId, blocks] of Object.entries(prev)) {
        let content = blocks;
        selectedTileIds.forEach((tileId) => {
          content = applyEditTile(content, tileId, patch);
        });
        next[pageId] = content;
      }
      return next;
    });
  }

  function handleBulkEditCtas(patch: Record<string, any>) {
    const applyCtaPatch = (blocks: any[]) =>
      blocks.map((block: any) =>
        block.InfoType === "Cta" && selectedCtaIds.has(block.InfoId)
          ? { ...block, CtaAttributes: { ...(block.CtaAttributes ?? {}), ...patch } }
          : block,
      );
    setInfoContent((prev: any[]) => applyCtaPatch(prev));
    setNavContents((prev: Record<string, any[]>) => {
      const next = { ...prev };
      for (const pageId of Object.keys(prev)) {
        next[pageId] = applyCtaPatch(prev[pageId]);
      }
      return next;
    });
  }

  const homePageId =
    (currentVersion?.Pages ?? []).find(
      (p: any) => p.PageName?.toLowerCase() === "home",
    )?.PageId ?? "home";

  const isActivePageBlank =
    activePageId !== homePageId &&
    activePage?.PageType === "Information" &&
    (navContents[activePageId] ?? []).length === 0;

  function handleApplyTemplate(content: any[]) {
    pushSnapshot();
    if (activePageId === homePageId) {
      setInfoContent(content);
    } else {
      setNavContents((prev) => ({ ...prev, [activePageId]: content }));
    }
  }

  function openAnalysis() {
    setAnalysisOpen(true);
    setAnalysisIndex(0);
    if (analysisIssues.length > 0 && analysisIssues[0].pageId !== homePageId) {
      handleNavigateToPath([analysisIssues[0].pageId]);
    }
  }

  function goToAnalysisIssue(idx: number) {
    const issue = analysisIssues[idx];
    if (!issue) return;
    setAnalysisIndex(idx);
    if (issue.pageId !== homePageId) handleNavigateToPath([issue.pageId]);
  }

  function handleAnalysisPrev() {
    if (analysisIssues.length === 0) return;
    goToAnalysisIssue(
      (analysisIndex - 1 + analysisIssues.length) % analysisIssues.length,
    );
  }

  function handleAnalysisNext() {
    if (analysisIssues.length === 0) return;
    goToAnalysisIssue((analysisIndex + 1) % analysisIssues.length);
  }

  const currentAnalysisIssue =
    analysisOpen && analysisIssues.length > 0
      ? analysisIssues[Math.min(analysisIndex, analysisIssues.length - 1)]
      : null;
  const analysisHighlight = currentAnalysisIssue
    ? {
        blockId: currentAnalysisIssue.blockId,
        tileId: currentAnalysisIssue.subItemId,
        message:
          currentAnalysisIssue.category === 1 ? "Invalid URL" : "Text too long",
      }
    : null;

  // ── Data persistence ─────────────────────────────────────────────────────

  useEffect(() => {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    dataStore.set("Current_Version", {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        if (p.PageName?.toLowerCase() !== "home") return p;
        let existing: any = {};
        try {
          existing = JSON.parse(p.PageStructure);
        } catch {}
        return {
          ...p,
          PageStructure: JSON.stringify({
            ...existing,
            InfoContent: infoContent,
          }),
        };
      }),
    });
  }, [infoContent]);

  useEffect(() => {
    if (Object.keys(navContents).length === 0) return;
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    dataStore.set("Current_Version", {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        const content = navContents[p.PageId];
        if (content === undefined) return p;
        let existing: any = {};
        try {
          existing = JSON.parse(p.PageStructure);
        } catch {}
        return {
          ...p,
          PageStructure: JSON.stringify({ ...existing, InfoContent: content }),
        };
      }),
    });
  }, [navContents]);

  // ── Tile image modal ─────────────────────────────────────────────────────

  function handleTileDoubleClick(tileId: string, rect: DOMRect) {
    let tile: any = null;
    const find = (blocks: any[]) =>
      blocks.forEach((b) =>
        (b.Columns ?? []).forEach((col: any) => {
          const found = (col.Tiles ?? []).find((t: any) => t.Id === tileId);
          if (found) tile = found;
        }),
      );
    find(infoContentRef.current);
    Object.values(navContentsRef.current).forEach(find);
    console.log({
      tileId,
      tileWidth: rect.width,
      tileHeight: rect.height,
      initialOriginalUrl: tile?.OriginalImageUrl,
      initialOpacity: tile?.Opacity,
    });
    setTileImageModal({
      tileId,
      tileWidth: rect.width,
      tileHeight: rect.height,
      initialOriginalUrl: tile?.OriginalImageUrl,
      initialOpacity: tile?.Opacity,
    });
  }

  function handleTileImageConfirm(result: {
    bgImageUrl: string;
    opacity: string;
    originalImageUrl: string;
    originalMediaId: string;
  }) {
    if (!tileImageModal) return;
    pushSnapshot();
    const patch = {
      BGImageUrl: result.bgImageUrl,
      OriginalImageUrl: result.originalImageUrl,
      Opacity: result.opacity,
      BGColor: null,
    };
    setInfoContent((prev) => applyEditTile(prev, tileImageModal.tileId, patch));
    setNavContents((prev) => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditTile(blocks, tileImageModal.tileId, patch);
      return next;
    });
    setTileImageModal(null);
  }

  function handleOpenTileImageFromSidebar() {
    if (!selectedTileId) return;
    const el = document.querySelector(`[data-tile-id="${selectedTileId}"]`);
    if (el) handleTileDoubleClick(selectedTileId, el.getBoundingClientRect());
  }

  async function handleConfirmCta(attrs: {
    CtaLabel: string;
    CtaAction: string;
    CtaConnectedSupplierId?: string;
    CtaSupplierIsConnected: boolean;
  }) {
    if (!pendingCta) return;
    const { blockType, insertBeforeInfoId, frameId } = pendingCta;
    const ts = Date.now();
    setPendingCta(null);

    let finalAttrs: Record<string, any> = { ...attrs };

    if (blockType === "Cta_Weblink" && attrs.CtaAction) {
      const cv = dataStore.get("Current_Version");
      if (cv) {
        const url = attrs.CtaAction;
        const existing = (cv.Page ?? []).find(
          (p: any) =>
            p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
        );
        if (existing) {
          finalAttrs = {
            ...attrs,
            Action: {
              ObjectType: "WebLink",
              ObjectId: existing.PageId,
              ObjectUrl: url,
            },
          };
        } else {
          try {
            const newPage = await createLinkPage({
              appVersionId: cv.AppVersionId,
              pageName: attrs.CtaLabel || url,
              url,
              WWPFormId: 0,
            });
            if (newPage?.PageId) {
              const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
              dataStore.set("Current_Version", updated);
              setCurrentVersion(updated);
              finalAttrs = {
                ...attrs,
                Action: {
                  ObjectType: "WebLink",
                  ObjectId: newPage.PageId,
                  ObjectUrl: newPage.PageLinkStructure?.Url ?? url,
                },
              };
            }
          } catch {
            // proceed without a linked page
          }
        }
      }
    }

    pushSnapshot();
    if (frameId === null) {
      setInfoContent((prev) =>
        applyAddBlock(prev, blockType, insertBeforeInfoId, ts, finalAttrs),
      );
    } else {
      setNavContents((prev) => ({
        ...prev,
        [frameId]: applyAddBlock(
          prev[frameId] ?? [],
          blockType,
          insertBeforeInfoId,
          ts,
          finalAttrs,
        ),
      }));
    }
    setSelectedCtaId(`cta-${ts}`);
    setSelectedTileId(null);
    const linkedAction = finalAttrs.Action;
    if (
      linkedAction?.ObjectType === "WebLink" &&
      linkedAction?.ObjectId &&
      linkedAction?.ObjectUrl
    ) {
      const ctaParentIndex =
        frameId === null ? -1 : navStackRef.current.indexOf(frameId);
      handleTileNavigate(linkedAction.ObjectId, ctaParentIndex);
      setNavUrls((prev) => ({
        ...prev,
        [linkedAction.ObjectId]: linkedAction.ObjectUrl,
      }));
    }
  }

  // ── Page rename ──────────────────────────────────────────────────────────

  function handleRenamePage(pageId: string, newName: string) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    pushSnapshot();
    const updated = {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) =>
        p.PageId === pageId ? { ...p, PageName: newName } : p,
      ),
    };
    dataStore.set("Current_Version", updated);
    setCurrentVersion(updated);
    runSave(() => updatePageTitle(cv.AppVersionId, pageId, newName));
  }

  // ── New page frame helpers ────────────────────────────────────────────────

  const pendingNewPageTileRef = useRef<string | null>(null);

  async function handleCommitNewPage(name: string) {
    const tileId = pendingNewPageTileRef.current;
    if (!tileId) return;
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    try {
      const raw: any = await createInfoPage(cv.AppVersionId, name);
      const newPage: any = Array.isArray(raw) ? raw[0] : raw;
      if (!newPage?.PageId) return;
      pendingNewPageTileRef.current = null;
      const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
      dataStore.set("Current_Version", updated);
      setCurrentVersion(updated);
      setNavStack((prev) =>
        prev.map((id) => (id === NEW_PAGE_SENTINEL ? newPage.PageId : id)),
      );
      setNavContents((prev: Record<string, any[]>) => {
        const next: Record<string, any[]> = {
          ...prev,
          [newPage.PageId]: prev[NEW_PAGE_SENTINEL] ?? [],
        };
        delete next[NEW_PAGE_SENTINEL];
        return next;
      });
      setNavSourceTiles((prev) => ({ ...prev, [newPage.PageId]: tileId }));
      handleEditTile(tileId, {
        Action: {
          ObjectType: newPage.PageType,
          ObjectId: newPage.PageId,
          ObjectUrl: "",
          FormId: 0,
        },
      });
    } catch {
      handleCancelNewPage();
    }
  }

  function handleCancelNewPage() {
    pendingNewPageTileRef.current = null;
    setNavStack((prev) => prev.filter((id) => id !== NEW_PAGE_SENTINEL));
    setNavContents((prev) => {
      const next = { ...prev };
      delete next[NEW_PAGE_SENTINEL];
      return next;
    });
  }

  // ── Modal handlers (used by EditorModals) ────────────────────────────────

  async function handleVersionCreated(version: any) {
    setShowCreateModal(false);
    try {
      await activateAppVersion(version.AppVersionId);
      const fetched = (await getActiveAppVersion()) as any;
      const full = { ...fetched, Page: fetched.Page ?? fetched.Pages ?? [] };
      dataStore.set("Current_Version", full);
      setCurrentVersion(full);
      setInfoContent(parseInfoContent());
      setNavStack([]);
      setNavContents({});
      clearHistory();
      setSelectedTileId(null);
    } catch {}
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  function handleTemplateCreated() {
    setShowCreateTemplateModal(false);
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  function handleVersionRenamed(newName: string) {
    if (!renameVersion) return;
    setAppVersions((prev) =>
      prev.map((a) =>
        a.AppVersionId === renameVersion.AppVersionId
          ? { ...a, AppVersionName: newName }
          : a,
      ),
    );
    if (renameVersion.AppVersionId === currentVersion?.AppVersionId) {
      const merged = { ...currentVersion, AppVersionName: newName };
      dataStore.set("Current_Version", merged);
      setCurrentVersion(merged);
    }
    setRenameVersion(null);
  }

  function handleVersionDeleted() {
    setTrashVersion(null);
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  function handleVersionDuplicated() {
    setDuplicateVersion(null);
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  function handleTranslationsUpdated() {
    setUpdateTranslationsVersion(null);
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  // ── Preview tile navigation (no selection, no sidebar) ───────────────────

  function handlePreviewTileSelect(id: string) {
    const frames = [
      { frameIndex: -1 as number, blocks: infoContentRef.current },
      ...navStackRef.current.map((pid, idx) => ({
        frameIndex: idx,
        blocks: navContentsRef.current[pid] ?? [],
      })),
    ];
    let tileFrameIndex = -1;
    let tileAction: any = null;
    outer: for (const { frameIndex, blocks } of frames) {
      for (const block of blocks) {
        if (block.InfoType !== "TileGrid") continue;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Id === id) {
              tileFrameIndex = frameIndex;
              tileAction = tile.Action ?? null;
              break outer;
            }
          }
        }
      }
    }
    if (
      tileAction?.ObjectType === "WebLink" ||
      tileAction?.ObjectType === "DynamicForm"
    ) {
      const frameKey = tileAction.ObjectId || `form-frame-${id}`;
      const page = pagesRef.current.find(
        (p: any) => p.PageId === tileAction.ObjectId,
      );
      const url = page?.PageLinkStructure?.Url ?? tileAction.ObjectUrl;
      if (!url) return;
      handleTileNavigate(frameKey, tileFrameIndex);
      setNavSourceTiles((prev) => ({ ...prev, [frameKey]: id }));
      setNavUrls((prev) => ({ ...prev, [frameKey]: url }));
    }
  }

  // ── Tile select ──────────────────────────────────────────────────────────

  const PAGE_NAV_TYPES = new Set([
    "Information",
    "BulletinBoard",
    "Calendar",
    "MyActivity",
    "Map",
  ]);

  function handleSelectTile(id: string) {
    setSelectedTileId(id);
    setSelectedCtaId(null);

    // Find the tile and which frame it lives in
    const frames = [
      { frameIndex: -1 as number, blocks: infoContentRef.current },
      ...navStackRef.current.map((pid, i) => ({
        frameIndex: i,
        blocks: navContentsRef.current[pid] ?? [],
      })),
    ];

    let tileFrameIndex = -1;
    let tileAction: any = null;

    outer: for (const { frameIndex, blocks } of frames) {
      for (const block of blocks) {
        if (block.InfoType !== "TileGrid") continue;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Id === id) {
              tileFrameIndex = frameIndex;
              tileAction = tile.Action ?? null;
              break outer;
            }
          }
        }
      }
    }

    if (
      tileAction?.ObjectType === "WebLink" ||
      tileAction?.ObjectType === "DynamicForm"
    ) {
      const frameKey = tileAction.ObjectId || `form-frame-${id}`;
      // Prefer the canonical URL stored on the page record; fall back to tile Action
      const page = pagesRef.current.find(
        (p: any) => p.PageId === tileAction.ObjectId,
      );
      const url = page?.PageLinkStructure?.Url ?? tileAction.ObjectUrl;
      if (!url) {
        handleCollapseDescendants(tileFrameIndex);
        return;
      }
      handleTileNavigate(frameKey, tileFrameIndex);
      setNavSourceTiles((prev) => ({ ...prev, [frameKey]: id }));
      setNavUrls((prev) => ({ ...prev, [frameKey]: url }));
    } else if (
      tileAction?.ObjectId &&
      PAGE_NAV_TYPES.has(tileAction.ObjectType)
    ) {
      handleTileNavigate(tileAction.ObjectId, tileFrameIndex);
      setNavSourceTiles((prev) => ({ ...prev, [tileAction.ObjectId]: id }));
    } else {
      handleCollapseDescendants(tileFrameIndex);
    }
  }

  // ── Tile action menu ─────────────────────────────────────────────────────

  async function handleTileMenuAction(tileId: string, action: TileMenuAction) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;

    if (action.type === "copy-tile") {
      pushSnapshot();
      setInfoContent((prev) => applyCopyTile(prev, tileId));
      setNavContents((prev) => {
        const next: Record<string, any[]> = {};
        for (const [id, blocks] of Object.entries(prev))
          next[id] = applyCopyTile(blocks, tileId);
        return next;
      });
      return;
    }

    if (action.type === "existing-page") {
      const searchInBlocks = (blocks: any[]) =>
        blocks.some((b) =>
          (b.Columns ?? []).some((c: any) =>
            (c.Tiles ?? []).some((t: any) => t.Id === tileId),
          ),
        );
      let parentIndex = -1;
      if (!searchInBlocks(infoContentRef.current)) {
        const stack = navStackRef.current;
        for (let i = 0; i < stack.length; i++) {
          if (searchInBlocks(navContentsRef.current[stack[i]] ?? [])) {
            parentIndex = i;
            break;
          }
        }
      }
      const objectUrl = action.objectUrl ?? "";
      pushSnapshot();
      handleEditTile(tileId, {
        Action: {
          ObjectType: action.objectType,
          ObjectId: action.pageId,
          ObjectUrl: objectUrl,
          FormId: 0,
        },
      });
      handleTileNavigate(action.pageId, parentIndex);
      setNavSourceTiles((prev) => ({ ...prev, [action.pageId]: tileId }));
      if (action.objectType === "WebLink" && objectUrl)
        setNavUrls((prev) => ({ ...prev, [action.pageId]: objectUrl }));
      return;
    }

    if (action.type === "direct-link" && action.linkType === "Weblink") {
      const url = action.value;
      const searchInBlocks = (blocks: any[]) =>
        blocks.some((b) =>
          (b.Columns ?? []).some((c: any) =>
            (c.Tiles ?? []).some((t: any) => t.Id === tileId),
          ),
        );
      let parentIndex = -1;
      if (!searchInBlocks(infoContentRef.current)) {
        const stack = navStackRef.current;
        for (let i = 0; i < stack.length; i++) {
          if (searchInBlocks(navContentsRef.current[stack[i]] ?? [])) {
            parentIndex = i;
            break;
          }
        }
      }
      const existing = (cv.Page ?? []).find(
        (p: any) => p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
      );
      if (existing) {
        pushSnapshot();
        handleEditTile(tileId, {
          Action: {
            ObjectType: "WebLink",
            ObjectId: existing.PageId,
            ObjectUrl: url,
            FormId: 0,
          },
        });
        handleTileNavigate(existing.PageId, parentIndex);
        setNavSourceTiles((prev) => ({ ...prev, [existing.PageId]: tileId }));
        setNavUrls((prev) => ({ ...prev, [existing.PageId]: url }));
      } else {
        try {
          const newPage = await createLinkPage({
            appVersionId: cv.AppVersionId,
            pageName: action.label || url,
            url,
            WWPFormId: 0,
          });
          if (!newPage?.PageId) throw new Error("no page");
          const pageUrl = newPage.PageLinkStructure?.Url ?? url;
          pushSnapshot();
          const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
          dataStore.set("Current_Version", updated);
          setCurrentVersion(updated);
          handleEditTile(tileId, {
            Action: {
              ObjectType: "WebLink",
              ObjectId: newPage.PageId,
              ObjectUrl: pageUrl,
              FormId: 0,
            },
          });
          handleTileNavigate(newPage.PageId, parentIndex);
          setNavSourceTiles((prev) => ({ ...prev, [newPage.PageId]: tileId }));
          setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
        } catch {
          pushSnapshot();
          handleEditTile(tileId, {
            Action: {
              ObjectType: "WebLink",
              ObjectUrl: url,
              FormId: 0,
            },
          });
        }
      }
      return;
    }

    if (action.type === "direct-link") {
      pushSnapshot();
      const objectId =
        action.linkType === "Phone" ? `RYjufBtwDa${Date.now()}` : "";
      handleEditTile(tileId, {
        ...(action.label ? { Text: action.label } : {}),
        Action: {
          ObjectType: action.linkType,
          ObjectId: objectId,
          ObjectUrl: action.value,
          FormId: 0,
        },
      });
      return;
    }

    if (action.type === "form") {
      const searchInBlocks = (blocks: any[]) =>
        blocks.some((b) =>
          (b.Columns ?? []).some((c: any) =>
            (c.Tiles ?? []).some((t: any) => t.Id === tileId),
          ),
        );
      let parentIndex = -1;
      if (!searchInBlocks(infoContentRef.current)) {
        const stack = navStackRef.current;
        for (let i = 0; i < stack.length; i++) {
          if (searchInBlocks(navContentsRef.current[stack[i]] ?? [])) {
            parentIndex = i;
            break;
          }
        }
      }
      try {
        const newPage = await createLinkPage({
          appVersionId: cv.AppVersionId,
          pageName: action.pageName,
          url: "",
          WWPFormId: Number(action.formId),
          WWPFormReferenceName: action.formReferenceName,
        });
        if (!newPage?.PageId) throw new Error("no page");
        const url = newPage.PageLinkStructure?.Url ?? "";
        pushSnapshot();
        const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
        dataStore.set("Current_Version", updated);
        setCurrentVersion(updated);
        handleEditTile(tileId, {
          Action: {
            ObjectType: newPage.PageType ?? "DynamicForm",
            ObjectId: newPage.PageId,
            ObjectUrl: url,
            FormId: Number(action.formId),
          },
        });
        handleTileNavigate(newPage.PageId, parentIndex);
        setNavSourceTiles((prev) => ({ ...prev, [newPage.PageId]: tileId }));
        setNavUrls((prev) => ({ ...prev, [newPage.PageId]: url }));
      } catch {
        pushSnapshot();
        handleEditTile(tileId, {
          Action: {
            ObjectType: "DynamicForm",
            ObjectId: action.formId,
            ObjectUrl: "",
          },
        });
      }
      return;
    }

    if (action.type === "new-page") {
      // Find which frame index the tile lives in (-1 = home frame)
      const searchInBlocks = (blocks: any[]) =>
        blocks.some((b) =>
          (b.Columns ?? []).some((c: any) =>
            (c.Tiles ?? []).some((t: any) => t.Id === tileId),
          ),
        );
      let parentIndex = -1;
      if (!searchInBlocks(infoContentRef.current)) {
        const stack = navStackRef.current;
        for (let i = 0; i < stack.length; i++) {
          if (searchInBlocks(navContentsRef.current[stack[i]] ?? [])) {
            parentIndex = i;
            break;
          }
        }
      }

      pendingNewPageTileRef.current = tileId;
      setNavStack((prev) => {
        const clean = prev.filter((id) => id !== NEW_PAGE_SENTINEL);
        return [...clean.slice(0, parentIndex + 1), NEW_PAGE_SENTINEL];
      });
      setNavContents((prev) => ({ ...prev, [NEW_PAGE_SENTINEL]: [] }));
    }
  }

  // ── CTA click — select + navigate for WebLink CTAs ──────────────────────

  function handleCtaClick(ctaId: string) {
    handleSelectCta(ctaId);
    const allBlocks = [
      ...infoContentRef.current,
      ...Object.values(navContentsRef.current).flat() as any[],
    ];
    const block = allBlocks.find(
      (b: any) => b.InfoType === "Cta" && b.InfoId === ctaId,
    );
    const action = block?.CtaAttributes?.Action;
    if (action?.ObjectType === "WebLink" && action?.ObjectId) {
      const frames = [
        { frameIndex: -1 as number, blocks: infoContentRef.current },
        ...navStackRef.current.map((pid: string, i: number) => ({
          frameIndex: i,
          blocks: navContentsRef.current[pid] ?? [],
        })),
      ];
      let ctaFrameIndex = -1;
      for (const { frameIndex, blocks } of frames) {
        if (
          blocks.some((b: any) => b.InfoType === "Cta" && b.InfoId === ctaId)
        ) {
          ctaFrameIndex = frameIndex;
          break;
        }
      }
      const page = pagesRef.current.find(
        (p: any) => p.PageId === action.ObjectId,
      );
      const url = page?.PageLinkStructure?.Url ?? action.ObjectUrl;
      if (url) {
        handleTileNavigate(action.ObjectId, ctaFrameIndex);
        setNavUrls((prev) => ({ ...prev, [action.ObjectId]: url }));
      }
    }
  }

  async function handleCtaWeblinkSave(
    ctaId: string,
    url: string,
    label: string,
  ) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;

    const allFrames = [
      { frameIndex: -1 as number, blocks: infoContentRef.current },
      ...navStackRef.current.map((pid: string, i: number) => ({
        frameIndex: i,
        blocks: navContentsRef.current[pid] ?? [],
      })),
    ];
    let ctaFrameIndex = -1;
    for (const { frameIndex, blocks } of allFrames) {
      if (blocks.some((b: any) => b.InfoType === "Cta" && b.InfoId === ctaId)) {
        ctaFrameIndex = frameIndex;
        break;
      }
    }

    const existing = (cv.Page ?? []).find(
      (p: any) =>
        p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
    );
    if (existing) {
      pushSnapshot();
      handleEditCta(ctaId, {
        CtaAction: url,
        Action: {
          ObjectType: "WebLink",
          ObjectId: existing.PageId,
          ObjectUrl: url,
        },
      });
      handleTileNavigate(existing.PageId, ctaFrameIndex);
      setNavUrls((prev) => ({ ...prev, [existing.PageId]: url }));
      return;
    }
    try {
      const newPage = await createLinkPage({
        appVersionId: cv.AppVersionId,
        pageName: label || url,
        url,
        WWPFormId: 0,
      });
      if (!newPage?.PageId) throw new Error("no page");
      const pageUrl = newPage.PageLinkStructure?.Url ?? url;
      pushSnapshot();
      const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
      dataStore.set("Current_Version", updated);
      setCurrentVersion(updated);
      handleEditCta(ctaId, {
        CtaAction: url,
        Action: {
          ObjectType: "WebLink",
          ObjectId: newPage.PageId,
          ObjectUrl: pageUrl,
        },
      });
      handleTileNavigate(newPage.PageId, ctaFrameIndex);
      setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
    } catch {
      handleEditCta(ctaId, { CtaAction: url });
    }
  }

  // ── Linked frames ────────────────────────────────────────────────────────

  const linkedFrames = buildLinkedFrames({
    navStack,
    navContents,
    navUrls,
    allPages,
    pushSnapshot,
    isResizingRef,
    selectedTileId,
    setSelectedTileId,
    setSelectedCtaId,
    setPendingCta,
    navUpdater,
    handleCloseFromIndex,
    handleEditTile,
    handleSelectCta: handleCtaClick,
    handleEditCta,
    handleTileDoubleClick,
    onCommitNewPage: handleCommitNewPage,
    onCancelNewPage: handleCancelNewPage,
  });

  // ── Render ───────────────────────────────────────────────────────────────

  if (isPreviewMode) {
    return (
      <PreviewLayout
        infoContent={infoContent}
        linkedFrames={linkedFrames}
        homePageId={homePageId}
        themeColors={selectedTheme?.ThemeColors}
        themeIcons={selectedTheme?.ThemeIcons ?? []}
        themeCtaColors={selectedTheme?.ThemeCtaColors ?? []}
        onSelectTile={handlePreviewTileSelect}
        onTileNavigate={handleTileNavigate}
        onCollapseDescendants={handleCollapseDescendants}
        activeNavTileIds={activeNavTileIds}
        onActiveFrameChange={handleActiveFrameChange}
      />
    );
  }

  return (
    <>
      <NavBar
        version={currentVersion}
        appVersions={appVersions as any}
        selectedVersionId={currentVersion?.AppVersionId}
        onVersionSelect={handleVersionSelect}
        onNewVersion={() => setShowCreateModal(true)}
        onNewTemplate={() => setShowCreateTemplateModal(true)}
        onDuplicateVersion={(id) =>
          setDuplicateVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        onRenameVersion={(id) =>
          setRenameVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        onUpdateTranslations={(id) =>
          setUpdateTranslationsVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        onMoveVersionToTrash={(id) =>
          setTrashVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={(themeId) => {
          pushSnapshot();
          setSelectedThemeId(themeId);
          if (currentVersion?.AppVersionId)
            updateAppVersionTheme(currentVersion.AppVersionId, themeId).catch(
              () => {},
            );
        }}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExpand={() => setTreeOpen((v) => !v)}
        isSaving={isSaving}
        saveError={saveError}
        savedAt={savedAt}
        isTranslationOpen={isTranslationOpen}
        onTranslationToggle={() => setIsTranslationOpen((v) => !v)}
        isHistoryOpen={isHistoryOpen}
        onHistoryToggle={() => setIsHistoryOpen((v) => !v)}
        analysisIssues={analysisIssues}
        analysisIssueCount={analysisIssues.length}
        isAnalyzing={isAnalyzing}
        onAnalysisOpen={openAnalysis}
        onAnalysisRerun={rerunAnalysis}
        analysisOpen={analysisOpen}
        analysisCurrentIndex={Math.min(
          analysisIndex,
          Math.max(0, analysisIssues.length - 1),
        )}
        onAnalysisPrev={handleAnalysisPrev}
        onAnalysisNext={handleAnalysisNext}
        onAnalysisClose={() => setAnalysisOpen(false)}
        onPublish={() => setShowPublishModal(true)}
        onShareClick={() => setShowShareModal(true)}
        onTrashClick={() => setShowTrashModal(true)}
        isMultiSelectMode={isMultiSelectMode}
        onMultiSelectToggle={() => {
          if (!isMultiSelectMode) {
            setSelectedTileId(null);
            setSelectedCtaId(null);
          }
          toggleMultiSelectMode();
        }}
      />
      <EditorModals
        showPublishModal={showPublishModal}
        currentVersion={currentVersion}
        appVersions={appVersions}
        analysisIssueCount={analysisIssues.length}
        onPublished={() => setShowPublishModal(false)}
        onClosePublish={() => setShowPublishModal(false)}
        onFixIssues={() => { setShowPublishModal(false); setAnalysisOpen(true); }}
        showShareModal={showShareModal}
        shareLink={currentVersion?.AppVersionId ? `${getBaseUrl()}/wp_applicationdesign_preview?AppVersionId=${currentVersion.AppVersionId}` : ""}
        onCloseShare={() => setShowShareModal(false)}
        showCreateModal={showCreateModal}
        templatesCollection={templatesCollection}
        themeColors={selectedTheme?.ThemeColors}
        themeIcons={selectedTheme?.ThemeIcons ?? []}
        onCloseCreate={() => setShowCreateModal(false)}
        onVersionCreated={handleVersionCreated}
        showCreateTemplateModal={showCreateTemplateModal}
        onCloseCreateTemplate={() => setShowCreateTemplateModal(false)}
        onTemplateCreated={handleTemplateCreated}
        renameVersion={renameVersion}
        onCloseRename={() => setRenameVersion(null)}
        onVersionRenamed={handleVersionRenamed}
        trashVersion={trashVersion}
        onCloseTrash={() => setTrashVersion(null)}
        onVersionDeleted={handleVersionDeleted}
        duplicateVersion={duplicateVersion}
        onCloseDuplicate={() => setDuplicateVersion(null)}
        onVersionDuplicated={handleVersionDuplicated}
        updateTranslationsVersion={updateTranslationsVersion}
        onCloseUpdateTranslations={() => setUpdateTranslationsVersion(null)}
        onTranslationsUpdated={handleTranslationsUpdated}
        showTrashModal={showTrashModal}
        onCloseTrashModal={() => setShowTrashModal(false)}
        onTrashChanged={() => {
          getAppVersions().then(setAppVersions).catch(() => {});
          getActiveAppVersion().then((fetched: any) => {
            const full = { ...fetched, Page: fetched.Page ?? fetched.Pages ?? [] };
            dataStore.set("Current_Version", full);
            setCurrentVersion(full);
          }).catch(() => {});
        }}
        tileImageModal={tileImageModal}
        onTileImageConfirm={handleTileImageConfirm}
        onCloseTileImage={() => setTileImageModal(null)}
        pendingCta={pendingCta}
        onConfirmCta={handleConfirmCta}
        onCancelCta={() => setPendingCta(null)}
      />
      <div className="app-body">
        {treeOpen && (
          <PageBubbleTree
            allPages={allPages}
            infoContent={infoContent}
            navContents={navContents}
            navStack={navStack}
            themeColors={selectedTheme?.ThemeColors}
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            onClose={() => setTreeOpen(false)}
            onNavigateToPath={(pageIds) => {
              handleNavigateToPath(pageIds);
              setTreeOpen(false);
            }}
            onDeletePage={handleDeletePage}
          />
        )}
        <MainCanvas
          isReadOnly={isTranslationOpen}
          themeColors={selectedTheme?.ThemeColors}
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          infoContent={infoContent}
          selectedTileId={selectedTileId}
          onSelectTile={handleSelectTile}
          onAddColumn={handleAddColumn}
          onDeleteTile={handleDeleteTile}
          onEditTile={handleEditTile}
          onAddTilesToColumn={handleAddTilesToColumn}
          onAddStandaloneTile={handleAddStandaloneTile}
          onAddBlock={handleAddBlock}
          onFreeResizeRelease={handleFreeResizeRelease}
          onTileDrop={handleTileDrop}
          onTileDropAsNewBlock={handleTileDropAsNewBlock}
          onCrossFrameTileDrop={handleCrossFrameTileDrop}
          onCrossFrameTileDropToEmpty={handleCrossFrameTileDropToEmpty}
          onCrossFrameTileDropAsNewBlock={handleCrossFrameTileDropAsNewBlock}
          linkedFrames={linkedFrames}
          onTileNavigate={handleTileNavigate}
          onCollapseDescendants={handleCollapseDescendants}
          activeNavTileIds={activeNavTileIds}
          onAddDescription={handleAddDescription}
          onEditDescription={handleEditDescription}
          onDeleteBlock={handleDeleteBlock}
          onMoveBlock={handleMoveBlock}
          onCrossFrameBlockDrop={handleCrossFrameBlockDrop}
          onAddImage={handleAddImage}
          onEditImage={handleEditImage}
          onTileDoubleClick={handleTileDoubleClick}
          onDeselectTile={() => {
            setSelectedTileId(null);
            setSelectedCtaId(null);
          }}
          onSelectCta={handleCtaClick}
          onEditCta={handleEditCta}
          selectedCtaId={selectedCtaId}
          themeCtaColors={selectedTheme?.ThemeCtaColors ?? []}
          onTileMenuAction={handleTileMenuAction}
          onRenamePage={handleRenamePage}
          liveTileText={liveTileText}
          liveCtaLabel={liveCtaLabel}
          analysisHighlight={analysisHighlight}
          onActiveFrameChange={handleActiveFrameChange}
          appVersionId={currentVersion?.AppVersionId}
          onDeletePage={handleDeletePage}
          isMultiSelectMode={isMultiSelectMode}
          onSelectionChange={(tileIds, ctaIds) => {
            setSelectedTileIds(tileIds);
            setSelectedCtaIds(ctaIds);
          }}
          onExitMultiSelectMode={exitMultiSelectMode}
          multiSelectedTileIds={selectedTileIds}
          multiSelectedCtaIds={selectedCtaIds}
        />
        {isHistoryOpen ? (
          <VersionHistorySidebar
            appVersionId={currentVersion?.AppVersionId}
            onClose={() => setIsHistoryOpen(false)}
            onRestored={handleVersionRestored}
          />
        ) : isTranslationOpen ? (
          <TranslationSideBar
            appVersionId={currentVersion?.AppVersionId ?? ""}
            appVersionLanguage={currentVersion?.AppVersionLanguage ?? ""}
            appVersionMultiLanguages={appVersionMultiLanguages}
            activePageId={transPageId}
            pageName={transPageName}
            themeColors={selectedTheme?.ThemeColors}
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            ctaColors={selectedTheme?.ThemeCtaColors ?? []}
          />
        ) : isActivePageBlank ? (
          <TemplateSidebar
            templates={pageTemplates}
            onApply={handleApplyTemplate}
          />
        ) : (
          <SidebarRight
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            themeColors={selectedTheme?.ThemeColors}
            ctaColors={selectedTheme?.ThemeCtaColors ?? []}
            moodId={currentVersion?.MoodId}
            selectedTile={selectedTile}
            onEditTile={handleEditTile}
            onOpenTileImage={handleOpenTileImageFromSidebar}
            onBeforeOpacityChange={pushSnapshot}
            onBeforeTileTextEdit={pushSnapshot}
            onLiveTileText={(id, text) => setLiveTileText({ id, text })}
            onEndLiveTileText={() => setLiveTileText(null)}
            onBeforeTileActionEdit={pushSnapshot}
            pageName={activePageName}
            selectedCta={selectedCta}
            onEditCta={handleEditCta}
            onBeforeCtaEdit={pushSnapshot}
            onCtaWeblinkSave={handleCtaWeblinkSave}
            onLiveCtaLabel={(id, label) => setLiveCtaLabel({ id, label })}
            onEndLiveCtaLabel={() => setLiveCtaLabel(null)}
            selectedTileIds={selectedTileIds}
            selectedCtaIds={selectedCtaIds}
            onBulkEditTiles={handleBulkEditTiles}
            onBulkEditCtas={handleBulkEditCtas}
          />
        )}
      </div>
      {isBusy && !reviewOnly && (
        <BusyModal onReviewOnly={() => setReviewOnly(true)} />
      )}
    </>
  );
}

export default App;
