import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  getAppVersions,
  getActiveAppVersion,
  activateAppVersion,
  type SDTAppVersion,
} from "./services/appVersionsApi";
import { CreateAppVersionModal } from "./components/appversion/CreateAppVersionModal";
import { RenameAppVersionModal } from "./components/appversion/RenameAppVersionModal";
import { MoveToTrashModal } from "./components/appversion/MoveToTrashModal";
import { DuplicateAppVersionModal } from "./components/appversion/DuplicateAppVersionModal";
import { NavBar } from "./components/NavBar";
import { MainCanvas } from "./components/MainCanvas";
import { TileImageModal } from "./components/phone/TileImageModal";
import { AddCtaModal } from "./components/phone/AddCtaModal";

import type { TileDropPreview } from "./components/MainCanvas";
import { SidebarRight } from "./components/SidebarRight";
import { PageBubbleTree } from "./components/tree/PageBubbleTree";
import { dataStore } from "./data/datastore";
import type { Theme, Mood, CategoryTemplates } from "./types";
import {
  applyAddColumn,
  applyDeleteTile,
  applyAddStandaloneTile,
  applyAddBlock,
  applyEditTile,
  applyAddTilesToColumn,
  applyFreeResizeRelease,
  applyTileDrop,
  applyTileDropAsNewBlock,
  extractTileFromContent,
  insertTileAtPreview,
  parseInfoContent,
  applyAddDescription,
  applyEditDescription,
  applyDeleteBlock,
  applyMoveBlock,
  applyExtractBlock,
  applyInsertBlock,
  applyAddImage,
  applyEditImageSelection,
  applyEditCta,
} from "./utils/contentTransforms";

const TILE_H = 80;

