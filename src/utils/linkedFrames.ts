import {
  applyAddColumn, applyDeleteTile, applyAddStandaloneTile, applyAddBlock,
  applyAddTilesToColumn, applyFreeResizeRelease, applyTileDrop, applyTileDropAsNewBlock,
  applyAddDescription, applyEditDescription, applyDeleteBlock, applyMoveBlock,
  applyAddImage, applyEditImageSelection, applyPasteBlocks,
} from './contentTransforms';
import type { TileDropPreview } from '../components/MainCanvas';

export const NEW_PAGE_SENTINEL = '__new_page__';

interface BuildLinkedFramesParams {
  navStack: string[];
  navContents: Record<string, any[]>;
  navUrls: Record<string, string>;
  allPages: any[];
  pushSnapshot: () => void;
  isResizingRef: React.MutableRefObject<boolean>;
  selectedTileId: string | null;
  setSelectedTileId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedCtaId: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingCta: React.Dispatch<React.SetStateAction<any>>;
  setNavStack: React.Dispatch<React.SetStateAction<string[]>>;
  navSourceTiles: Record<string, string>;
  navUpdater: (pageId: string) => (transform: (blocks: any[]) => any[]) => void;
  handleCloseFromIndex: (stackIndex: number) => void;
  handleEditTile: (tileId: string, patch: Record<string, any>) => void;
  handleSelectCta: (ctaId: string) => void;
  handleEditCta: (ctaId: string, patch: Record<string, any>) => void;
  handleTileDoubleClick: (tileId: string, rect: DOMRect) => void;
  getClipboard: () => any[];
  onCommitNewPage?: (name: string) => void;
  onCancelNewPage?: () => void;
}

export function buildLinkedFrames({
  navStack, navContents, navUrls, allPages,
  pushSnapshot, isResizingRef,
  selectedTileId, setSelectedTileId, setSelectedCtaId, setPendingCta,
  setNavStack, navSourceTiles, navUpdater, handleCloseFromIndex,
  handleEditTile, handleSelectCta, handleEditCta, handleTileDoubleClick,
  getClipboard,
  onCommitNewPage, onCancelNewPage,
}: BuildLinkedFramesParams) {
  return navStack
    .filter((pageId) =>
      pageId === NEW_PAGE_SENTINEL || allPages.some((p: any) => p.PageId === pageId)
    )
    .map((pageId, index) => {
    const isNew = pageId === NEW_PAGE_SENTINEL;
    const page = allPages.find((p: any) => p.PageId === pageId);
    const update = navUpdater(pageId);

    return {
      pageId,
      isNew,
      page,
      webLinkUrl: navUrls[pageId],
      onCommitName: isNew ? onCommitNewPage : undefined,
      onCancelNew: isNew ? onCancelNewPage : undefined,
      infoContent: navContents[pageId] ?? [],
      onClose: () => handleCloseFromIndex(index),
      onAddColumn: (gridId: string, afterColId: string) => {
        pushSnapshot();
        update(prev => applyAddColumn(prev, gridId, afterColId));
      },
      onDeleteTile: (gridId: string, colId: string, tileId: string) => {
        if (selectedTileId === tileId) setSelectedTileId(null);
        const linkedPageId = Object.entries(navSourceTiles).find(([, src]) => src === tileId)?.[0];
        if (linkedPageId) {
          setNavStack((prev) => {
            const idx = prev.indexOf(linkedPageId);
            return idx === -1 ? prev : prev.slice(0, idx);
          });
        }
        pushSnapshot();
        update(prev => applyDeleteTile(prev, gridId, colId, tileId));
      },
      onEditTile: handleEditTile,
      onTileDoubleClick: handleTileDoubleClick,
      onDeselectTile: () => { setSelectedTileId(null); setSelectedCtaId(null); },
      onSelectCta: handleSelectCta,
      onEditCta: handleEditCta,
      onAddStandaloneTile: () => {
        if (!isResizingRef.current) pushSnapshot();
        const ts = Date.now();
        update(prev => applyAddStandaloneTile(prev, ts));
        setSelectedTileId(`tile-${ts}`);
        setSelectedCtaId(null);
        handleCloseFromIndex(index + 1);
      },
      onAddBlock: (blockType: string, insertBeforeInfoId: string | null) => {
        if (blockType.startsWith('Cta_')) {
          setPendingCta({ blockType, insertBeforeInfoId, frameId: pageId });
          return;
        }
        pushSnapshot();
        const ts = Date.now();
        if (blockType === 'TileGrid') {
          update(prev => applyAddBlock(prev, blockType, insertBeforeInfoId, ts));
          setSelectedTileId(`tile-${ts}`);
          setSelectedCtaId(null);
          handleCloseFromIndex(index + 1);
        } else {
          update(prev => applyAddBlock(prev, blockType, insertBeforeInfoId));
        }
      },
      onPasteBlocks: (insertBeforeInfoId: string | null) => {
        const items = getClipboard();
        if (items.length === 0) return;
        pushSnapshot();
        update(prev => applyPasteBlocks(prev, items, insertBeforeInfoId));
      },
      onAddTilesToColumn: (gridId: string, colId: string, count: number) => {
        if (!isResizingRef.current) pushSnapshot();
        update(prev => applyAddTilesToColumn(prev, gridId, colId, count));
        handleCloseFromIndex(index + 1);
      },
      onFreeResizeRelease: (
        gridId: string, longTileId: string, snapH: number,
        zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[],
      ) => {
        isResizingRef.current = false;
        update(prev => applyFreeResizeRelease(prev, gridId, longTileId, snapH, zoneCount, initialCount, oppColId, allOppTiles));
      },
      onTileDrop: (fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview) => {
        pushSnapshot();
        update(prev => applyTileDrop(prev, fromGridId, fromColId, tileId, preview));
      },
      onTileDropAsNewBlock: (fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update(prev => applyTileDropAsNewBlock(prev, fromGridId, fromColId, tileId, insertBeforeInfoId));
      },
      onAddDescription: (html: string, insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update(prev => applyAddDescription(prev, html, insertBeforeInfoId));
      },
      onEditDescription: (infoId: string, html: string) => {
        pushSnapshot();
        update(prev => applyEditDescription(prev, infoId, html));
      },
      onDeleteBlock: (infoId: string) => {
        const block = (navContents[pageId] ?? []).find((b: any) => b.InfoId === infoId);
        const linkedPageId = block?.CtaAttributes?.Action?.ObjectId as string | undefined;
        if (linkedPageId) {
          setNavStack((prev) => {
            const idx = prev.indexOf(linkedPageId);
            return idx === -1 ? prev : prev.slice(0, idx);
          });
        }
        pushSnapshot();
        update(prev => applyDeleteBlock(prev, infoId));
      },
      onMoveBlock: (infoId: string, insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update(prev => applyMoveBlock(prev, infoId, insertBeforeInfoId));
      },
      onAddImage: (images: { InfoImageId: string; InfoImageValue: string }[], insertBeforeInfoId: string | null) => {
        pushSnapshot();
        update(prev => applyAddImage(prev, images, insertBeforeInfoId));
      },
      onEditImage: (infoId: string, images: { InfoImageId: string; InfoImageValue: string }[]) => {
        pushSnapshot();
        update(prev => applyEditImageSelection(prev, infoId, images));
      },
    };
  });
}
