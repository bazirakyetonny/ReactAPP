import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  getAppVersions, getActiveAppVersion, activateAppVersion,
  type SDTAppVersion,
} from './services/appVersionsApi';
import { CreateAppVersionModal } from './components/appversion/CreateAppVersionModal';
import { RenameAppVersionModal } from './components/appversion/RenameAppVersionModal';
import { MoveToTrashModal } from './components/appversion/MoveToTrashModal';
import { DuplicateAppVersionModal } from './components/appversion/DuplicateAppVersionModal';
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { TileImageModal } from './components/phone/TileImageModal';
import { AddCtaModal } from './components/phone/AddCtaModal';
import { SidebarRight } from './components/SidebarRight';
import { PageBubbleTree } from './components/tree/PageBubbleTree';
import { dataStore } from './data/datastore';
import type { Theme, Mood, CategoryTemplates } from './types';
import { parseInfoContent, applyEditTile, applyAddBlock } from './utils/contentTransforms';
import { extractLinks, checkLink } from './utils/linkChecker';
import { buildLinkedFrames } from './utils/linkedFrames';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useNavigation } from './hooks/useNavigation';
import { useContentHandlers } from './hooks/useContentHandlers';
import { useAutoSave } from './hooks/useAutoSave';

function App() {
  const themes: Theme[] = dataStore.get('themes') ?? [];
  const allMoods: Mood[] = dataStore.get('Moods') ?? [];
  const templatesCollection: CategoryTemplates[] = dataStore.get('TemplatesCollection') ?? [];

  const [currentVersion, setCurrentVersion] = useState<any>(() => dataStore.get('Current_Version'));
  const [appVersions, setAppVersions] = useState<SDTAppVersion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [renameVersion, setRenameVersion] = useState<SDTAppVersion | null>(null);
  const [trashVersion, setTrashVersion] = useState<SDTAppVersion | null>(null);
  const [duplicateVersion, setDuplicateVersion] = useState<SDTAppVersion | null>(null);

  useEffect(() => { getAppVersions().then(setAppVersions).catch(() => {}); }, []);

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    dataStore.get('CurrentThemeId') ?? themes[0]?.ThemeId ?? ''
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [selectedCtaId, setSelectedCtaId] = useState<string | null>(null);
  const [infoContent, setInfoContent] = useState<any[]>(parseInfoContent);
  const [tileImageModal, setTileImageModal] = useState<{
    tileId: string; tileWidth: number; tileHeight: number;
    initialOriginalUrl?: string; initialOpacity?: number;
  } | null>(null);
  const [pendingCta, setPendingCta] = useState<{
    blockType: string; insertBeforeInfoId: string | null; frameId: string | null;
  } | null>(null);
  const [invalidLinkCount, setInvalidLinkCount] = useState(0);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const linkCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);

  // Live refs so hooks always read the current values
  const infoContentRef = useRef(infoContent);
  const navContentsRef = useRef<Record<string, any[]>>({});
  const navStackRef = useRef<string[]>([]);
  useLayoutEffect(() => { infoContentRef.current = infoContent; });

  const { navStack, setNavStack, navContents, setNavContents, navUpdater,
    handleTileNavigate, handleCollapseDescendants, handleNavigateToPath,
    handleDeletePage, handleCloseFromIndex } = useNavigation();

  useLayoutEffect(() => { navContentsRef.current = navContents; });
  useLayoutEffect(() => { navStackRef.current = navStack; });

  const { undoStack, redoStack, pushSnapshot, clearHistory, handleUndo, handleRedo, isResizingRef } =
    useUndoRedo({ infoContentRef, navContentsRef, navStackRef, setInfoContent, setNavContents, setNavStack });

  const { handleAddColumn, handleDeleteTile, handleAddStandaloneTile, handleAddBlock,
    handleEditCta, handleSelectCta, handleAddTilesToColumn,
    handleAddDescription, handleEditDescription, handleDeleteBlock,
    handleAddImage, handleEditImage, handleMoveBlock, handleCrossFrameBlockDrop,
    handleEditTile, handleFreeResizeRelease, handleTileDrop, handleTileDropAsNewBlock,
    handleCrossFrameTileDrop, handleCrossFrameTileDropToEmpty, handleCrossFrameTileDropAsNewBlock,
  } = useContentHandlers({
    infoContent, setInfoContent, navContents, setNavContents, navStack,
    selectedTileId, setSelectedTileId, setSelectedCtaId, setPendingCta,
    pushSnapshot, isResizingRef,
  });

  // ── Version switching ────────────────────────────────────────────────────

  async function handleVersionSelect(id: string) {
    if (id === currentVersion?.AppVersionId) return;
    await activateAppVersion(id);
    const fetched = (await getActiveAppVersion()) as any;
    const fullVersion = { ...fetched, Page: fetched.Page ?? fetched.Pages ?? [] };
    dataStore.set('Current_Version', fullVersion);
    setCurrentVersion(fullVersion);
    setInfoContent(parseInfoContent());
    setNavStack([]);
    setNavContents({});
    clearHistory();
    setSelectedTileId(null);
    getAppVersions().then(setAppVersions).catch(() => {});
  }

  // ── Link checker ─────────────────────────────────────────────────────────

  useEffect(() => {
    const token = { cancelled: false };
    if (linkCheckTimerRef.current) clearTimeout(linkCheckTimerRef.current);
    linkCheckTimerRef.current = setTimeout(async () => {
      const blocks = [...infoContent, ...Object.values(navContents).flat()];
      const links = extractLinks(blocks);
      if (links.length === 0) { setInvalidLinkCount(0); setIsCheckingLinks(false); return; }
      setIsCheckingLinks(true);
      const results = await Promise.all(links.map(checkLink));
      if (token.cancelled) return;
      setInvalidLinkCount(results.filter((r: boolean) => !r).length);
      setIsCheckingLinks(false);
    }, 3000);
    return () => { if (linkCheckTimerRef.current) clearTimeout(linkCheckTimerRef.current); token.cancelled = true; };
  }, [infoContent, navContents]);

  // ── Derived state ────────────────────────────────────────────────────────

  const selectedTheme = themes.find(t => t.ThemeId === selectedThemeId);
  const themeMoods = allMoods.filter(m => m.ThemeId === selectedThemeId);
  const allPages: any[] = dataStore.get('Current_Version')?.Page ?? [];
  const activePageName = navStack.length
    ? (allPages.find(p => p.PageId === navStack[navStack.length - 1])?.PageName ?? '')
    : 'Home';

  const allTiles = [
    ...infoContent.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? [])),
    ...Object.values(navContents).flatMap(blocks => blocks.flatMap((b: any) => (b.Columns ?? []).flatMap((c: any) => c.Tiles ?? []))),
  ];
  const selectedTile = selectedTileId ? (allTiles.find((t: any) => t.Id === selectedTileId) ?? null) : null;

  const allBlocks = [...infoContent, ...Object.values(navContents).flat()];
  const selectedCta = selectedCtaId
    ? (allBlocks.find((b: any) => b.InfoType === 'Cta' && b.InfoId === selectedCtaId) ?? null)
    : null;

  const activeNavTileIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < navStack.length; i++) {
      const parentContent = i === 0 ? infoContent : (navContents[navStack[i - 1]] ?? []);
      for (const block of parentContent) {
        if (block.InfoType !== 'TileGrid') continue;
        for (const col of block.Columns ?? [])
          for (const tile of col.Tiles ?? [])
            if (tile.Action?.ObjectId === navStack[i]) ids.add(tile.Id);
      }
    }
    return ids;
  }, [navStack, infoContent, navContents]);

  // ── Auto-save ────────────────────────────────────────────────────────────

  const { isSaving, saveError, savedAt } = useAutoSave(infoContent, navContents, currentVersion?.AppVersionId);

  // ── Data persistence ─────────────────────────────────────────────────────

  useEffect(() => {
    const cv = dataStore.get('Current_Version');
    if (!cv) return;
    dataStore.set('Current_Version', {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        if (p.PageName?.toLowerCase() !== 'home') return p;
        let existing: any = {};
        try { existing = JSON.parse(p.PageStructure); } catch {}
        return { ...p, PageStructure: JSON.stringify({ ...existing, InfoContent: infoContent }) };
      }),
    });
  }, [infoContent]);

  useEffect(() => {
    if (Object.keys(navContents).length === 0) return;
    const cv = dataStore.get('Current_Version');
    if (!cv) return;
    dataStore.set('Current_Version', {
      ...cv,
      Page: (cv.Page ?? []).map((p: any) => {
        const content = navContents[p.PageId];
        if (content === undefined) return p;
        let existing: any = {};
        try { existing = JSON.parse(p.PageStructure); } catch {}
        return { ...p, PageStructure: JSON.stringify({ ...existing, InfoContent: content }) };
      }),
    });
  }, [navContents]);

  // ── Tile image modal ─────────────────────────────────────────────────────

  function handleTileDoubleClick(tileId: string, rect: DOMRect) {
    let tile: any = null;
    const find = (blocks: any[]) => blocks.forEach(b =>
      (b.Columns ?? []).forEach((col: any) => {
        const found = (col.Tiles ?? []).find((t: any) => t.Id === tileId);
        if (found) tile = found;
      })
    );
    find(infoContentRef.current);
    Object.values(navContentsRef.current).forEach(find);
    setTileImageModal({ tileId, tileWidth: rect.width, tileHeight: rect.height, initialOriginalUrl: tile?.OriginalImageUrl, initialOpacity: tile?.Opacity });
  }

  function handleTileImageConfirm(result: { bgImageUrl: string; opacity: number; originalImageUrl: string; originalMediaId: string }) {
    if (!tileImageModal) return;
    pushSnapshot();
    const patch = { BGImageUrl: result.bgImageUrl, OriginalImageUrl: result.originalImageUrl, Opacity: result.opacity, BGColor: null };
    setInfoContent(prev => applyEditTile(prev, tileImageModal.tileId, patch));
    setNavContents(prev => {
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

  function handleConfirmCta(attrs: { CtaLabel: string; CtaAction: string; CtaConnectedSupplierId?: string; CtaSupplierIsConnected: boolean }) {
    if (!pendingCta) return;
    pushSnapshot();
    const ts = Date.now();
    const { blockType, insertBeforeInfoId, frameId } = pendingCta;
    if (frameId === null) {
      setInfoContent(prev => applyAddBlock(prev, blockType, insertBeforeInfoId, ts, attrs));
    } else {
      setNavContents(prev => ({
        ...prev,
        [frameId]: applyAddBlock(prev[frameId] ?? [], blockType, insertBeforeInfoId, ts, attrs),
      }));
    }
    setSelectedCtaId(`cta-${ts}`);
    setSelectedTileId(null);
    setPendingCta(null);
  }

  // ── Linked frames ────────────────────────────────────────────────────────

  const linkedFrames = buildLinkedFrames({
    navStack, navContents, allPages,
    pushSnapshot, isResizingRef,
    selectedTileId, setSelectedTileId, setSelectedCtaId, setPendingCta,
    navUpdater, handleCloseFromIndex,
    handleEditTile, handleSelectCta, handleEditCta, handleTileDoubleClick,
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
        onDuplicateVersion={id => setDuplicateVersion(appVersions.find(a => a.AppVersionId === id) ?? null)}
        onRenameVersion={id => setRenameVersion(appVersions.find(a => a.AppVersionId === id) ?? null)}
        onUpdateTranslations={id => console.log('update translations', id)}
        onMoveVersionToTrash={id => setTrashVersion(appVersions.find(a => a.AppVersionId === id) ?? null)}
        themes={themes}
        selectedThemeId={selectedThemeId}
        onThemeChange={setSelectedThemeId}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExpand={() => setTreeOpen(v => !v)}
        invalidLinkCount={invalidLinkCount}
        isCheckingLinks={isCheckingLinks}
        isSaving={isSaving}
        saveError={saveError}
        savedAt={savedAt}
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
              const full = { ...fetched, Page: fetched.Page ?? fetched.Pages ?? [] };
              dataStore.set('Current_Version', full);
              setCurrentVersion(full);
              setInfoContent(parseInfoContent());
              setNavStack([]); setNavContents({}); clearHistory(); setSelectedTileId(null);
            } catch {}
            getAppVersions().then(setAppVersions).catch(() => {});
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
          onRenamed={newName => {
            setAppVersions(prev => prev.map(a =>
              a.AppVersionId === renameVersion.AppVersionId ? { ...a, AppVersionName: newName } : a
            ));
            if (renameVersion.AppVersionId === currentVersion?.AppVersionId) {
              const merged = { ...currentVersion, AppVersionName: newName };
              dataStore.set('Current_Version', merged);
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
          onDeleted={() => { setTrashVersion(null); getAppVersions().then(setAppVersions).catch(() => {}); }}
        />
      )}
      {duplicateVersion && (
        <DuplicateAppVersionModal
          key={duplicateVersion.AppVersionId}
          versionId={duplicateVersion.AppVersionId}
          currentName={duplicateVersion.AppVersionName}
          onClose={() => setDuplicateVersion(null)}
          onDuplicated={() => { setDuplicateVersion(null); getAppVersions().then(setAppVersions).catch(() => {}); }}
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
            onNavigateToPath={pageIds => { handleNavigateToPath(pageIds); setTreeOpen(false); }}
            onDeletePage={handleDeletePage}
          />
        )}
        <MainCanvas
          themeColors={selectedTheme?.ThemeColors}
          themeIcons={selectedTheme?.ThemeIcons ?? []}
          infoContent={infoContent}
          selectedTileId={selectedTileId}
          onSelectTile={id => { setSelectedTileId(id); setSelectedCtaId(null); }}
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
          onDeselectTile={() => { setSelectedTileId(null); setSelectedCtaId(null); }}
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
          onBeforeTileTextEdit={pushSnapshot}
          pageName={activePageName}
          selectedCta={selectedCta}
          onEditCta={handleEditCta}
          onBeforeCtaEdit={pushSnapshot}
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
