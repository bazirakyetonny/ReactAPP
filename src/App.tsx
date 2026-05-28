import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  getAppVersions,
  getActiveAppVersion,
  activateAppVersion,
  type SDTAppVersion,
} from "./services/appVersionsApi";
import { updateAppVersionTheme } from "./services/themeApi";
import { CreateAppVersionModal } from "./components/appversion/CreateAppVersionModal";
import { RenameAppVersionModal } from "./components/appversion/RenameAppVersionModal";
import { MoveToTrashModal } from "./components/appversion/MoveToTrashModal";
import { DuplicateAppVersionModal } from "./components/appversion/DuplicateAppVersionModal";
import { UpdateTranslationsModal } from "./components/appversion/UpdateTranslationsModal";
import { CreateAppVersionTemplateModal } from "./components/appversion/CreateAppVersionTemplateModal";
import { PublishModal } from "./components/appversion/PublishModal";
import { NavBar } from "./components/NavBar";
import { MainCanvas } from "./components/MainCanvas";
import { AddCtaModal } from "./components/phone/AddCtaModal";
import { SidebarRight } from "./components/SidebarRight";
import { TranslationSideBar } from "./components/translation/TranslationSideBar";
import { VersionHistorySidebar } from "./components/appversion/VersionHistorySidebar";
import { PageBubbleTree } from "./components/tree/PageBubbleTree";
import { dataStore } from "./data/datastore";
import type { Theme, CategoryTemplates } from "./types";
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
import { extractLinks, checkLink } from "./utils/linkChecker";
import { buildLinkedFrames } from "./utils/linkedFrames";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useNavigation } from "./hooks/useNavigation";
import { useContentHandlers } from "./hooks/useContentHandlers";
import { useAutoSave } from "./hooks/useAutoSave";
import { useAnalysis } from "./hooks/useAnalysis";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { TileImageModal } from "./components/phone/TileImageModal";