function App() {
  const themes: Theme[] = dataStore.get("themes") ?? [];
  const allMoods: Mood[] = dataStore.get("Moods") ?? [];
  const [currentVersion, setCurrentVersion] = useState<any>(() =>
    dataStore.get("Current_Version"),
  );
  const templatesCollection: CategoryTemplates[] =
    dataStore.get("TemplatesCollection") ?? [];

  const [appVersions, setAppVersions] = useState<SDTAppVersion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameVersion, setRenameVersion] = useState<SDTAppVersion | null>(
    null,
  );
  const [trashVersion, setTrashVersion] = useState<SDTAppVersion | null>(null);
  const [duplicateVersion, setDuplicateVersion] =
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

  const [navStack, setNavStack] = useState<string[]>([]);
  const [navContents, setNavContents] = useState<Record<string, any[]>>({});
  const [treeOpen, setTreeOpen] = useState(false);
  const [tileImageModal, setTileImageModal] = useState<{
    tileId: string;
    tileWidth: number;
    tileHeight: number;
    initialOriginalUrl?: string;
    initialOpacity?: number;
  } | null>(null);
  const [pendingCta, setPendingCta] = useState<{
    blockType: string;
    insertBeforeInfoId: string | null;
    frameId: string | null;
  } | null>(null);

  type Snapshot = {
    infoContent: any[];
    navContents: Record<string, any[]>;
    navStack: string[];
  };
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const isResizingRef = useRef(false);

  // Refs always hold latest values — eliminates stale-closure bugs in undo/redo
  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef(navContents);
  const navStackRef = useRef(navStack);
  const undoStackRef = useRef(undoStack);
  const redoStackRef = useRef(redoStack);
  useLayoutEffect(() => {
    infoContentRef.current = infoContent;
  });
  useLayoutEffect(() => {
    navContentsRef.current = navContents;
  });
  useLayoutEffect(() => {
    navStackRef.current = navStack;
  });
  useLayoutEffect(() => {
    undoStackRef.current = undoStack;
  });
  useLayoutEffect(() => {
    redoStackRef.current = redoStack;
  });

  function currentSnapshot(): Snapshot {
    return {
      infoContent: infoContentRef.current,
      navContents: navContentsRef.current,
      navStack: navStackRef.current,
    };
  }

  function pushSnapshot() {
    setUndoStack((prev) => [...prev, currentSnapshot()]);
    setRedoStack([]);
  }

  function restoreSnapshot(snap: Snapshot) {
    setInfoContent(snap.infoContent);
    setNavContents(snap.navContents);
    setNavStack(snap.navStack);
  }

  function handleUndo() {
    const stack = undoStackRef.current;
    if (!stack.length) return;
    const snap = stack[stack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, currentSnapshot()]);
    restoreSnapshot(snap);
  }

  function handleRedo() {
    const stack = redoStackRef.current;
    if (!stack.length) return;
    const snap = stack[stack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, currentSnapshot()]);
    restoreSnapshot(snap);
  }

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
    setInfoContent(parseInfoContent());
    setNavStack([]);
    setNavContents({});
    setUndoStack([]);
    setRedoStack([]);
    setSelectedTileId(null);
    getAppVersions()
      .then(setAppVersions)
      .catch(() => {});
  }

  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  useLayoutEffect(() => {
    handleUndoRef.current = handleUndo;
  });
  useLayoutEffect(() => {
    handleRedoRef.current = handleRedo;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndoRef.current();
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedoRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedTheme = themes.find((t) => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter((m) => m.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get("Current_Version")?.Page ?? [];
  const activePageId = navStack[navStack.length - 1];
  const activePageName = activePageId
    ? (allPages.find((p) => p.PageId === activePageId)?.PageName ?? "")
    : "Home";

  const selectedTile = selectedTileId
    ? ([
        ...infoContent.flatMap((b: any) =>
          (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []),
        ),
        ...Object.values(navContents).flatMap((blocks) =>
          blocks.flatMap((b: any) =>
            (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []),
          ),
        ),
      ].find((t: any) => t.Id === selectedTileId) ?? null)
    : null;

  const allBlocks = [...infoContent, ...Object.values(navContents).flat()];
  const selectedCta = selectedCtaId
    ? (allBlocks.find(
        (b: any) => b.InfoType === "Cta" && b.InfoId === selectedCtaId,
      ) ?? null)
    : null;

  const activeNavTileIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < navStack.length; i++) {
      const pageId = navStack[i];
      const parentContent =
        i === 0 ? infoContent : (navContents[navStack[i - 1]] ?? []);
      for (const block of parentContent) {
        if (block.InfoType !== "TileGrid") continue;
        for (const col of block.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.Action?.ObjectId === pageId) ids.add(tile.Id);
          }
        }
      }
    }
    return ids;
  }, [navStack, infoContent, navContents]);

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

  function handleAddColumn(gridId: string, afterColId: string) {
    pushSnapshot();
    setInfoContent((prev) => applyAddColumn(prev, gridId, afterColId));
  }

  function handleDeleteTile(gridId: string, colId: string, tileId: string) {
    if (selectedTileId === tileId) setSelectedTileId(null);
    pushSnapshot();
    setInfoContent((prev) => applyDeleteTile(prev, gridId, colId, tileId));
  }

  function handleAddStandaloneTile() {
    if (!isResizingRef.current) pushSnapshot();
    const ts = Date.now();
    setInfoContent((prev) => applyAddStandaloneTile(prev, ts));
    setSelectedTileId(`tile-${ts}`);
  }

  function handleAddBlock(
    blockType: string,
    insertBeforeInfoId: string | null,
  ) {
    if (blockType.startsWith("Cta_")) {
      setPendingCta({ blockType, insertBeforeInfoId, frameId: null });
      return;
    }
    pushSnapshot();
    const ts = Date.now();
    if (blockType === "TileGrid") {
      setInfoContent((prev) =>
        applyAddBlock(prev, blockType, insertBeforeInfoId, ts),
      );
      setSelectedTileId(`tile-${ts}`);
      setSelectedCtaId(null);
    } else {
      setInfoContent((prev) =>
        applyAddBlock(prev, blockType, insertBeforeInfoId),
      );
    }
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

  function handleEditCta(ctaId: string, patch: Record<string, any>) {
    pushSnapshot();
    setInfoContent((prev) => applyEditCta(prev, ctaId, patch));
    setNavContents((prev) => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditCta(blocks, ctaId, patch);
      return next;
    });
  }

  function handleSelectCta(ctaId: string) {
    setSelectedCtaId(ctaId);
    setSelectedTileId(null);
  }

  function handleAddTilesToColumn(
    gridId: string,
    colId: string,
    count: number,
  ) {
    if (!isResizingRef.current) pushSnapshot();
    setInfoContent((prev) => applyAddTilesToColumn(prev, gridId, colId, count));
  }

  function handleAddDescription(
    html: string,
    insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    setInfoContent((prev) =>
      applyAddDescription(prev, html, insertBeforeInfoId),
    );
  }

  function handleEditDescription(infoId: string, html: string) {
    pushSnapshot();
    setInfoContent((prev) => applyEditDescription(prev, infoId, html));
    setNavContents((prev) => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditDescription(blocks, infoId, html);
      return next;
    });
  }

  function handleDeleteBlock(infoId: string) {
    pushSnapshot();
    setInfoContent((prev) => applyDeleteBlock(prev, infoId));
  }

  function handleAddImage(
    images: { InfoImageId: string; InfoImageValue: string }[],
    insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    setInfoContent((prev) => applyAddImage(prev, images, insertBeforeInfoId));
  }

  function handleEditImage(
    infoId: string,
    images: { InfoImageId: string; InfoImageValue: string }[],
  ) {
    pushSnapshot();
    setInfoContent((prev) => applyEditImageSelection(prev, infoId, images));
    setNavContents((prev) => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditImageSelection(blocks, infoId, images);
      return next;
    });
  }

  function handleMoveBlock(infoId: string, insertBeforeInfoId: string | null) {
    pushSnapshot();
    setInfoContent((prev) => applyMoveBlock(prev, infoId, insertBeforeInfoId));
  }

  function handleCrossFrameBlockDrop(
    infoId: string,
    fromFrameIdx: number,
    toFrameIdx: number,
    insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    const srcContent =
      fromFrameIdx === -1
        ? infoContent
        : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent =
      toFrameIdx === -1
        ? infoContent
        : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, block } = applyExtractBlock(srcContent, infoId);
    if (!block) return;
    const newTgt = applyInsertBlock(tgtContent, block, insertBeforeInfoId);
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents((prev) => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleFreeResizeRelease(
    gridId: string,
    longTileId: string,
    snapH: number,
    zoneCount: number,
    initialCount: number,
    oppColId: string,
    allOppTiles: any[],
  ) {
    isResizingRef.current = false;
    setInfoContent((prev) =>
      applyFreeResizeRelease(
        prev,
        gridId,
        longTileId,
        snapH,
        zoneCount,
        initialCount,
        oppColId,
        allOppTiles,
      ),
    );
  }

  function handleTileDrop(
    fromGridId: string,
    fromColId: string,
    tileId: string,
    preview: TileDropPreview,
  ) {
    pushSnapshot();
    setInfoContent((prev) =>
      applyTileDrop(prev, fromGridId, fromColId, tileId, preview),
    );
  }

  function handleTileDropAsNewBlock(
    fromGridId: string,
    fromColId: string,
    tileId: string,
    insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    setInfoContent((prev) =>
      applyTileDropAsNewBlock(
        prev,
        fromGridId,
        fromColId,
        tileId,
        insertBeforeInfoId,
      ),
    );
  }

  function handleCrossFrameTileDrop(
    fromFrameIdx: number,
    toFrameIdx: number,
    fromGridId: string,
    fromColId: string,
    tileId: string,
    preview: TileDropPreview,
  ) {
    pushSnapshot();
    const srcContent =
      fromFrameIdx === -1
        ? infoContent
        : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent =
      toFrameIdx === -1
        ? infoContent
        : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(
      srcContent,
      fromGridId,
      fromColId,
      tileId,
    );
    if (!tile) return;
    const newTgt = insertTileAtPreview(tgtContent, tile, preview);
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents((prev) => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleCrossFrameTileDropToEmpty(
    fromFrameIdx: number,
    toFrameIdx: number,
    fromGridId: string,
    fromColId: string,
    tileId: string,
  ) {
    pushSnapshot();
    const srcContent =
      fromFrameIdx === -1
        ? infoContent
        : (navContents[navStack[fromFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(
      srcContent,
      fromGridId,
      fromColId,
      tileId,
    );
    if (!tile) return;
    const ts = Date.now();
    const newTgt = [
      {
        InfoId: `grid-${ts}`,
        InfoType: "TileGrid",
        Columns: [{ ColId: `col-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      },
    ];
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents((prev) => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleCrossFrameTileDropAsNewBlock(
    fromFrameIdx: number,
    toFrameIdx: number,
    fromGridId: string,
    fromColId: string,
    tileId: string,
    insertBeforeInfoId: string | null,
  ) {
    pushSnapshot();
    const srcContent =
      fromFrameIdx === -1
        ? infoContent
        : (navContents[navStack[fromFrameIdx]] ?? []);
    const tgtContent =
      toFrameIdx === -1
        ? infoContent
        : (navContents[navStack[toFrameIdx]] ?? []);
    const { content: newSrc, tile } = extractTileFromContent(
      srcContent,
      fromGridId,
      fromColId,
      tileId,
    );
    if (!tile) return;
    const ts = Date.now();
    const newGrid = {
      InfoId: `grid-new-${ts}`,
      InfoType: "TileGrid",
      Columns: [
        { ColId: `col-new-${ts}`, Tiles: [{ ...tile, Height: TILE_H }] },
      ],
    };
    const newTgt =
      insertBeforeInfoId === null
        ? [...tgtContent, newGrid]
        : (() => {
            const idx = tgtContent.findIndex(
              (b: any) => b.InfoId === insertBeforeInfoId,
            );
            return idx === -1
              ? [...tgtContent, newGrid]
              : [
                  ...tgtContent.slice(0, idx),
                  newGrid,
                  ...tgtContent.slice(idx),
                ];
          })();
    if (fromFrameIdx === -1) setInfoContent(newSrc);
    if (toFrameIdx === -1) setInfoContent(newTgt);
    setNavContents((prev) => {
      const next = { ...prev };
      if (fromFrameIdx !== -1) next[navStack[fromFrameIdx]] = newSrc;
      if (toFrameIdx !== -1) next[navStack[toFrameIdx]] = newTgt;
      return next;
    });
  }

  function handleEditTile(tileId: string, patch: Record<string, any>) {
    const keys = Object.keys(patch);
    const isHeightOnly = keys.length === 1 && "Height" in patch;
    const isOpacityOnly = keys.length === 1 && "Opacity" in patch;
    if (isHeightOnly) {
      if (!isResizingRef.current) {
        pushSnapshot();
        isResizingRef.current = true;
      }
    } else if (!isOpacityOnly) {
      pushSnapshot();
    }
    setInfoContent((prev) => applyEditTile(prev, tileId, patch));
    setNavContents((prev) => {
      const next: Record<string, any[]> = {};
      for (const [id, blocks] of Object.entries(prev))
        next[id] = applyEditTile(blocks, tileId, patch);
      return next;
    });
  }

  function handleTileDoubleClick(tileId: string, rect: DOMRect) {
    let tile: any = null;
    const findTile = (blocks: any[]) => {
      for (const b of blocks)
        for (const col of b.Columns ?? []) {
          const found = (col.Tiles ?? []).find((t: any) => t.Id === tileId);
          if (found) tile = found;
        }
    };
    findTile(infoContentRef.current);
    for (const blocks of Object.values(navContentsRef.current))
      findTile(blocks);
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
    opacity: number;
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
    if (!el) return;
    handleTileDoubleClick(selectedTileId, el.getBoundingClientRect());
  }

  function handleTileNavigate(pageId: string, parentIndex: number) {
    const insertAt = parentIndex + 1;
    setNavStack((prev) => {
      if (prev[insertAt] === pageId) return prev.slice(0, insertAt + 1);
      return [...prev.slice(0, insertAt), pageId];
    });
    setNavContents((prev) => {
      if (prev[pageId] !== undefined) return prev;
      const cv = dataStore.get("Current_Version");
      const page = (cv?.Page ?? []).find((p: any) => p.PageId === pageId);
      if (!page?.PageStructure) return { ...prev, [pageId]: [] };
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
    const cutAt = parentIndex + 1;
    setNavStack((prev) => (prev.length <= cutAt ? prev : prev.slice(0, cutAt)));
  }

  function handleNavigateToPath(pageIds: string[]) {
    setNavStack(pageIds);
    setNavContents((prev) => {
      const next = { ...prev };
      for (const pageId of pageIds) {
        if (next[pageId] !== undefined) continue;
        const cv = dataStore.get("Current_Version");
        const page = (cv?.Page ?? []).find((p: any) => p.PageId === pageId);
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
    setTreeOpen(false);
  }

  function handleDeletePage(pageId: string) {
    const cv = dataStore.get("Current_Version");
    if (!cv) return;
    dataStore.set("Current_Version", {
      ...cv,
      Page: (cv.Page ?? []).filter((p: any) => p.PageId !== pageId),
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

  function navUpdater(pageId: string) {
    return (transform: (blocks: any[]) => any[]) =>
      setNavContents((prev) => ({
        ...prev,
        [pageId]: transform(prev[pageId] ?? []),
      }));
  }

  const linkedFrames = navStack.map((pageId, index) => {
    const page = allPages.find((p: any) => p.PageId === pageId);
    const update = navUpdater(pageId);
    return {
      page,
      infoContent: navContents[pageId] ?? [],
      onClose: () => handleCloseFromIndex(index),
      onAddColumn: (gridId: string, afterColId: string) => {
        pushSnapshot();
        update((prev) => applyAddColumn(prev, gridId, afterColId));
      },
      onDeleteTile: (gridId: string, colId: string, tileId: string) => {
        if (selectedTileId === tileId) setSelectedTileId(null);
        pushSnapshot();
        update((prev) => applyDeleteTile(prev, gridId, colId, tileId));
      },
      onEditTile: handleEditTile,
      onTileDoubleClick: handleTileDoubleClick,
      onDeselectTile: () => {
        setSelectedTileId(null);
        setSelectedCtaId(null);
      },
      onSelectCta: handleSelectCta,
      onEditCta: handleEditCta,
      onAddStandaloneTile: () => {
        if (!isResizingRef.current) pushSnapshot();
        const ts = Date.now();
        update((prev) => applyAddStandaloneTile(prev, ts));
        setSelectedTileId(`tile-${ts}`);
        setSelectedCtaId(null);
      },
      onAddBlock: (blockType: string, insertBeforeInfoId: string | null) => {
        if (blockType.startsWith("Cta_")) {
          setPendingCta({ blockType, insertBeforeInfoId, frameId: pageId });
          return;
        }
        pushSnapshot();
        const ts = Date.now();
        if (blockType === "TileGrid") {
          update((prev) =>
            applyAddBlock(prev, blockType, insertBeforeInfoId, ts),
          );
          setSelectedTileId(`tile-${ts}`);
          setSelectedCtaId(null);
        } else {
          update((prev) => applyAddBlock(prev, blockType, insertBeforeInfoId));
        }
      },
      onAddTilesToColumn: (gridId: string, colId: string, count: number) => {
        if (!isResizingRef.current) pushSnapshot();
        update((prev) => applyAddTilesToColumn(prev, gridId, colId, count));
      },
      onFreeResizeRelease: (
        gridId: string,
        longTileId: string,
        snapH: number,
        zoneCount: number,
        initialCount: number,
        oppColId: string,
        allOppTiles: any[],
      ) => {
        isResizingRef.current = false;
        update((prev) =>
          applyFreeResizeRelease(
            prev,
            gridId,
            longTileId,
            snapH,
            zoneCount,
            initialCount,
            oppColId,
            allOppTiles,
          ),
        );
      },
      onTileDrop: (
        fromGridId: string,
        fromColId: string,
        tileId: string,
        preview: TileDropPreview,
      ) => {
        pushSnapshot();
        update((prev) =>
          applyTileDrop(prev, fromGridId, fromColId, tileId, preview),
        );
      },
      onTileDropAsNewBlock: (
        fromGridId: string,
        fromColId: string,
        tileId: string,
        insertBeforeInfoId: string | null,
      ) => {
        pushSnapshot();
        update((prev) =>
          applyTileDropAsNewBlock(
            prev,
            fromGridId,
            fromColId,
            tileId,
            insertBeforeInfoId,
          ),
        );
      },
      onAddDescription: (html: string, insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update((prev) => applyAddDescription(prev, html, insertBeforeInfoId));
      },
      onEditDescription: (infoId: string, html: string) => {
        pushSnapshot();
        update((prev) => applyEditDescription(prev, infoId, html));
      },
      onDeleteBlock: (infoId: string) => {
        pushSnapshot();
        update((prev) => applyDeleteBlock(prev, infoId));
      },
      onMoveBlock: (infoId: string, insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update((prev) => applyMoveBlock(prev, infoId, insertBeforeInfoId));
      },
      onAddImage: (
        images: { InfoImageId: string; InfoImageValue: string }[],
        insertBeforeInfoId: string | null,
      ) => {
        pushSnapshot();
        update((prev) => applyAddImage(prev, images, insertBeforeInfoId));
      },
      onEditImage: (
        infoId: string,
        images: { InfoImageId: string; InfoImageValue: string }[],
      ) => {
        pushSnapshot();
        update((prev) => applyEditImageSelection(prev, infoId, images));
      },
    };
  });

  return (
    <>
      <NavBar
        version={currentVersion}
        appVersions={appVersions as any}
        selectedVersionId={currentVersion?.AppVersionId}
        onVersionSelect={handleVersionSelect}
        onNewVersion={() => setShowCreateModal(true)}
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
        onUpdateTranslations={(id) => console.log("update translations", id)}
        onMoveVersionToTrash={(id) =>
          setTrashVersion(
            appVersions.find((a) => a.AppVersionId === id) ?? null,
          )
        }
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExpand={() => setTreeOpen((v) => !v)}
      />
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
              const fullVersion = {
                ...fetched,
                Page: fetched.Page ?? fetched.Pages ?? [],
              };
              dataStore.set("Current_Version", fullVersion);
              setCurrentVersion(fullVersion);
              setInfoContent(parseInfoContent());
              setNavStack([]);
              setNavContents({});
              setUndoStack([]);
              setRedoStack([]);
              setSelectedTileId(null);
            } catch {
              // version list still refreshes even if activation fails
            }
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
            onNavigateToPath={handleNavigateToPath}
            onDeletePage={handleDeletePage}
          />
        )}
        <MainCanvas
          themeColors={selectedTheme?.ThemeColors}
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          infoContent={infoContent}
          selectedTileId={selectedTileId}
          onSelectTile={(id) => {
            setSelectedTileId(id);
            setSelectedCtaId(null);
          }}
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
        />
        <SidebarRight
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          themeColors={selectedTheme?.ThemeColors}
          ctaColors={selectedTheme?.ThemeCtaColors ?? []}
          moods={themeMoods}
          selectedTile={selectedTile}
          onEditTile={handleEditTile}
          onOpenTileImage={handleOpenTileImageFromSidebar}
          onBeforeOpacityChange={pushSnapshot}
          pageName={activePageName}
          selectedCta={selectedCta}
          onEditCta={handleEditCta}
        />
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
