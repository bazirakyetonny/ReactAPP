import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  getAppVersions,
  getActiveAppVersion,
  activateAppVersion,
  updateAppVersionCategory,
  restoreHistoryVersion,
  type SDTAppVersion,
  type AppVersionHistoryEntry,
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
import { AlertMessage, type AlertStatus } from "./components/AlertMessage";
import { dataStore } from "./data/datastore";
import type { Theme, CategoryTemplates, TrnPageTemplate } from "./types";
import {
  parseInfoContent,
  applyEditTile,
  applyAddBlock,
  applyCopyTile,
  applyDeleteTile,
  applyPasteBlocks,
} from "./utils/contentTransforms";
import {
  createInfoPage,
  updatePageTitle,
  createLinkPage,
  updateLinkPage,
  deletePage,
  savePage,
} from "./services/pagesApi";
import { getTrash, restoreTrash } from "./services/trashApi";
import { translateAppVersion } from "./services/translationApi";
import { NEW_PAGE_SENTINEL } from "./utils/linkedFrames";
import type { TileMenuAction } from "./components/tile/TileActionMenu";
import { ReplacePageActionModal } from "./components/phone/ReplacePageActionModal";
import { buildLinkedFrames } from "./utils/linkedFrames";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useNavigation } from "./hooks/useNavigation";
import { useContentHandlers } from "./hooks/useContentHandlers";
import { useAutoSave } from "./hooks/useAutoSave";
import { useAnalysis } from "./hooks/useAnalysis";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { BusyModal } from "./components/BusyModal";
import { usePageGraph } from "./components/tree/usePageGraph";
import { i18n } from "./i18n/i18n";

function getLinkedPageUrl(page: any): string {
  if (page?.PageLinkStructure?.Url) return page.PageLinkStructure.Url;
  try {
    return JSON.parse(page?.PageStructure ?? "{}")?.Url ?? "";
  } catch {
    return "";
  }
}

