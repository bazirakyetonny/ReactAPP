import {
  applyAddColumn, applyDeleteTile, applyAddStandaloneTile, applyAddBlock,
  applyAddTilesToColumn, applyFreeResizeRelease, applyTileDrop, applyTileDropAsNewBlock,
  applyAddDescription, applyEditDescription, applyDeleteBlock, applyMoveBlock,
  applyAddImage, applyEditImageSelection,
} from './contentTransforms';
import type { TileDropPreview } from '../components/MainCanvas';

interface BuildLinkedFramesParams {
  navStack: string[];
  navContents: Record<string, any[]>;
  allPages: any[];
  pushSnapshot: () => void;
  isResizingRef: React.MutableRefObject<boolean>;
  selectedTileId: string | null;
  setSelectedTileId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedCtaId: React.Dispatch<React.SetStateAction<string | null>>;
  setPendingCta: React.Dispatch<React.SetStateAction<any>>;
  navUpdater: (pageId: string) => (transform: (blocks: any[]) => any[]) => void;
  handleCloseFromIndex: (stackIndex: number) => void;
  handleEditTile: (tileId: string, patch: Record<string, any>) => void;
  handleSelectCta: (ctaId: string) => void;
  handleEditCta: (ctaId: string, patch: Record<string, any>) => void;
  handleTileDoubleClick: (tileId: string, rect: DOMRect) => void;
}

export function buildLinkedFrames({
  navStack, navContents, allPages,
  pushSnapshot, isResizingRef,
  selectedTileId, setSelectedTileId, setSelectedCtaId, setPendingCta,
  navUpdater, handleCloseFromIndex,
  handleEditTile, handleSelectCta, handleEditCta, handleTileDoubleClick,
}: BuildLinkedFramesParams) {
  return navStack.map((pageId, index) => {
    const page = allPages.find((p: any) => p.PageId === pageId);
    const update = navUpdater(pageId);

    return {
      page,
      infoContent: navContents[pageId] ?? [],
      onClose: () => handleCloseFromIndex(index),
      onAddColumn: (gridId: string, afterColId: string) => {
        pushSnapshot();
        update(prev => applyAddColumn(prev, gridId, afterColId));
      },
      onDeleteTile: (gridId: string, colId: string, tileId: string) => {
        if (selectedTileId === tileId) setSelectedTileId(null);
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
        } else {
          update(prev => applyAddBlock(prev, blockType, insertBeforeInfoId));
        }
      },
      onAddTilesToColumn: (gridId: string, colId: string, count: number) => {
        if (!isResizingRef.current) pushSnapshot();
        update(prev => applyAddTilesToColumn(prev, gridId, colId, count));
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