function App() {
  const themes: Theme[] = dataStore.get("themes") ?? [];
  const templatesCollection: CategoryTemplates[] =
    dataStore.get("TemplatesCollection") ?? [];

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
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
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
  const [invalidLinkCount, setInvalidLinkCount] = useState(0);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const linkCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [liveTileText, setLiveTileText] = useState<{
    id: string;
    text: string;
  } | null>(null);

  // Live refs so hooks always read the current values
  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef<Record<string, any[]>>({});
  const navStackRef = useRef<string[]>([]);
  const themeIdRef = useRef(selectedThemeId);
  const pagesRef = useRef<any[]>(currentVersion?.Page ?? []);
  useLayoutEffect(() => {
    infoContentRef.current = infoContent;
  });
  useLayoutEffect(() => {
    themeIdRef.current = selectedThemeId;
  });
  useLayoutEffect(() => {
    pagesRef.current = currentVersion?.Page ?? [];
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

  // ── Link checker ─────────────────────────────────────────────────────────

  useEffect(() => {
    const token = { cancelled: false };
    if (linkCheckTimerRef.current) clearTimeout(linkCheckTimerRef.current);
    linkCheckTimerRef.current = setTimeout(async () => {
      const blocks = [...infoContent, ...Object.values(navContents).flat()];
      const links = extractLinks(blocks);
      if (links.length === 0) {
        setInvalidLinkCount(0);
        setIsCheckingLinks(false);
        return;
      }
      setIsCheckingLinks(true);
      const results = await Promise.all(links.map(checkLink));
      if (token.cancelled) return;
      setInvalidLinkCount(results.filter((r: boolean) => !r).length);
      setIsCheckingLinks(false);
    }, 3000);
    return () => {
      if (linkCheckTimerRef.current) clearTimeout(linkCheckTimerRef.current);
      token.cancelled = true;
    };
  }, [infoContent, navContents]);

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
    pages: currentVersion?.Page ?? [],
    versionId: currentVersion?.AppVersionId,
  });

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

  function handleConfirmCta(attrs: {
    CtaLabel: string;
    CtaAction: string;
    CtaConnectedSupplierId?: string;
    CtaSupplierIsConnected: boolean;
  }) {
    if (!pendingCta) return;
    pushSnapshot();
    const ts = Date.now();
    const { blockType, insertBeforeInfoId, frameId } = pendingCta;
    if (frameId === null) {
      setInfoContent((prev) =>
        applyAddBlock(prev, blockType, insertBeforeInfoId, ts, attrs),
      );
    } else {
      setNavContents((prev) => ({
        ...prev,
        [frameId]: applyAddBlock(
          prev[frameId] ?? [],
          blockType,
          insertBeforeInfoId,
          ts,
          attrs,
        ),
      }));
    }
    setSelectedCtaId(`cta-${ts}`);
    setSelectedTileId(null);
    setPendingCta(null);
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
          pageName: action.label || "Web Link",
          url: action.value,
        });
        if (!newPage?.PageId) throw new Error("no page");
        const url = newPage.PageLinkStructure?.Url ?? action.value;
        pushSnapshot();
        const updated = { ...cv, Page: [...(cv.Page ?? []), newPage] };
        dataStore.set("Current_Version", updated);
        setCurrentVersion(updated);
        handleEditTile(tileId, {
          Action: {
            ObjectType: newPage.PageType ?? "WebLink",
            ObjectId: newPage.PageId,
            ObjectUrl: url,
            FormId: 0,
          },
        });
        handleTileNavigate(newPage.PageId, parentIndex);
        setNavSourceTiles((prev) => ({ ...prev, [newPage.PageId]: tileId }));
        setNavUrls((prev) => ({ ...prev, [newPage.PageId]: url }));
      } catch {
        // API failed — still open the frame using a synthetic key
        pushSnapshot();
        const frameKey = `weblink-frame-${tileId}`;
        handleEditTile(tileId, {
          Action: {
            ObjectType: "WebLink",
            ObjectId: "",
            ObjectUrl: action.value,
            FormId: 0,
          },
        });
        handleTileNavigate(frameKey, parentIndex);
        setNavSourceTiles((prev) => ({ ...prev, [frameKey]: tileId }));
        setNavUrls((prev) => ({ ...prev, [frameKey]: action.value }));
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
    handleSelectCta,
    handleEditCta,
    handleTileDoubleClick,
    onCommitNewPage: handleCommitNewPage,
    onCancelNewPage: handleCancelNewPage,
  });

  // ── Render ───────────────────────────────────────────────────────────────

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
        invalidLinkCount={invalidLinkCount}
        isCheckingLinks={isCheckingLinks}
        isSaving={isSaving}
        saveError={saveError}
        savedAt={savedAt}
        isTranslationOpen={isTranslationOpen}
        onTranslationToggle={() => setIsTranslationOpen((v) => !v)}
        isHistoryOpen={isHistoryOpen}
        onHistoryToggle={() => setIsHistoryOpen((v) => !v)}
        analysisIssueCount={analysisIssues.length}
        isAnalyzing={isAnalyzing}
        onAnalysisOpen={() => setAnalysisOpen(true)}
        onPublish={() => setShowPublishModal(true)}
      />
      {analysisOpen && (
        <AnalysisPanel
          issues={analysisIssues}
          isAnalyzing={isAnalyzing}
          onClose={() => setAnalysisOpen(false)}
          onRerun={rerunAnalysis}
        />
      )}
      {showPublishModal && currentVersion && (
        <PublishModal
          currentVersionId={currentVersion.AppVersionId}
          currentVersionName={currentVersion.AppVersionName}
          appVersions={appVersions}
          issueCount={analysisIssues.length}
          onPublished={() => setShowPublishModal(false)}
          onClose={() => setShowPublishModal(false)}
          onFixIssues={() => {
            setShowPublishModal(false);
            setAnalysisOpen(true);
          }}
        />
      )}
      {showCreateModal && (
        <CreateAppVersionModal
          templatesCollection={templatesCollection}
          themeColors={selectedTheme?.ThemeColors}
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          onClose={() => setShowCreateModal(false)}
          onCreated={async (version) => {
            setShowCreateModal(false);
            try {
              await activateAppVersion(version.AppVersionId);
              const fetched = (await getActiveAppVersion()) as any;
              const full = {
                ...fetched,
                Page: fetched.Page ?? fetched.Pages ?? [],
              };
              dataStore.set("Current_Version", full);
              setCurrentVersion(full);
              setInfoContent(parseInfoContent());
              setNavStack([]);
              setNavContents({});
              clearHistory();
              setSelectedTileId(null);
            } catch {}
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
      {showCreateTemplateModal && (
        <CreateAppVersionTemplateModal
          onClose={() => setShowCreateTemplateModal(false)}
          onCreated={() => {
            setShowCreateTemplateModal(false);
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
      {showCreateTemplateModal && (
        <CreateAppVersionTemplateModal
          onClose={() => setShowCreateTemplateModal(false)}
          onCreated={() => {
            setShowCreateTemplateModal(false);
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
      {renameVersion && (
        <RenameAppVersionModal
          key={renameVersion.AppVersionId}
          versionId={renameVersion.AppVersionId}
          currentName={renameVersion.AppVersionName}
          currentDescription={renameVersion.AppVersionDescription}
          onClose={() => setRenameVersion(null)}
          onRenamed={(newName) => {
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
          }}
        />
      )}
      {trashVersion && (
        <MoveToTrashModal
          key={trashVersion.AppVersionId}
          versionId={trashVersion.AppVersionId}
          versionName={trashVersion.AppVersionName}
          onClose={() => setTrashVersion(null)}
          onDeleted={() => {
            setTrashVersion(null);
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
      {duplicateVersion && (
        <DuplicateAppVersionModal
          key={duplicateVersion.AppVersionId}
          versionId={duplicateVersion.AppVersionId}
          currentName={duplicateVersion.AppVersionName}
          onClose={() => setDuplicateVersion(null)}
          onDuplicated={() => {
            setDuplicateVersion(null);
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
      {updateTranslationsVersion && (
        <UpdateTranslationsModal
          key={updateTranslationsVersion.AppVersionId}
          versionId={updateTranslationsVersion.AppVersionId}
          versionName={updateTranslationsVersion.AppVersionName}
          baseLanguage={updateTranslationsVersion.AppVersionLanguage}
          currentTranslateLanguages={
            updateTranslationsVersion.TranslateLanguages
          }
          onClose={() => setUpdateTranslationsVersion(null)}
          onUpdated={() => {
            setUpdateTranslationsVersion(null);
            getAppVersions()
              .then(setAppVersions)
              .catch(() => {});
          }}
        />
      )}
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
          onSelectCta={handleSelectCta}
          onEditCta={handleEditCta}
          selectedCtaId={selectedCtaId}
          themeCtaColors={selectedTheme?.ThemeCtaColors ?? []}
          onTileMenuAction={handleTileMenuAction}
          onRenamePage={handleRenamePage}
          liveTileText={liveTileText}
          onActiveFrameChange={handleActiveFrameChange}
        />
        {isHistoryOpen ? (
          <VersionHistorySidebar
            appVersionId={currentVersion?.AppVersionId}
            onClose={() => setIsHistoryOpen(false)}
            onRestored={() => setIsHistoryOpen(false)}
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
            pageName={activePageName}
            selectedCta={selectedCta}
            onEditCta={handleEditCta}
          />
        )}
      </div>
      {tileImageModal && (
        <TileImageModal
          tileWidth={tileImageModal.tileWidth}
          tileHeight={tileImageModal.tileHeight}
          initialOriginalUrl={tileImageModal.initialOriginalUrl}
          initialOpacity={tileImageModal.initialOpacity}
          onConfirm={handleTileImageConfirm}
          onCancel={() => setTileImageModal(null)}
        />
      )}
      {pendingCta && (
        <AddCtaModal
          ctaType={pendingCta.blockType.slice(4)}
          onConfirm={handleConfirmCta}
          onCancel={() => setPendingCta(null)}
        />
      )}
    </>
  );
}

export default App;