function App() {
  const langMap: Record<string, string> = { English: "en", Dutch: "nl" };
  i18n.locale = langMap[dataStore.get("Current_Language") as string] ?? "en";
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
  const [updateDescriptionVersion, setUpdateDescriptionVersion] =
    useState<SDTAppVersion | null>(null);
  useEffect(() => {
    if (isPreviewMode) return;
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kick off translation whenever a new app version becomes current,
  // prioritising the home page.
  useEffect(() => {
    if (isPreviewMode) return;
    const versionId = currentVersion?.AppVersionId;
    if (!versionId) return;
    let langs: string[] = [];
    try {
      langs = JSON.parse(currentVersion?.AppVersionMultiLanguages ?? "[]");
    } catch {
      // ignore malformed language list
    }
    if (!langs.length) return;
    const pages: any[] = currentVersion?.Page ?? currentVersion?.Pages ?? [];
    const homePageId = pages.find(
      (p: any) => p.PageName?.toLowerCase() === "home",
    )?.PageId;
    translateAppVersion({
      appVersionId: versionId,
      languageFrom: currentVersion?.AppVersionLanguage ?? "",
      languageToCollection: langs,
      activePageId: homePageId,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVersion?.AppVersionId]);

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get("CurrentThemeId") ?? themes[0]?.ThemeId ?? "",
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedCtaId, setSelectedCtaId] = useState<string | null>(null);
  const [infoContent, setInfoContent] = useState<any[]>(parseInfoContent);
  const [isTranslationOpen, setIsTranslationOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewingNumber, setPreviewingNumber] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const historyStashRef = useRef<{
    infoContent: any[];
    navContents: Record<string, any[]>;
    navStack: string[];
    navSourceTiles: Record<string, string>;
    navUrls: Record<string, string>;
    currentVersion: any;
    themeId: string;
  } | null>(null);
  const [translationRevision, setTranslationRevision] = useState(0);
  const [navTranslationRevision, setNavTranslationRevision] = useState(0);
  const [activeFramePageId, setActiveFramePageId] = useState<string | null>(
    null,
  );
  // Last template applied via the template sidebar; json is the serialized
  // content written at apply time so we can tell when the page diverges.
  const [appliedTemplate, setAppliedTemplate] = useState<{
    pageId: string;
    templateId: string;
    json: string;
  } | null>(null);
  const [translationHighlight, setTranslationHighlight] = useState<{
    blockId: string;
    tileId?: string;
    language: string;
    message: string;
  } | null>(null);
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
  const [showPublishAsTemplateModal, setShowPublishAsTemplateModal] =
    useState(false);
  const [showUnpublishTemplateModal, setShowUnpublishTemplateModal] =
    useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [showNavPaths, setShowNavPaths] = useState(false);
  const [trashedPageIds, setTrashedPageIds] = useState<Set<string>>(new Set());
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    status: AlertStatus;
  } | null>(null);

  function refreshTrashedPageIds() {
    getTrash()
      .then((items) => {
        setTrashedPageIds(
          new Set(items.filter((i) => i.Page).map((i) => i.Page.PageId)),
        );
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (!treeOpen) return;
    refreshTrashedPageIds();
  }, [treeOpen]);
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
    handleDeletePage: _handleDeletePage,
    handleCloseFromIndex,
  } = useNavigation();

  function handleDeletePage(pageId: string) {
    _handleDeletePage(pageId);
    setTrashedPageIds((prev) => new Set([...prev, pageId]));
    const updated = dataStore.get("Current_Version");
    if (updated) setCurrentVersion(updated);
  }

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
      const currentPages: any[] = cv.Pages ?? [];

      const renamedPages = pages.filter((p: any) => {
        const cur = currentPages.find((c: any) => c.PageId === p.PageId);
        return cur && cur.PageName !== p.PageName;
      });
      const restoredPageIds = pages
        .filter(
          (p: any) => !currentPages.some((c: any) => c.PageId === p.PageId),
        )
        .map((p: any) => p.PageId);
      const reDeletedPageIds = currentPages
        .filter((c: any) => !pages.some((p: any) => p.PageId === c.PageId))
        .map((c: any) => c.PageId);

      // Rebuild Page: keep all existing entries, apply renames/restores/re-deletes
      const updatedPage = [
        ...(cv.Page ?? [])
          .filter((p: any) => !reDeletedPageIds.includes(p.PageId))
          .map((p: any) => {
            const renamed = renamedPages.find(
              (r: any) => r.PageId === p.PageId,
            );
            return renamed ? { ...p, PageName: renamed.PageName } : p;
          }),
        ...pages.filter((p: any) => restoredPageIds.includes(p.PageId)),
      ];

      const updated = { ...cv, Page: updatedPage, Pages: pages };
      dataStore.set("Current_Version", updated);
      setCurrentVersion(updated);

      const apiFns: (() => Promise<void>)[] = [];

      if (renamedPages.length > 0) {
        apiFns.push(() =>
          Promise.all(
            renamedPages.map((p: any) =>
              updatePageTitle(cv.AppVersionId, p.PageId, p.PageName),
            ),
          ).then(() => undefined),
        );
      }
      if (restoredPageIds.length > 0) {
        apiFns.push(() =>
          getTrash().then((items) =>
            Promise.all(
              restoredPageIds.map((pageId: string) => {
                const item = items.find((i) => i.Page?.PageId === pageId);
                return item
                  ? restoreTrash(item.Type, item.TrashId)
                  : Promise.resolve();
              }),
            ).then(() => undefined),
          ),
        );
      }
      if (reDeletedPageIds.length > 0) {
        apiFns.push(() =>
          Promise.all(
            reDeletedPageIds.map((pageId: string) =>
              deletePage(cv.AppVersionId, pageId).then(() => undefined),
            ),
          ).then(() => undefined),
        );
      }

      if (apiFns.length > 0) {
        runSaveRef.current?.(() =>
          apiFns.reduce<Promise<void>>(
            (chain, fn) => chain.then(fn),
            Promise.resolve(),
          ),
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
    setNavStack,
    navSourceTiles,
    selectedTileId,
    setSelectedTileId,
    setSelectedCtaId,
    setPendingCta,
    pushSnapshot,
    isResizingRef,
    onNewTileCreated: () => setNavStack([]),
    onNewBlockAdded: scrollToNewBlock,
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

  async function handleHistoryPreview(item: AppVersionHistoryEntry) {
    if (!currentVersion?.AppVersionId) return;
    if (!historyStashRef.current) {
      historyStashRef.current = {
        infoContent: infoContentRef.current,
        navContents: navContentsRef.current,
        navStack: navStackRef.current,
        navSourceTiles: { ...navSourceTiles },
        navUrls: { ...navUrls },
        currentVersion: dataStore.get("Current_Version"),
        themeId: selectedThemeId,
      };
    }
    setPreviewingNumber(item.AppVersionNumber);
    setLoadingPreview(true);
    try {
      await restoreHistoryVersion(currentVersion.AppVersionId, item.AppVersionNumber);
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

      // Save original data back to DB so a browser refresh keeps the original
      const stash = historyStashRef.current;
      if (stash) {
        const cv = stash.currentVersion;
        const vId = cv?.AppVersionId;
        if (vId) {
          const homePage = (cv.Page ?? []).find(
            (p: any) => p.PageName?.toLowerCase() === "home",
          );
          if (homePage) {
            savePage({
              AppVersionId: vId,
              PageId: homePage.PageId,
              PageName: homePage.PageName,
              PageType: homePage.PageType,
              PageStructure: JSON.stringify({ InfoContent: stash.infoContent }),
            }).catch(() => {});
          }
          for (const [pageId, content] of Object.entries(stash.navContents)) {
            const page = (cv.Page ?? []).find((p: any) => p.PageId === pageId);
            if (page) {
              savePage({
                AppVersionId: vId,
                PageId: page.PageId,
                PageName: page.PageName,
                PageType: page.PageType,
                PageStructure: JSON.stringify({ InfoContent: content }),
              }).catch(() => {});
            }
          }
          updateAppVersionTheme(vId, stash.themeId).catch(() => {});
        }
      }
    } catch {
      // silently swallow
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleHistoryClose() {
    const stash = historyStashRef.current;
    if (stash) {
      dataStore.set("Current_Version", stash.currentVersion);
      setCurrentVersion(stash.currentVersion);
      setSelectedThemeId(stash.themeId);
      setInfoContent(stash.infoContent);
      setNavStack(stash.navStack);
      setNavContents(stash.navContents);
      setNavSourceTiles(stash.navSourceTiles);
      setNavUrls(stash.navUrls);
      clearHistory();
      setSelectedTileId(null);
      historyStashRef.current = null;
    }
    setPreviewingNumber(null);
    setLoadingPreview(false);
    setIsHistoryOpen(false);
  }

  async function handleVersionRestored() {
    historyStashRef.current = null;
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
      setPreviewingNumber(null);
      setIsHistoryOpen(false);
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const selectedTheme = themes.find((t) => t.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get("Current_Version")?.Page ?? [];
  const pageGraph = usePageGraph(allPages, infoContent, navContents);
  let activePageId = navStack[navStack.length - 1];
  let activePage = allPages.find((p) => p.PageId === activePageId);
  if (!activePage) {
    activePage = allPages.find((p) => p.PageName.toLowerCase() === "home");
    activePageId = activePage?.PageId;
  }
  const activePageName = activePage?.PageName ?? "Home";

  // activeFramePageId tracks whichever phone frame is visually active
  // (phone-frame--active); null = home frame. Drives the translation and
  // template sidebars.
  const homePage = allPages.find(
    (p: any) => p.PageName.toLowerCase() === "home",
  );
  const transPage = activeFramePageId
    ? allPages.find((p: any) => p.PageId === activeFramePageId)
    : homePage;
  const transPageId = transPage?.PageId ?? homePage?.PageId ?? "";
  const transPageName = transPage?.PageName ?? "Home";
  const transPageType =
    transPage?.PageType ?? homePage?.PageType ?? "Information";

  // When a WebLink page enters the nav stack (tree, analysis, or tile navigation),
  // ensure its URL is in navUrls so the iframe renders correctly.
  useEffect(() => {
    setNavUrls((prev) => {
      const updates: Record<string, string> = {};
      for (const pageId of navStack) {
        if (prev[pageId]) continue;
        const page = allPages.find((p: any) => p.PageId === pageId);
        if (page?.PageType === "WebLink" || page?.PageType === "DynamicForm") {
          const url = getLinkedPageUrl(page);
          if (url) updates[pageId] = url;
        }
      }
      return Object.keys(updates).length ? { ...prev, ...updates } : prev;
    });
  }, [navStack, allPages]);

  function handleActiveFrameChange(pageId: string | null) {
    setActiveFramePageId(pageId); // null = home frame active
  }

  const appVersionMultiLanguages: string[] = (() => {
    try {
      return JSON.parse(currentVersion?.AppVersionMultiLanguages ?? "[]");
    } catch {
      return [];
    }
  })();

  const baseLanguage: string = (
    currentVersion?.AppVersionLanguage ?? ""
  ).toLowerCase();
  const translationLanguages = appVersionMultiLanguages.filter(
    (l) => l.toLowerCase() !== baseLanguage,
  );
  const canTranslate =
    !!(dataStore.get("HasMultiLingualSupport") as boolean | undefined) &&
    translationLanguages.length > 0;

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
    if (navStack.length === 0) return new Set<string>();
    const ids = new Set<string>();
    for (const [pageId, sourceTileId] of Object.entries(navSourceTiles)) {
      const pageIdx = navStack.indexOf(pageId);
      if (pageIdx === -1) continue;
      // Resolve the parent frame content (the frame that contains the source tile)
      const parentPageId = pageIdx > 0 ? navStack[pageIdx - 1] : null;
      const parentContent: any[] =
        parentPageId !== null ? (navContents[parentPageId] ?? []) : infoContent;
      // Clear nav-active when a DIFFERENT tile is selected in the same frame
      const otherTileInParent =
        !!selectedTileId &&
        selectedTileId !== sourceTileId &&
        parentContent.some(
          (b: any) =>
            b.InfoType === "TileGrid" &&
            (b.Columns ?? []).some((c: any) =>
              (c.Tiles ?? []).some((t: any) => t.Id === selectedTileId),
            ),
        );
      // Clear nav-active when any CTA is selected in the same frame
      const ctaInParent =
        !!selectedCtaId &&
        parentContent.some((b: any) => b.InfoId === selectedCtaId);
      if (!otherTileInParent && !ctaInParent) ids.add(sourceTileId);
    }
    return ids;
  }, [
    navStack,
    navSourceTiles,
    navContents,
    infoContent,
    selectedTileId,
    selectedCtaId,
  ]);

  // ── Translation save indicator ───────────────────────────────────────────

  const [isTranslationSaving, setIsTranslationSaving] = useState(false);
  const [translationSaveError, setTranslationSaveError] = useState(false);
  const [translationSavedAt, setTranslationSavedAt] = useState<number | null>(
    null,
  );

  // ── Auto-save ────────────────────────────────────────────────────────────

  const { isSaving, isDirty, saveError, savedAt, runSave, flushSave } =
    useAutoSave(infoContent, navContents, currentVersion?.AppVersionId);
  runSaveRef.current = runSave;

  const flushSaveRef = useRef(flushSave);
  flushSaveRef.current = flushSave;

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
    disabled: isPreviewMode || isHistoryOpen,
    translationLanguages: canTranslate ? translationLanguages : [],
    translationRevision,
    navTranslationRevision,
    isTranslationOpen,
    activePageId: transPageId,
  });

  const {
    isMultiSelectMode,
    selectedTileIds,
    selectedCtaIds,
    selectedImageIds,
    selectedDescriptionIds,
    toggleMultiSelectMode,
    exitMultiSelectMode,
    setSelectedTileIds,
    setSelectedCtaIds,
    setSelectedImageIds,
    setSelectedDescriptionIds,
  } = useMultiSelect();

  const [clipboard, setClipboard] = useState<any[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isMultiSelectMode) exitMultiSelectMode();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMultiSelectMode, exitMultiSelectMode]);

  function handleBulkEditTiles(patch: Record<string, any>) {
    pushSnapshot();
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
    pushSnapshot();
    const applyCtaPatch = (blocks: any[]) =>
      blocks.map((block: any) =>
        block.InfoType === "Cta" && selectedCtaIds.has(block.InfoId)
          ? {
              ...block,
              CtaAttributes: { ...(block.CtaAttributes ?? {}), ...patch },
            }
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

  function collectClipboardItems(sourceBlocks: any[]): any[] {
    const items: any[] = [];
    const seen = new Set<string>();
    for (const block of sourceBlocks) {
      if (block.InfoType === "TileGrid") {
        // Preserve column structure: keep only columns that contain at least
        // one selected tile, with only the selected tiles inside each column.
        const selectedColumns = (block.Columns ?? []).reduce(
          (acc: any[], col: any) => {
            const selectedTiles = (col.Tiles ?? []).filter(
              (t: any) => selectedTileIds.has(t.Id) && !seen.has(t.Id),
            );
            if (selectedTiles.length > 0) {
              selectedTiles.forEach((t: any) => seen.add(t.Id));
              acc.push({ ...col, Tiles: selectedTiles });
            }
            return acc;
          },
          [],
        );
        if (selectedColumns.length > 0) {
          items.push({
            ...block,
            InfoId: `grid-clip-${block.InfoId}`,
            Columns: selectedColumns,
          });
        }
      } else if (
        block.InfoType === "Cta" &&
        selectedCtaIds.has(block.InfoId) &&
        !seen.has(block.InfoId)
      ) {
        seen.add(block.InfoId);
        items.push({ ...block });
      } else if (
        block.InfoType === "Images" &&
        selectedImageIds.has(block.InfoId) &&
        !seen.has(block.InfoId)
      ) {
        seen.add(block.InfoId);
        items.push({ ...block });
      } else if (
        block.InfoType === "Description" &&
        selectedDescriptionIds.has(block.InfoId) &&
        !seen.has(block.InfoId)
      ) {
        seen.add(block.InfoId);
        items.push({ ...block });
      }
    }
    return items;
  }

  function handleCopySelected(sourceBlocks: any[]) {
    const items = collectClipboardItems(sourceBlocks);
    if (items.length > 0) setClipboard(items);
    exitMultiSelectMode();
  }

  function handleCutSelected(sourceBlocks: any[]) {
    const items = collectClipboardItems(sourceBlocks);
    if (items.length > 0) setClipboard(items);
    pushSnapshot();

    const applyTileDelete = (blocks: any[]) => {
      let content = blocks;
      for (const tileId of selectedTileIds) {
        for (const block of content) {
          if (block.InfoType !== "TileGrid") continue;
          for (const col of block.Columns ?? []) {
            if ((col.Tiles ?? []).some((t: any) => t.Id === tileId)) {
              content = applyDeleteTile(
                content,
                block.InfoId,
                col.ColId,
                tileId,
              );
              break;
            }
          }
        }
      }
      return content;
    };
    const applyCtaDelete = (blocks: any[]) =>
      selectedCtaIds.size > 0
        ? blocks.filter(
            (b: any) => !(b.InfoType === "Cta" && selectedCtaIds.has(b.InfoId)),
          )
        : blocks;
    const applyImageDelete = (blocks: any[]) =>
      selectedImageIds.size > 0
        ? blocks.filter(
            (b: any) =>
              !(b.InfoType === "Images" && selectedImageIds.has(b.InfoId)),
          )
        : blocks;
    const applyDescDelete = (blocks: any[]) =>
      selectedDescriptionIds.size > 0
        ? blocks.filter(
            (b: any) =>
              !(
                b.InfoType === "Description" &&
                selectedDescriptionIds.has(b.InfoId)
              ),
          )
        : blocks;
    const applyDeletes = (blocks: any[]) =>
      applyDescDelete(
        applyImageDelete(applyCtaDelete(applyTileDelete(blocks))),
      );

    if (sourceBlocks === infoContent) {
      setInfoContent((prev: any[]) => applyDeletes(prev));
    } else {
      const targetPageId = Object.keys(
        navContents as Record<string, any[]>,
      ).find(
        (key) => (navContents as Record<string, any[]>)[key] === sourceBlocks,
      );
      if (targetPageId) {
        setNavContents((prev: Record<string, any[]>) => ({
          ...prev,
          [targetPageId]: applyDeletes(prev[targetPageId]),
        }));
      }
    }
    exitMultiSelectMode();
  }

  function handlePasteToHome(insertBeforeInfoId: string | null) {
    if (clipboard.length === 0) return;
    pushSnapshot();
    setInfoContent((prev: any[]) =>
      applyPasteBlocks(prev, clipboard, insertBeforeInfoId),
    );
  }

  const homePageId =
    (currentVersion?.Pages ?? []).find(
      (p: any) => p.PageName?.toLowerCase() === "home",
    )?.PageId ?? "home";

  // Template sidebar shows only when the user has clicked an Information
  // page's frame, making it the visually active frame — not merely because a
  // blank page sits at the tail of navStack. It stays open while the page is
  // blank or still holds the exact content of the last applied template, so
  // the user can switch templates until they start editing. Explicitly
  // selecting a tile or CTA yields to SidebarRight's tile/CTA controls.
  const activeFramePage = allPages.find(
    (p: any) => p.PageId === activeFramePageId,
  );
  const activeFrameContent = navContents[activeFramePageId ?? ""] ?? [];
  const holdsUnmodifiedTemplate =
    !!appliedTemplate &&
    appliedTemplate.pageId === activeFramePageId &&
    JSON.stringify(activeFrameContent) === appliedTemplate.json;
  const showTemplateSidebarForLinkedPage =
    !!activeFramePageId &&
    !selectedTileId &&
    !selectedCtaId &&
    activeFramePageId !== homePageId &&
    navStack.includes(activeFramePageId) &&
    activeFramePage?.PageType === "Information" &&
    (activeFrameContent.length === 0 || holdsUnmodifiedTemplate);

  const homePageContent = infoContent;
  const homeHoldsUnmodifiedTemplate =
    !!appliedTemplate &&
    appliedTemplate.pageId === homePageId &&
    JSON.stringify(homePageContent) === appliedTemplate.json;
  const showTemplateSidebarForHome =
    activeFramePageId === null &&
    navStack.length === 0 &&
    !selectedTileId &&
    !selectedCtaId &&
    homePage?.PageType === "Information" &&
    (homePageContent.length === 0 || homeHoldsUnmodifiedTemplate);

  const showTemplateSidebar =
    showTemplateSidebarForLinkedPage || showTemplateSidebarForHome;

  function handleApplyTemplate(content: any[], templateId: string) {
    const targetPageId =
      activeFramePageId ?? (showTemplateSidebarForHome ? homePageId : null);
    if (!targetPageId) return;
    pushSnapshot();
    if (targetPageId === homePageId) {
      setInfoContent(content);
    } else {
      setNavContents((prev) => ({ ...prev, [targetPageId]: content }));
    }
    setAppliedTemplate({
      pageId: targetPageId,
      templateId,
      json: JSON.stringify(content),
    });
  }

  function openAnalysis() {
    setAnalysisOpen(true);
    if (analysisIssues.length > 0) {
      goToAnalysisIssue(0);
    }
  }

  function buildNavSourceTilesForPath(
    pageIds: string[],
  ): Record<string, string> {
    const cv = dataStore.get("Current_Version");
    const allPagesStore: any[] = cv?.Pages ?? cv?.Page ?? [];
    function getContent(pageId: string): any[] {
      if (navContents[pageId]) return navContents[pageId];
      const page = allPagesStore.find((p: any) => p.PageId === pageId);
      try {
        return JSON.parse(page?.PageStructure ?? "{}").InfoContent ?? [];
      } catch {
        return [];
      }
    }
    const result: Record<string, string> = {};
    for (let i = 0; i < pageIds.length; i++) {
      const parentContent = i === 0 ? infoContent : getContent(pageIds[i - 1]);
      for (const block of parentContent) {
        if (block.InfoType !== "TileGrid") continue;
        let found = false;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Action?.ObjectId === pageIds[i]) {
              result[pageIds[i]] = tile.Id;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
    }
    return result;
  }

  function goToAnalysisIssue(idx: number) {
    const issue = analysisIssues[idx];
    if (!issue) return;
    setAnalysisIndex(idx);
    if (issue.pageId !== homePageId) {
      const path = pageGraph.getPath(issue.pageId);
      const sourceTiles = buildNavSourceTilesForPath(path);
      handleNavigateToPath(path);
      setNavSourceTiles((prev) => ({ ...prev, ...sourceTiles }));
      setSelectedTileId(null);
      setSelectedCtaId(null);
      requestAnimationFrame(() => {
        for (const tileId of Object.values(sourceTiles)) {
          const el = document.querySelector(`[data-tile-id="${tileId}"]`);
          if (!el) continue;
          const container = el.closest(".phone-screen") as HTMLElement | null;
          if (container) {
            const elRect = el.getBoundingClientRect();
            const cRect = container.getBoundingClientRect();
            const offsetInContainer =
              elRect.top - cRect.top + container.scrollTop;
            const target =
              offsetInContainer - (cRect.height - elRect.height) / 2;
            container.scrollTo({
              top: Math.max(0, target),
              behavior: "smooth",
            });
          } else {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }
      });
    }
    if (issue.language) {
      setActiveFramePageId(issue.pageId);
      setIsTranslationOpen(true);
      setTranslationHighlight({
        blockId: issue.blockId,
        tileId: issue.subItemId,
        language: issue.language,
        message:
          issue.category === 1
            ? i18n.t("navbar.analyse.invalid_url")
            : i18n.t("navbar.analyse.text_too_long"),
      });
    } else {
      setIsTranslationOpen(false);
      setTranslationHighlight(null);
    }
    requestAnimationFrame(() => {
      const selector = issue.subItemId
        ? `[data-tile-id="${issue.subItemId}"]`
        : `[data-block-id="${issue.blockId}"]`;
      const el = document.querySelector(selector);
      if (!el) return;
      const container = el.closest(".phone-screen") as HTMLElement | null;
      if (container) {
        const elRect = el.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const offsetInContainer = elRect.top - cRect.top + container.scrollTop;
        const target = offsetInContainer - (cRect.height - elRect.height) / 2;
        container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      } else {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  }

  function scrollToNewBlock(infoId: string) {
    requestAnimationFrame(() => {
      let el: HTMLElement | null = null;
      if (infoId.startsWith("grid-")) {
        const tileTs = infoId.slice(5);
        el = document.querySelector(
          `[data-tile-id="tile-${tileTs}"]`,
        ) as HTMLElement | null;
      } else {
        el = document.querySelector(
          `[data-block-id="${infoId}"]`,
        ) as HTMLElement | null;
      }
      if (!el) return;
      const container = el.closest(".phone-screen") as HTMLElement | null;
      if (container) {
        const elRect = el.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const offsetInContainer = elRect.top - cRect.top + container.scrollTop;
        const target = offsetInContainer - (cRect.height - elRect.height) / 2;
        container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }
    });
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

  function handlePublishClick() {
    const cv = dataStore.get("Current_Version");
    const pages: any[] = cv?.Page ?? [];
    const homeId = pages.find(
      (p: any) => p.PageName?.toLowerCase() === "home",
    )?.PageId;
    const currentPageId = activeFramePageId ?? homeId;
    const langs: string[] = (() => {
      try {
        return JSON.parse(cv?.AppVersionMultiLanguages ?? "[]");
      } catch {
        return [];
      }
    })();
    if (currentPageId && langs.length > 0) {
      translateAppVersion({
        appVersionId: cv?.AppVersionId ?? "",
        languageFrom: cv?.AppVersionLanguage ?? "",
        languageToCollection: langs,
        activePageId: currentPageId,
      }).catch(() => {});
    }
    setShowPublishModal(true);
  }

  const currentAnalysisIssue =
    analysisOpen && analysisIssues.length > 0
      ? analysisIssues[Math.min(analysisIndex, analysisIssues.length - 1)]
      : null;
  const analysisHighlight =
    currentAnalysisIssue && !currentAnalysisIssue.language
      ? {
          blockId: currentAnalysisIssue.blockId,
          tileId: currentAnalysisIssue.subItemId,
          message:
            currentAnalysisIssue.category === 1
              ? i18n.t("navbar.analyse.invalid_url")
              : i18n.t("navbar.analyse.text_too_long"),
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
    if (!isTranslationOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsTranslationOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isTranslationOpen]);

  // When the active frame changes, translate the page the user just left —
  // but only if its content or name actually changed since they arrived.
  // null = home frame; resolved to the real home PageId before comparisons.
  const prevFramePageIdRef = useRef<string | null>(null);
  const frameSnapshotRef = useRef<{
    pageId: string;
    contentJson: string;
    pageName: string;
  } | null>(null);
  useEffect(() => {
    const prevRaw = prevFramePageIdRef.current;
    prevFramePageIdRef.current = activeFramePageId;

    const cv = dataStore.get("Current_Version");
    const pages: any[] = cv?.Page ?? [];
    const homeId = pages.find(
      (p: any) => p.PageName?.toLowerCase() === "home",
    )?.PageId;

    const prevId = prevRaw ?? homeId;
    const currentId = activeFramePageId ?? homeId;

    // Determine whether the previous page was actually edited
    let shouldTranslate = false;
    if (prevId && prevId !== currentId) {
      const snap = frameSnapshotRef.current;
      if (snap && snap.pageId === prevId) {
        const prevContent =
          prevId === homeId
            ? infoContentRef.current
            : (navContentsRef.current[prevId] ?? []);
        const prevPage = pages.find((p: any) => p.PageId === prevId);
        shouldTranslate =
          JSON.stringify(prevContent) !== snap.contentJson ||
          (prevPage?.PageName ?? "") !== snap.pageName;
      } else {
        shouldTranslate = true; // no baseline snapshot — translate to be safe
      }
    }

    // Take a fresh snapshot of the page we just landed on
    if (currentId) {
      const content =
        currentId === homeId
          ? infoContentRef.current
          : (navContentsRef.current[currentId] ?? []);
      const page = pages.find((p: any) => p.PageId === currentId);
      frameSnapshotRef.current = {
        pageId: currentId,
        contentJson: JSON.stringify(content),
        pageName: page?.PageName ?? "",
      };
    }

    if (!shouldTranslate) return;

    async function saveAndTranslate() {
      await flushSaveRef.current(prevId!);

      const freshCv = dataStore.get("Current_Version");
      const langs: string[] = (() => {
        try {
          return JSON.parse(freshCv?.AppVersionMultiLanguages ?? "[]");
        } catch {
          return [];
        }
      })();

      try {
        await translateAppVersion({
          appVersionId: freshCv?.AppVersionId ?? "",
          languageFrom: freshCv?.AppVersionLanguage ?? "",
          languageToCollection: langs,
          activePageId: prevId!,
        });
        setNavTranslationRevision((r) => r + 1);
      } catch {}
    }

    saveAndTranslate().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFramePageId]);

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

    if (
      (blockType === "Cta_Weblink" ||
        blockType === "Cta_Form" ||
        blockType === "Cta_Address") &&
      attrs.CtaAction
    ) {
      const cv = dataStore.get("Current_Version");
      if (cv) {
        const url =
          blockType === "Cta_Address"
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attrs.CtaAction)}`
            : attrs.CtaAction;
        const existing = (cv.Page ?? []).find(
          (p: any) =>
            p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
        );
        const ctaActionOverride =
          blockType === "Cta_Address" ? { CtaAction: url } : {};
        if (existing) {
          finalAttrs = {
            ...attrs,
            ...ctaActionOverride,
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
              const updated = {
                ...cv,
                Page: [...(cv.Page ?? []), newPage],
                Pages: [...(cv.Pages ?? []), newPage],
              };
              dataStore.set("Current_Version", updated);
              setCurrentVersion(updated);
              finalAttrs = {
                ...attrs,
                ...ctaActionOverride,
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
      scrollToNewBlock(`cta-${ts}`);
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
      Pages: (cv.Pages ?? []).map((p: any) =>
        p.PageId === pageId ? { ...p, PageName: newName } : p,
      ),
    };
    dataStore.set("Current_Version", updated);
    setCurrentVersion(updated);
    runSave(() => updatePageTitle(cv.AppVersionId, pageId, newName));
  }

  // ── Replace-page confirmation ─────────────────────────────────────────────

  const [pendingTileMenuAction, setPendingTileMenuAction] = useState<{
    tileId: string;
    action: TileMenuAction;
  } | null>(null);
  const skipReplaceCheckRef = useRef(false);

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
      const updated = {
        ...cv,
        Page: [...(cv.Page ?? []), newPage],
        Pages: [...(cv.Pages ?? []), newPage],
      };
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
      setSelectedTileId(null);
      setSelectedCtaId(null);
      setActiveFramePageId(newPage.PageId);
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
      setSelectedThemeId(full.ThemeId ?? themes[0]?.ThemeId ?? "");
      setInfoContent(parseInfoContent());
      setNavStack([]);
      setNavContents({});
      clearHistory();
      setSelectedTileId(null);
    } catch {}
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  async function handleTemplateCreated(version: any) {
    setShowCreateTemplateModal(false);
    try {
      await activateAppVersion(version.AppVersionId);
      const fetched = (await getActiveAppVersion()) as any;
      const full = { ...fetched, Page: fetched.Page ?? fetched.Pages ?? [] };
      dataStore.set("Current_Version", full);
      setCurrentVersion(full);
      setSelectedThemeId(full.ThemeId ?? themes[0]?.ThemeId ?? "");
      setInfoContent(parseInfoContent());
      setNavStack([]);
      setNavContents({});
      clearHistory();
      setSelectedTileId(null);
    } catch {}
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
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
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  function handleVersionDuplicated() {
    setDuplicateVersion(null);
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  async function handleCategoryChange(versionId: string, categoryId: string) {
    try {
      await updateAppVersionCategory(versionId, categoryId);
      const versions = await getAppVersions();
      setAppVersions(versions);
    } catch {
      // silently fail — consistent with other direct-action handlers
    }
  }

  async function handleTemplatePublished() {
    setShowPublishAsTemplateModal(false);
    try {
      const [versions, fetched] = await Promise.all([
        getAppVersions(),
        getActiveAppVersion(),
      ]);
      setAppVersions(versions);
      const fullVersion = {
        ...(fetched as any),
        Page: (fetched as any).Page ?? (fetched as any).Pages ?? [],
      };
      dataStore.set("Current_Version", fullVersion);
      setCurrentVersion(fullVersion);
    } catch {}
  }

  async function handleTemplateUnpublished() {
    setShowUnpublishTemplateModal(false);
    try {
      const [versions, fetched] = await Promise.all([
        getAppVersions(),
        getActiveAppVersion(),
      ]);
      setAppVersions(versions);
      const fullVersion = {
        ...(fetched as any),
        Page: (fetched as any).Page ?? (fetched as any).Pages ?? [],
      };
      dataStore.set("Current_Version", fullVersion);
      setCurrentVersion(fullVersion);
    } catch {}
  }

  function handleDescriptionUpdated() {
    setUpdateDescriptionVersion(null);
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  async function handleTranslationsUpdated(selectedLanguages: string[]) {
    const version = updateTranslationsVersion;
    setUpdateTranslationsVersion(null);
    if (version && selectedLanguages.length) {
      const homePageId = version.Pages?.find(
        (p) => p.PageName?.toLowerCase() === "home",
      )?.PageId;
      translateAppVersion({
        appVersionId: version.AppVersionId,
        languageFrom: version.AppVersionLanguage,
        languageToCollection: selectedLanguages,
        activePageId: homePageId,
      }).catch(() => {});
    }
    try {
      if (version?.AppVersionId === currentVersion?.AppVersionId) {
        // Reload the active version so the translation sidebar picks up
        // the new AppVersionMultiLanguages.
        const [versions, fetched] = await Promise.all([
          getAppVersions(),
          getActiveAppVersion(),
        ]);
        setAppVersions(versions);
        const fullVersion = {
          ...(fetched as any),
          Page: (fetched as any).Page ?? (fetched as any).Pages ?? [],
        };
        dataStore.set("Current_Version", fullVersion);
        setCurrentVersion(fullVersion);
      } else {
        setAppVersions(await getAppVersions());
      }
    } catch {}
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

    if (!skipReplaceCheckRef.current) {
      const existingPageIds = new Set((cv.Pages ?? []).map((p: any) => p.Id));
      const allTileBlocks: any[] = [
        ...infoContentRef.current,
        ...(Object.values(navContentsRef.current) as any[][]).flat(),
      ];
      for (const b of allTileBlocks) {
        const tile = (b.Columns ?? [])
          .flatMap((c: any) => c.Tiles ?? [])
          .find((t: any) => t.Id === tileId);
        if (
          tile?.Action?.ObjectId &&
          existingPageIds.has(tile.Action.ObjectId)
        ) {
          setPendingTileMenuAction({ tileId, action });
          return;
        }
      }
    }
    skipReplaceCheckRef.current = false;

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
      if (
        (action.objectType === "WebLink" ||
          action.objectType === "DynamicForm") &&
        objectUrl
      )
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
      const allTileBlocks: any[] = [
        ...infoContentRef.current,
        ...(Object.values(navContentsRef.current) as any[][]).flat(),
      ];
      let currentTileAction: any = null;
      for (const b of allTileBlocks) {
        const tile = (b.Columns ?? [])
          .flatMap((c: any) => c.Tiles ?? [])
          .find((t: any) => t.Id === tileId);
        if (tile) {
          currentTileAction = tile.Action;
          break;
        }
      }
      if (
        currentTileAction?.ObjectId &&
        currentTileAction.ObjectType === "WebLink"
      ) {
        pushSnapshot();
        handleEditTile(tileId, {
          Action: { ...currentTileAction, ObjectUrl: url },
        });
        try {
          await updateLinkPage({
            appVersionId: cv.AppVersionId,
            pageId: currentTileAction.ObjectId,
            url,
            WWPFormId: 0,
          });
          const freshCv = dataStore.get("Current_Version") ?? cv;
          const syncedCv = {
            ...freshCv,
            Page: (freshCv.Page ?? []).map((p: any) =>
              p.PageId === currentTileAction.ObjectId
                ? {
                    ...p,
                    PageLinkStructure: {
                      ...(p.PageLinkStructure ?? {}),
                      Url: url,
                    },
                  }
                : p,
            ),
            Pages: (freshCv.Pages ?? []).map((p: any) =>
              p.PageId === currentTileAction.ObjectId
                ? {
                    ...p,
                    PageLinkStructure: {
                      ...(p.PageLinkStructure ?? {}),
                      Url: url,
                    },
                  }
                : p,
            ),
          };
          dataStore.set("Current_Version", syncedCv);
          setCurrentVersion(syncedCv);
          setNavUrls((prev) => ({
            ...prev,
            [currentTileAction.ObjectId]: url,
          }));
        } catch {
          const fallbackCv = dataStore.get("Current_Version") ?? cv;
          try {
            const newPage = await createLinkPage({
              appVersionId: fallbackCv.AppVersionId,
              pageName: action.label || url,
              url,
              WWPFormId: 0,
            });
            if (!newPage?.PageId) throw new Error("no page");
            const pageUrl = newPage.PageLinkStructure?.Url ?? url;
            const updated = {
              ...fallbackCv,
              Page: [...(fallbackCv.Page ?? []), newPage],
              Pages: [...(fallbackCv.Pages ?? []), newPage],
            };
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
            setNavSourceTiles((prev) => ({
              ...prev,
              [newPage.PageId]: tileId,
            }));
            setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
          } catch {
            /* ignore */
          }
        }
        return;
      }
      const existing = (cv.Page ?? []).find(
        (p: any) =>
          p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
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
          const updated = {
            ...cv,
            Page: [...(cv.Page ?? []), newPage],
            Pages: [...(cv.Pages ?? []), newPage],
          };
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
      const allFormBlocks: any[] = [
        ...infoContentRef.current,
        ...(Object.values(navContentsRef.current) as any[][]).flat(),
      ];
      let currentFormAction: any = null;
      for (const b of allFormBlocks) {
        const tile = (b.Columns ?? [])
          .flatMap((c: any) => c.Tiles ?? [])
          .find((t: any) => t.Id === tileId);
        if (tile) {
          currentFormAction = tile.Action;
          break;
        }
      }
      if (
        currentFormAction?.ObjectId &&
        currentFormAction.ObjectType === "DynamicForm"
      ) {
        pushSnapshot();
        handleEditTile(tileId, {
          Action: { ...currentFormAction, FormId: Number(action.formId) },
        });
        updateLinkPage({
          appVersionId: cv.AppVersionId,
          pageId: currentFormAction.ObjectId,
          url: "",
          WWPFormId: Number(action.formId),
          WWPFormReferenceName: action.formReferenceName,
        }).catch(() => {
          /* ignore */
        });
        return;
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
        const updated = {
          ...cv,
          Page: [...(cv.Page ?? []), newPage],
          Pages: [...(cv.Pages ?? []), newPage],
        };
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
      ...(Object.values(navContentsRef.current).flat() as any[]),
    ];
    const block = allBlocks.find(
      (b: any) => b.InfoType === "Cta" && b.InfoId === ctaId,
    );
    const action = block?.CtaAttributes?.Action;
    if (
      (action?.ObjectType === "WebLink" ||
        action?.ObjectType === "DynamicForm") &&
      action?.ObjectId
    ) {
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

  function handleCtaNavigation(ctaId: string, parentIndex: number) {
    const allBlocks = [
      ...infoContentRef.current,
      ...(Object.values(navContentsRef.current).flat() as any[]),
    ];
    const block = allBlocks.find(
      (b: any) => b.InfoType === "Cta" && b.InfoId === ctaId,
    );
    const action = block?.CtaAttributes?.Action;
    if (!action?.ObjectId) {
      handleCollapseDescendants(parentIndex);
      return;
    }

    if (
      action.ObjectType === "Information" ||
      action.ObjectType === "BulletinBoard" ||
      action.ObjectType === "Calendar" ||
      action.ObjectType === "MyActivity" ||
      action.ObjectType === "Map"
    ) {
      handleTileNavigate(action.ObjectId, parentIndex);
    } else if (
      action.ObjectType === "WebLink" ||
      action.ObjectType === "DynamicForm"
    ) {
      const page = pagesRef.current.find(
        (p: any) => p.PageId === action.ObjectId,
      );
      const url = page?.PageLinkStructure?.Url ?? action.ObjectUrl;
      if (url) {
        handleTileNavigate(action.ObjectId, parentIndex);
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

    const allCtaBlocks: any[] = [
      ...infoContentRef.current,
      ...(Object.values(navContentsRef.current) as any[][]).flat(),
    ];
    const ctaBlock = allCtaBlocks.find(
      (b: any) => b.InfoType === "Cta" && b.InfoId === ctaId,
    );
    const currentCtaAction = ctaBlock?.CtaAttributes?.Action;
    if (
      currentCtaAction?.ObjectId &&
      currentCtaAction.ObjectType === "WebLink"
    ) {
      pushSnapshot();
      handleEditCta(ctaId, {
        CtaAction: url,
        Action: { ...currentCtaAction, ObjectUrl: url },
      });
      try {
        await updateLinkPage({
          appVersionId: cv.AppVersionId,
          pageId: currentCtaAction.ObjectId,
          url,
          WWPFormId: 0,
        });
        const freshCv = dataStore.get("Current_Version") ?? cv;
        const syncedCv = {
          ...freshCv,
          Page: (freshCv.Page ?? []).map((p: any) =>
            p.PageId === currentCtaAction.ObjectId
              ? {
                  ...p,
                  PageLinkStructure: {
                    ...(p.PageLinkStructure ?? {}),
                    Url: url,
                  },
                }
              : p,
          ),
          Pages: (freshCv.Pages ?? []).map((p: any) =>
            p.PageId === currentCtaAction.ObjectId
              ? {
                  ...p,
                  PageLinkStructure: {
                    ...(p.PageLinkStructure ?? {}),
                    Url: url,
                  },
                }
              : p,
          ),
        };
        dataStore.set("Current_Version", syncedCv);
        setCurrentVersion(syncedCv);
        setNavUrls((prev) => ({ ...prev, [currentCtaAction.ObjectId]: url }));
      } catch {
        const fallbackCv = dataStore.get("Current_Version") ?? cv;
        try {
          const newPage = await createLinkPage({
            appVersionId: fallbackCv.AppVersionId,
            pageName: label || url,
            url,
            WWPFormId: 0,
          });
          if (!newPage?.PageId) throw new Error("no page");
          const pageUrl = newPage.PageLinkStructure?.Url ?? url;
          const updated = {
            ...fallbackCv,
            Page: [...(fallbackCv.Page ?? []), newPage],
            Pages: [...(fallbackCv.Pages ?? []), newPage],
          };
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
          /* ignore */
        }
      }
      return;
    }
    const existing = (cv.Page ?? []).find(
      (p: any) => p.PageType === "WebLink" && p.PageLinkStructure?.Url === url,
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
      const updated = {
        ...cv,
        Page: [...(cv.Page ?? []), newPage],
        Pages: [...(cv.Pages ?? []), newPage],
      };
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

  async function handleCtaAddressSave(
    ctaId: string,
    address: string,
    label: string,
  ) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

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

    const allCtaBlocks: any[] = [
      ...infoContentRef.current,
      ...(Object.values(navContentsRef.current) as any[][]).flat(),
    ];
    const ctaBlock = allCtaBlocks.find(
      (b: any) => b.InfoType === "Cta" && b.InfoId === ctaId,
    );
    const currentCtaAction = ctaBlock?.CtaAttributes?.Action;

    if (
      currentCtaAction?.ObjectId &&
      currentCtaAction.ObjectType === "WebLink"
    ) {
      pushSnapshot();
      handleEditCta(ctaId, {
        CtaAction: mapsUrl,
        Action: { ...currentCtaAction, ObjectUrl: mapsUrl },
      });
      try {
        await updateLinkPage({
          appVersionId: cv.AppVersionId,
          pageId: currentCtaAction.ObjectId,
          url: mapsUrl,
          WWPFormId: 0,
        });
        const freshCv = dataStore.get("Current_Version") ?? cv;
        const syncedCv = {
          ...freshCv,
          Page: (freshCv.Page ?? []).map((p: any) =>
            p.PageId === currentCtaAction.ObjectId
              ? {
                  ...p,
                  PageLinkStructure: {
                    ...(p.PageLinkStructure ?? {}),
                    Url: mapsUrl,
                  },
                }
              : p,
          ),
          Pages: (freshCv.Pages ?? []).map((p: any) =>
            p.PageId === currentCtaAction.ObjectId
              ? {
                  ...p,
                  PageLinkStructure: {
                    ...(p.PageLinkStructure ?? {}),
                    Url: mapsUrl,
                  },
                }
              : p,
          ),
        };
        dataStore.set("Current_Version", syncedCv);
        setCurrentVersion(syncedCv);
        setNavUrls((prev) => ({
          ...prev,
          [currentCtaAction.ObjectId]: mapsUrl,
        }));
      } catch {
        const fallbackCv = dataStore.get("Current_Version") ?? cv;
        try {
          const newPage = await createLinkPage({
            appVersionId: fallbackCv.AppVersionId,
            pageName: label || address,
            url: mapsUrl,
            WWPFormId: 0,
          });
          if (!newPage?.PageId) throw new Error("no page");
          const pageUrl = newPage.PageLinkStructure?.Url ?? mapsUrl;
          const updated = {
            ...fallbackCv,
            Page: [...(fallbackCv.Page ?? []), newPage],
            Pages: [...(fallbackCv.Pages ?? []), newPage],
          };
          dataStore.set("Current_Version", updated);
          setCurrentVersion(updated);
          handleEditCta(ctaId, {
            CtaAction: mapsUrl,
            Action: {
              ObjectType: "WebLink",
              ObjectId: newPage.PageId,
              ObjectUrl: pageUrl,
            },
          });
          handleTileNavigate(newPage.PageId, ctaFrameIndex);
          setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
        } catch {
          /* ignore */
        }
      }
      return;
    }

    const existing = (cv.Page ?? []).find(
      (p: any) =>
        p.PageType === "WebLink" && p.PageLinkStructure?.Url === mapsUrl,
    );
    if (existing) {
      pushSnapshot();
      handleEditCta(ctaId, {
        CtaAction: mapsUrl,
        Action: {
          ObjectType: "WebLink",
          ObjectId: existing.PageId,
          ObjectUrl: mapsUrl,
        },
      });
      handleTileNavigate(existing.PageId, ctaFrameIndex);
      setNavUrls((prev) => ({ ...prev, [existing.PageId]: mapsUrl }));
      return;
    }
    try {
      const newPage = await createLinkPage({
        appVersionId: cv.AppVersionId,
        pageName: label || address,
        url: mapsUrl,
        WWPFormId: 0,
      });
      if (!newPage?.PageId) throw new Error("no page");
      const pageUrl = newPage.PageLinkStructure?.Url ?? mapsUrl;
      pushSnapshot();
      const updated = {
        ...cv,
        Page: [...(cv.Page ?? []), newPage],
        Pages: [...(cv.Pages ?? []), newPage],
      };
      dataStore.set("Current_Version", updated);
      setCurrentVersion(updated);
      handleEditCta(ctaId, {
        CtaAction: mapsUrl,
        Action: {
          ObjectType: "WebLink",
          ObjectId: newPage.PageId,
          ObjectUrl: pageUrl,
        },
      });
      handleTileNavigate(newPage.PageId, ctaFrameIndex);
      setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
    } catch {
      handleEditCta(ctaId, { CtaAction: mapsUrl });
    }
  }

  async function handleTileWeblinkSave(tileId: string, url: string) {
    const cv = dataStore.get("Current_Version");
    if (!cv || !url) return;
    const frames = [
      { blocks: infoContentRef.current },
      ...navStackRef.current.map((pid: string) => ({
        blocks: navContentsRef.current[pid] ?? [],
      })),
    ];
    let objectId: string | undefined;
    let tileFrameIndex = -1;
    outer: for (let fi = 0; fi < frames.length; fi++) {
      for (const block of frames[fi].blocks) {
        if (block.InfoType !== "TileGrid") continue;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Id === tileId) {
              objectId = tile.Action?.ObjectId;
              tileFrameIndex = fi - 1;
              break outer;
            }
          }
        }
      }
    }
    if (!objectId) return;
    try {
      await updateLinkPage({
        appVersionId: cv.AppVersionId,
        pageId: objectId,
        url,
        WWPFormId: 0,
      });
      const freshCv = dataStore.get("Current_Version") ?? cv;
      const syncedCv = {
        ...freshCv,
        Page: (freshCv.Page ?? []).map((p: any) =>
          p.PageId === objectId
            ? {
                ...p,
                PageLinkStructure: { ...(p.PageLinkStructure ?? {}), Url: url },
              }
            : p,
        ),
        Pages: (freshCv.Pages ?? []).map((p: any) =>
          p.PageId === objectId
            ? {
                ...p,
                PageLinkStructure: { ...(p.PageLinkStructure ?? {}), Url: url },
              }
            : p,
        ),
      };
      dataStore.set("Current_Version", syncedCv);
      setCurrentVersion(syncedCv);
      setNavUrls((prev) => ({ ...prev, [objectId as string]: url }));
    } catch {
      const fallbackCv = dataStore.get("Current_Version") ?? cv;
      try {
        const newPage = await createLinkPage({
          appVersionId: fallbackCv.AppVersionId,
          pageName: url,
          url,
          WWPFormId: 0,
        });
        if (!newPage?.PageId) throw new Error("no page");
        const pageUrl = newPage.PageLinkStructure?.Url ?? url;
        const updated = {
          ...fallbackCv,
          Page: [...(fallbackCv.Page ?? []), newPage],
          Pages: [...(fallbackCv.Pages ?? []), newPage],
        };
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
        handleTileNavigate(newPage.PageId, tileFrameIndex);
        setNavSourceTiles((prev) => ({ ...prev, [newPage.PageId]: tileId }));
        setNavUrls((prev) => ({ ...prev, [newPage.PageId]: pageUrl }));
      } catch {
        /* ignore */
      }
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
    getClipboard: () => clipboard,
    setNavStack,
    navSourceTiles,
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
        onUpdateDescription={(id) =>
          setUpdateDescriptionVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        onCategoryChange={handleCategoryChange}
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
        isTreeOpen={treeOpen}
        isSaving={isDirty || isTranslationSaving}
        saveError={saveError || translationSaveError}
        savedAt={translationSavedAt ?? savedAt}
        isTranslationOpen={isTranslationOpen}
        onTranslationToggle={() => {
          if (!isTranslationOpen && analysisOpen) setAnalysisOpen(false);
          setIsTranslationOpen((v) => !v);
        }}
        canTranslate={canTranslate}
        isHistoryOpen={isHistoryOpen}
        onHistoryToggle={() => {
          if (isHistoryOpen) {
            handleHistoryClose();
          } else {
            setIsHistoryOpen(true);
          }
        }}
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
        onAnalysisClose={() => {
          setAnalysisOpen(false);
          setTranslationHighlight(null);
          setIsTranslationOpen(false);
        }}
        onPublish={handlePublishClick}
        onPublishAsTemplate={() => setShowPublishAsTemplateModal(true)}
        onUnpublishTemplate={() => setShowUnpublishTemplateModal(true)}
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
        showNavPaths={showNavPaths}
        onToggleNavPaths={() => setShowNavPaths((v) => !v)}
      />
      <EditorModals
        showPublishModal={showPublishModal}
        showPublishAsTemplateModal={showPublishAsTemplateModal}
        onClosePublishAsTemplate={() => setShowPublishAsTemplateModal(false)}
        onTemplatePublished={handleTemplatePublished}
        showUnpublishTemplateModal={showUnpublishTemplateModal}
        onCloseUnpublishTemplate={() => setShowUnpublishTemplateModal(false)}
        onTemplateUnpublished={handleTemplateUnpublished}
        currentVersion={currentVersion}
        appVersions={appVersions}
        analysisIssueCount={analysisIssues.length}
        onPublished={() => {
          setShowPublishModal(false);
          setAlertInfo({
            message: "App published successfully",
            status: "success",
          });
        }}
        onClosePublish={() => setShowPublishModal(false)}
        onFixIssues={() => {
          setShowPublishModal(false);
          openAnalysis();
        }}
        showShareModal={showShareModal}
        shareLink={
          currentVersion?.AppVersionId
            ? `${getBaseUrl()}/wp_applicationdesign_preview.aspx?AppVersionId=${currentVersion.AppVersionId}`
            : ""
        }
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
        updateDescriptionVersion={updateDescriptionVersion}
        onCloseUpdateDescription={() => setUpdateDescriptionVersion(null)}
        onDescriptionUpdated={handleDescriptionUpdated}
        updateTranslationsVersion={updateTranslationsVersion}
        onCloseUpdateTranslations={() => setUpdateTranslationsVersion(null)}
        onTranslationsUpdated={handleTranslationsUpdated}
        showTrashModal={showTrashModal}
        onCloseTrashModal={() => setShowTrashModal(false)}
        onTrashChanged={() => {
          getAppVersions()
            .then(setAppVersions)
            .catch(() => {});
          getActiveAppVersion()
            .then((fetched: any) => {
              const full = {
                ...fetched,
                Page: fetched.Page ?? fetched.Pages ?? [],
              };
              dataStore.set("Current_Version", full);
              setCurrentVersion(full);
              refreshTrashedPageIds();
            })
            .catch(() => {});
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
            allPages={allPages.filter(
              (p: any) => !trashedPageIds.has(p.PageId),
            )}
            infoContent={infoContent}
            navContents={navContents}
            navStack={navStack}
            themeColors={selectedTheme?.ThemeColors}
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            themeCtaColors={selectedTheme?.ThemeCtaColors ?? []}
            appVersionId={currentVersion?.AppVersionId}
            onBeforeDeletePage={pushSnapshot}
            onClose={() => setTreeOpen(false)}
            onNavigateToPath={(pageIds) => {
              const urlUpdates: Record<string, string> = {};
              for (const pageId of pageIds) {
                const page = allPages.find((p: any) => p.PageId === pageId);
                if (
                  page?.PageType === "WebLink" ||
                  page?.PageType === "DynamicForm"
                ) {
                  const url = getLinkedPageUrl(page);
                  if (url) urlUpdates[pageId] = url;
                }
              }
              if (Object.keys(urlUpdates).length > 0)
                setNavUrls((prev) => ({ ...prev, ...urlUpdates }));
              handleNavigateToPath(pageIds);
              setNavSourceTiles((prev) => ({
                ...prev,
                ...buildNavSourceTilesForPath(pageIds),
              }));
              setSelectedTileId(null);
              setSelectedCtaId(null);
            }}
            onDeletePage={handleDeletePage}
          />
        )}
        <MainCanvas
          isReadOnly={isTranslationOpen || isHistoryOpen}
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
          onCtaNavigate={handleCtaNavigation}
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
          requestActivePageId={activeFramePageId}
          appVersionId={currentVersion?.AppVersionId}
          onDeletePage={handleDeletePage}
          onBeforeDeletePage={pushSnapshot}
          isMultiSelectMode={isMultiSelectMode}
          onSelectionChange={(tileIds, ctaIds, imageIds, descIds) => {
            setSelectedTileIds(tileIds);
            setSelectedCtaIds(ctaIds);
            setSelectedImageIds(imageIds);
            setSelectedDescriptionIds(descIds);
          }}
          onExitMultiSelectMode={exitMultiSelectMode}
          multiSelectedTileIds={selectedTileIds}
          multiSelectedCtaIds={selectedCtaIds}
          multiSelectedImageIds={selectedImageIds}
          multiSelectedDescriptionIds={selectedDescriptionIds}
          onCopySelected={handleCopySelected}
          onCutSelected={handleCutSelected}
          hasClipboard={clipboard.length > 0}
          onPasteBlocks={handlePasteToHome}
          showNavPaths={showNavPaths}
        />
        {isHistoryOpen ? (
          <VersionHistorySidebar
            appVersionId={currentVersion?.AppVersionId}
            onClose={handleHistoryClose}
            onRestored={handleVersionRestored}
            onPreviewVersion={handleHistoryPreview}
            previewingNumber={previewingNumber}
            loadingPreview={loadingPreview}
          />
        ) : isTranslationOpen && canTranslate ? (
          <TranslationSideBar
            appVersionId={currentVersion?.AppVersionId ?? ""}
            appVersionLanguage={currentVersion?.AppVersionLanguage ?? ""}
            appVersionMultiLanguages={appVersionMultiLanguages}
            activePageId={transPageId}
            pageName={transPageName}
            pageType={transPageType}
            pageUrl={navUrls[transPageId]}
            themeColors={selectedTheme?.ThemeColors}
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            ctaColors={selectedTheme?.ThemeCtaColors ?? []}
            highlightBlockId={translationHighlight?.blockId}
            highlightTileId={translationHighlight?.tileId}
            highlightLanguage={translationHighlight?.language}
            highlightMessage={translationHighlight?.message}
            onSaveStart={() => {
              setIsTranslationSaving(true);
              setTranslationSaveError(false);
            }}
            onSaved={() => {
              setIsTranslationSaving(false);
              setTranslationSavedAt(Date.now());
              setTranslationRevision((v) => v + 1);
            }}
            onSaveError={() => {
              setIsTranslationSaving(false);
              setTranslationSaveError(true);
            }}
          />
        ) : showTemplateSidebar ? (
          <TemplateSidebar
            templates={pageTemplates}
            onApply={handleApplyTemplate}
            appliedTemplateId={
              appliedTemplate?.pageId === activeFramePageId
                ? appliedTemplate.templateId
                : undefined
            }
          />
        ) : (
          <SidebarRight
            themeIcons={selectedTheme?.ThemeIcons ?? []}
            themeColors={selectedTheme?.ThemeColors}
            ctaColors={selectedTheme?.ThemeCtaColors ?? []}
            moodId={currentVersion?.MoodId}
            selectedThemeId={selectedThemeId}
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
            onCtaAddressSave={handleCtaAddressSave}
            onTileWeblinkSave={handleTileWeblinkSave}
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
      {pendingTileMenuAction && (
        <ReplacePageActionModal
          onConfirm={() => {
            const { tileId, action } = pendingTileMenuAction;
            setPendingTileMenuAction(null);
            skipReplaceCheckRef.current = true;
            handleTileMenuAction(tileId, action);
          }}
          onClose={() => setPendingTileMenuAction(null)}
        />
      )}
      <AlertMessage
        message={alertInfo?.message ?? ""}
        status={alertInfo?.status ?? "success"}
        visible={alertInfo !== null}
        onClose={() => setAlertInfo(null)}
      />
    </>
  );
}

export default App;
