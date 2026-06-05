import { TILE_H, TILE_GAP } from '../constants';
import type { TileDropPreview } from '../types';
import { dataStore } from '../data/datastore';

export function applyAddColumn(prev: any[], gridId: string, afterColId: string): any[] {
  const block = prev.find((b: any) => b.InfoId === gridId && b.InfoType === 'TileGrid');
  if (!block) return prev;
  const cols: any[] = block.Columns ?? [];
  if (cols.length >= 3) return prev;
  const afterIndex = cols.findIndex((c: any) => c.ColId === afterColId);
  const ts = Date.now();
  const newCol = {
    ColId: `col-${ts}`,
    Tiles: [{ Id: `tile-${ts}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true }],
  };
  const resetCols = cols.map((col: any) => ({
    ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
  }));
  const newCols = [...resetCols.slice(0, afterIndex + 1), newCol, ...resetCols.slice(afterIndex + 1)];
  return prev.map((b: any) => b.InfoId === gridId ? { ...b, Columns: newCols } : b);
}

export function applyDeleteTile(prev: any[], gridId: string, colId: string, tileId: string): any[] {
  return prev.flatMap((block: any) => {
    if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return [block];
    const totalTiles = (block.Columns ?? []).reduce((s: number, c: any) => s + (c.Tiles ?? []).length, 0);
    if (totalTiles <= 1) return [];
    const origColCount = (block.Columns ?? []).length;
    const newCols = (block.Columns ?? [])
      .map((col: any) => col.ColId !== colId ? col : { ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId) })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (newCols.length === 2) {
      const changedCol = newCols.find((c: any) => c.ColId === colId);
      const otherCol  = newCols.find((c: any) => c.ColId !== colId);
      if (changedCol && otherCol && (otherCol.Tiles ?? []).length === 1) {
        const n = (changedCol.Tiles ?? []).length;
        const longH = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{ ...block, Columns: newCols.map((col: any) =>
          col.ColId !== colId
            ? { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: longH })) }
            : { ...col, Tiles: col.Tiles.map((t: any) => ({ ...t, Height: TILE_H })) }
        ) }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
}

export function applyAddStandaloneTile(prev: any[], ts = Date.now()): any[] {
  return [...prev, {
    InfoId: `grid-${ts}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-${ts}`, Tiles: [{ Id: `tile-${ts}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true }] }],
  }];
}

export function applyAddBlock(prev: any[], blockType: string, insertBeforeInfoId: string | null, ts = Date.now(), extraAttrs?: Record<string, any>): any[] {
  let newBlock: any;
  if (blockType === 'TileGrid') {
    newBlock = {
      InfoId: `grid-${ts}`, InfoType: 'TileGrid',
      Columns: [{ ColId: `col-${ts}`, Tiles: [{ Id: `tile-${ts}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true }] }],
    };
  } else if (blockType.startsWith('Cta_')) {
    const ctaType = blockType.slice(4);
    const CTA_ICON_MAP: Record<string, string> = {
      Phone: 'Phone', Email: 'Email', Form: 'Form', Address: 'Globe', Weblink: 'Link',
    };
    const defaultIcon = CTA_ICON_MAP[ctaType] ?? '';
    const themes: any[] = dataStore.get('themes') ?? [];
    const currentThemeId: string = dataStore.get('CurrentThemeId') ?? '';
    const theme = themes.find((t: any) => t.ThemeId === currentThemeId) ?? themes[0];
    const firstCtaColor: string = (theme?.ThemeCtaColors?.[0]?.CtaColorName) ?? '';
    newBlock = {
      InfoId: `cta-${ts}`, InfoType: 'Cta', InfoValue: '',
      CtaAttributes: {
        CtaId: `cta-${ts}`,
        CtaType: ctaType,
        CtaLabel: '',
        CtaAction: '',
        CtaColor: '#ffffff',
        CtaBGColor: firstCtaColor,
        CtaButtonType: 'Image',
        CtaButtonImgUrl: '',
        CtaButtonIcon: defaultIcon,
        CtaSupplierIsConnected: false,
        CtaConnectedSupplierId: '',
        ...extraAttrs,
      },
    };
  } else {
    return prev;
  }
  if (insertBeforeInfoId === null) return [...prev, newBlock];
  const idx = prev.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  return idx === -1 ? [...prev, newBlock] : [...prev.slice(0, idx), newBlock, ...prev.slice(idx)];
}

export function applyEditCta(prev: any[], ctaId: string, patch: Record<string, any>): any[] {
  if (!prev.some((b: any) => b.InfoType === 'Cta' && b.InfoId === ctaId)) return prev;
  return prev.map((block: any) =>
    block.InfoType === 'Cta' && block.InfoId === ctaId
      ? { ...block, CtaAttributes: { ...block.CtaAttributes, ...patch } }
      : block
  );
}

export function applyEditTile(prev: any[], tileId: string, patch: Record<string, any>): any[] {
  const hasTile = prev.some((b: any) =>
    b.InfoType === 'TileGrid' &&
    (b.Columns ?? []).some((col: any) => (col.Tiles ?? []).some((t: any) => t.Id === tileId))
  );
  if (!hasTile) return prev;
  return prev.map((block: any) => {
    if (block.InfoType !== 'TileGrid') return block;
    return { ...block, Columns: (block.Columns ?? []).map((col: any) => ({
      ...col, Tiles: (col.Tiles ?? []).map((t: any) => t.Id === tileId ? { ...t, ...patch, _new: false } : t),
    })) };
  });
}

export function applyAddTilesToColumn(prev: any[], gridId: string, colId: string, count: number): any[] {
  const ts = Date.now();
  return prev.map((block: any) => {
    if (block.InfoId !== gridId || block.InfoType !== 'TileGrid') return block;
    return {
      ...block,
      Columns: (block.Columns ?? []).map((col: any) => {
        if (col.ColId !== colId) return col;
        const newTiles = Array.from({ length: count }, (_, i) => ({
          Id: `tile-${ts}-${i}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true,
        }));
        return { ...col, Tiles: [...(col.Tiles ?? []), ...newTiles] };
      }),
    };
  });
}

export function applyFreeResizeRelease(
  prev: any[], gridId: string, longTileId: string, snapH: number,
  zoneCount: number, initialCount: number, oppColId: string, allOppTiles: any[]
): any[] {
  const ts = Date.now();
  const idx = prev.findIndex((b: any) => b.InfoId === gridId);
  if (idx === -1) return prev;
  const block = prev[idx];
  const updateLongTile = (col: any) => ({
    ...col,
    Tiles: (col.Tiles ?? []).map((t: any) => t.Id === longTileId ? { ...t, Height: snapH } : t),
  });
  if (zoneCount > initialCount) {
    const extraCount = zoneCount - initialCount;
    const extraTiles = Array.from({ length: extraCount }, (_, i) => ({
      Id: `tile-extra-${ts}-${i}`, Text: 'Title', BGColor: '', Color: '#333333', Align: 'center', Height: TILE_H, _new: true,
    }));
    const newCols = (block.Columns ?? []).map((col: any) =>
      col.ColId === oppColId
        ? { ...col, Tiles: [...(col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })), ...extraTiles] }
        : updateLongTile(col)
    );
    return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
  }
  if (zoneCount === initialCount) {
    const newCols = (block.Columns ?? []).map((col: any) => updateLongTile(col));
    return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...prev.slice(idx + 1)];
  }
  const tilesToKeep = allOppTiles.slice(0, zoneCount).map((t: any) => ({ ...t, Height: TILE_H }));
  const tilesToRelease = allOppTiles.slice(zoneCount);
  const newCols = (block.Columns ?? [])
    .map((col: any) =>
      col.ColId === oppColId
        ? (tilesToKeep.length > 0 ? { ...col, Tiles: tilesToKeep } : null)
        : updateLongTile(col)
    )
    .filter(Boolean);
  const standaloneGrids = tilesToRelease.map((tile: any, i: number) => ({
    InfoId: `grid-rel-${ts}-${i}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-rel-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
  }));
  return [...prev.slice(0, idx), { ...block, Columns: newCols }, ...standaloneGrids, ...prev.slice(idx + 1)];
}

export function applyTileDrop(
  prev: any[], fromGridId: string, fromColId: string, tileId: string, preview: TileDropPreview
): any[] {
  if (preview.isColumnSwap) {
    return prev.map((block: any) => {
      if (block.InfoId !== fromGridId) return block;
      const cols = [...(block.Columns ?? [])];
      const i1 = cols.findIndex((c: any) => c.ColId === fromColId);
      const i2 = cols.findIndex((c: any) => c.ColId === preview.targetColId);
      if (i1 === -1 || i2 === -1) return block;
      [cols[i1], cols[i2]] = [cols[i2], cols[i1]];
      return { ...block, Columns: cols };
    });
  }
  if (fromGridId === preview.targetGridId && fromColId === preview.targetColId && !preview.newColumn) {
    return prev.map((block: any) => {
      if (block.InfoId !== fromGridId) return block;
      return {
        ...block,
        Columns: (block.Columns ?? []).map((col: any) => {
          if (col.ColId !== fromColId) return col;
          const tiles = [...(col.Tiles ?? [])];
          const fromIdx = tiles.findIndex((t: any) => t.Id === tileId);
          if (fromIdx === -1) return col;
          const [moved] = tiles.splice(fromIdx, 1);
          const targetIdx = preview.insertIndex > fromIdx ? preview.insertIndex - 1 : preview.insertIndex;
          tiles.splice(targetIdx, 0, moved);
          return { ...col, Tiles: tiles };
        }),
      };
    });
  }
  let movedTile: any = null;
  const afterRemove = prev.flatMap((block: any) => {
    if (block.InfoId !== fromGridId) return [block];
    const cols: any[] = block.Columns ?? [];
    const origColCount = cols.length;
    const srcCol = cols.find((c: any) => c.ColId === fromColId);
    if (!srcCol) return [block];
    movedTile = (srcCol.Tiles ?? []).find((t: any) => t.Id === tileId);
    const newCols = cols
      .map((col: any) => col.ColId !== fromColId ? col : {
        ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
      })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (newCols.length === 0) return [];
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (origColCount === 2 && newCols.length === 2) {
      const srcColAfter = newCols.find((c: any) => c.ColId === fromColId);
      const oppColAfter = newCols.find((c: any) => c.ColId !== fromColId);
      if (srcColAfter && oppColAfter && (oppColAfter.Tiles ?? []).length === 1) {
        const n = (srcColAfter.Tiles ?? []).length;
        const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{
          ...block,
          Columns: newCols.map((col: any) =>
            col.ColId !== fromColId
              ? { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) }
              : col
          ),
        }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
  if (!movedTile) return prev;
  const droppedTile = { ...movedTile, Height: TILE_H };
  const ts2 = Date.now() + 1;
  const targetIdx = afterRemove.findIndex((b: any) => b.InfoId === preview.targetGridId);
  if (targetIdx === -1) return afterRemove;
  const targetBlock = afterRemove[targetIdx];
  if (preview.newColumn) {
    const newCol = { ColId: `col-${ts2}`, Tiles: [droppedTile] };
    const cols = (targetBlock.Columns ?? []).map((col: any) => ({
      ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
    }));
    const afterIdx = preview.insertColAfterColId
      ? cols.findIndex((c: any) => c.ColId === preview.insertColAfterColId)
      : -1;
    cols.splice(afterIdx + 1, 0, newCol);
    return [...afterRemove.slice(0, targetIdx), { ...targetBlock, Columns: cols }, ...afterRemove.slice(targetIdx + 1)];
  }
  const targetCols = targetBlock.Columns ?? [];
  const targetColNow = targetCols.find((c: any) => c.ColId === preview.targetColId);
  const newTileCount = (targetColNow?.Tiles ?? []).length + 1;
  const oppCol = targetCols.length === 2 ? targetCols.find((c: any) => c.ColId !== preview.targetColId) : null;
  const oppIsLong = (oppCol?.Tiles ?? []).length === 1;
  const longHeight = oppIsLong ? newTileCount * TILE_H + Math.max(0, newTileCount - 1) * TILE_GAP : null;
  const newBlock = {
    ...targetBlock,
    Columns: targetCols.map((col: any) => {
      if (col.ColId === preview.targetColId) {
        const tiles = [...(col.Tiles ?? [])];
        tiles.splice(preview.insertIndex, 0, droppedTile);
        return { ...col, Tiles: tiles };
      }
      if (longHeight !== null) return { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) };
      return col;
    }),
  };
  return [...afterRemove.slice(0, targetIdx), newBlock, ...afterRemove.slice(targetIdx + 1)];
}

export function applyTileDropAsNewBlock(
  prev: any[], fromGridId: string, fromColId: string, tileId: string, insertBeforeInfoId: string | null
): any[] {
  const sourceBlock = prev.find((b: any) => b.InfoId === fromGridId);
  if (!sourceBlock) return prev;
  const totalTiles = (sourceBlock.Columns ?? []).reduce(
    (sum: number, col: any) => sum + (col.Tiles ?? []).length, 0
  );
  if (totalTiles === 1) {
    const withoutSource = prev.filter((b: any) => b.InfoId !== fromGridId);
    if (insertBeforeInfoId === null) return [...withoutSource, sourceBlock];
    const insertIdx = withoutSource.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
    if (insertIdx === -1) return [...withoutSource, sourceBlock];
    return [...withoutSource.slice(0, insertIdx), sourceBlock, ...withoutSource.slice(insertIdx)];
  }
  let movedTile: any = null;
  const afterRemove = prev.flatMap((block: any) => {
    if (block.InfoId !== fromGridId) return [block];
    const cols: any[] = block.Columns ?? [];
    const origColCount = cols.length;
    const srcCol = cols.find((c: any) => c.ColId === fromColId);
    if (!srcCol) return [block];
    movedTile = (srcCol.Tiles ?? []).find((t: any) => t.Id === tileId);
    const newCols = cols
      .map((col: any) => col.ColId !== fromColId ? col : {
        ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
      })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (newCols.length === 0) return [];
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (origColCount === 2 && newCols.length === 2) {
      const srcColAfter = newCols.find((c: any) => c.ColId === fromColId);
      const oppColAfter = newCols.find((c: any) => c.ColId !== fromColId);
      if (srcColAfter && oppColAfter && (oppColAfter.Tiles ?? []).length === 1) {
        const n = (srcColAfter.Tiles ?? []).length;
        const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{
          ...block,
          Columns: newCols.map((col: any) =>
            col.ColId !== fromColId
              ? { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) }
              : col
          ),
        }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
  if (!movedTile) return prev;
  const ts2 = Date.now() + 1;
  const newGrid = {
    InfoId: `grid-new-${ts2}`, InfoType: 'TileGrid',
    Columns: [{ ColId: `col-new-${ts2}`, Tiles: [{ ...movedTile, Height: TILE_H }] }],
  };
  if (insertBeforeInfoId === null) return [...afterRemove, newGrid];
  const insertIdx = afterRemove.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  if (insertIdx === -1) return [...afterRemove, newGrid];
  return [...afterRemove.slice(0, insertIdx), newGrid, ...afterRemove.slice(insertIdx)];
}

export function extractTileFromContent(
  content: any[], fromGridId: string, fromColId: string, tileId: string,
): { content: any[]; tile: any | null } {
  let extracted: any = null;
  const afterRemove = content.flatMap((block: any) => {
    if (block.InfoId !== fromGridId) return [block];
    const cols: any[] = block.Columns ?? [];
    const origColCount = cols.length;
    const srcCol = cols.find((c: any) => c.ColId === fromColId);
    if (!srcCol) return [block];
    extracted = (srcCol.Tiles ?? []).find((t: any) => t.Id === tileId);
    if (!extracted) return [block];
    const newCols = cols
      .map((col: any) => col.ColId !== fromColId ? col : {
        ...col, Tiles: (col.Tiles ?? []).filter((t: any) => t.Id !== tileId),
      })
      .filter((col: any) => (col.Tiles ?? []).length > 0);
    if (newCols.length === 0) return [];
    if (origColCount === 2 && newCols.length === 1 && (newCols[0].Tiles ?? []).length > 1) {
      const ts = Date.now();
      return (newCols[0].Tiles as any[]).map((tile: any, i: number) => ({
        InfoId: `grid-${ts}-${i}`, InfoType: 'TileGrid',
        Columns: [{ ColId: `col-${ts}-${i}`, Tiles: [{ ...tile, Height: TILE_H }] }],
      }));
    }
    if (origColCount === 2 && newCols.length === 2) {
      const srcColAfter = newCols.find((c: any) => c.ColId === fromColId);
      const oppColAfter = newCols.find((c: any) => c.ColId !== fromColId);
      if (srcColAfter && oppColAfter && (oppColAfter.Tiles ?? []).length === 1) {
        const n = (srcColAfter.Tiles ?? []).length;
        const longHeight = n * TILE_H + Math.max(0, n - 1) * TILE_GAP;
        return [{
          ...block,
          Columns: newCols.map((col: any) =>
            col.ColId !== fromColId
              ? { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) }
              : col
          ),
        }];
      }
    }
    return [{ ...block, Columns: newCols }];
  });
  return { content: afterRemove, tile: extracted };
}

export function insertTileAtPreview(content: any[], tile: any, preview: TileDropPreview): any[] {
  const droppedTile = { ...tile, Height: TILE_H };
  const ts = Date.now() + 1;
  const targetIdx = content.findIndex((b: any) => b.InfoId === preview.targetGridId);
  if (targetIdx === -1) return content;
  const targetBlock = content[targetIdx];
  if (preview.newColumn) {
    const newCol = { ColId: `col-${ts}`, Tiles: [droppedTile] };
    const cols = (targetBlock.Columns ?? []).map((col: any) => ({
      ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: TILE_H })),
    }));
    const afterIdx = preview.insertColAfterColId
      ? cols.findIndex((c: any) => c.ColId === preview.insertColAfterColId) : -1;
    cols.splice(afterIdx + 1, 0, newCol);
    return [...content.slice(0, targetIdx), { ...targetBlock, Columns: cols }, ...content.slice(targetIdx + 1)];
  }
  const targetCols = targetBlock.Columns ?? [];
  const targetColNow = targetCols.find((c: any) => c.ColId === preview.targetColId);
  const newTileCount = (targetColNow?.Tiles ?? []).length + 1;
  const oppCol = targetCols.length === 2 ? targetCols.find((c: any) => c.ColId !== preview.targetColId) : null;
  const oppIsLong = (oppCol?.Tiles ?? []).length === 1;
  const longHeight = oppIsLong ? newTileCount * TILE_H + Math.max(0, newTileCount - 1) * TILE_GAP : null;
  const newBlock = {
    ...targetBlock,
    Columns: targetCols.map((col: any) => {
      if (col.ColId === preview.targetColId) {
        const tiles = [...(col.Tiles ?? [])];
        tiles.splice(preview.insertIndex, 0, droppedTile);
        return { ...col, Tiles: tiles };
      }
      if (longHeight !== null) return { ...col, Tiles: (col.Tiles ?? []).map((t: any) => ({ ...t, Height: longHeight })) };
      return col;
    }),
  };
  return [...content.slice(0, targetIdx), newBlock, ...content.slice(targetIdx + 1)];
}

export function parseInfoContent(): any[] {
  const cv = dataStore.get('Current_Version');
  const homePage = (cv?.Page ?? []).find((p: any) => p.PageName?.toLowerCase() === 'home');
  if (!homePage?.PageStructure) return [];
  try {
    return JSON.parse(homePage.PageStructure).InfoContent ?? [];
  } catch {
    return [];
  }
}

export function applyAddDescription(prev: any[], html: string, insertBeforeInfoId: string | null, ts = Date.now()): any[] {
  const newBlock = { InfoId: `desc-${ts}`, InfoType: 'Description', InfoValue: html };
  if (insertBeforeInfoId === null) return [...prev, newBlock];
  const idx = prev.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  return idx === -1 ? [...prev, newBlock] : [...prev.slice(0, idx), newBlock, ...prev.slice(idx)];
}

export function applyEditDescription(prev: any[], infoId: string, html: string): any[] {
  return prev.map((b: any) =>
    b.InfoId === infoId && b.InfoType === 'Description' ? { ...b, InfoValue: html } : b
  );
}

export function applyDeleteBlock(prev: any[], infoId: string): any[] {
  return prev.filter((b: any) => b.InfoId !== infoId);
}

export function regenerateContentIds(content: any[]): any[] {
  let seq = 0;
  const next = (prefix: string) => `${prefix}-${Date.now() + seq++}`;

  return content.map((block) => {
    if (block.InfoType === 'TileGrid') {
      return {
        ...block,
        InfoId: next('grid'),
        Columns: (block.Columns ?? []).map((col: any) => ({
          ...col,
          ColId: next('col'),
          Tiles: (col.Tiles ?? []).map((tile: any) => ({
            ...tile,
            Id: next('tile'),
          })),
        })),
      };
    }
    if (block.InfoType === 'Cta') {
      const newId = next('cta');
      return {
        ...block,
        InfoId: newId,
        CtaAttributes: block.CtaAttributes
          ? { ...block.CtaAttributes, CtaId: newId }
          : block.CtaAttributes,
      };
    }
    if (block.InfoType === 'Image') {
      return { ...block, InfoId: next('img') };
    }
    return { ...block, InfoId: next('desc') };
  });
}

export function applyMoveBlock(prev: any[], infoId: string, insertBeforeInfoId: string | null): any[] {
  const block = prev.find((b: any) => b.InfoId === infoId);
  if (!block) return prev;
  const without = prev.filter((b: any) => b.InfoId !== infoId);
  if (insertBeforeInfoId === null) return [...without, block];
  const idx = without.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  return idx === -1 ? [...without, block] : [...without.slice(0, idx), block, ...without.slice(idx)];
}

export function applyExtractBlock(prev: any[], infoId: string): { content: any[]; block: any | null } {
  const block = prev.find((b: any) => b.InfoId === infoId) ?? null;
  return { content: prev.filter((b: any) => b.InfoId !== infoId), block };
}

export function applyInsertBlock(prev: any[], block: any, insertBeforeInfoId: string | null): any[] {
  if (insertBeforeInfoId === null) return [...prev, block];
  const idx = prev.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  return idx === -1 ? [...prev, block] : [...prev.slice(0, idx), block, ...prev.slice(idx)];
}

export function applyAddImage(
  prev: any[],
  images: { InfoImageId: string; InfoImageValue: string }[],
  insertBeforeInfoId: string | null,
  ts = Date.now()
): any[] {
  const newBlock = { InfoId: `img-${ts}`, InfoType: 'Images', InfoValue: '', Images: images };
  if (insertBeforeInfoId === null) return [...prev, newBlock];
  const idx = prev.findIndex((b: any) => b.InfoId === insertBeforeInfoId);
  return idx === -1 ? [...prev, newBlock] : [...prev.slice(0, idx), newBlock, ...prev.slice(idx)];
}

export function applyEditImageSelection(
  prev: any[],
  infoId: string,
  images: { InfoImageId: string; InfoImageValue: string }[]
): any[] {
  return prev.map((b: any) =>
    b.InfoId === infoId && b.InfoType === 'Images' ? { ...b, Images: images } : b
  );
}

export function applyPasteBlocks(
  prev: any[],
  blocks: any[],
  insertBeforeInfoId: string | null,
  ts = Date.now()
): any[] {
  const freshBlocks = blocks.map((block: any, i: number) => {
    if (block.InfoType === 'TileGrid') {
      return {
        ...block,
        InfoId: `grid-p${ts}${i}`,
        Columns: (block.Columns ?? []).map((col: any, ci: number) => ({
          ...col,
          ColId: `col-p${ts}${i}${ci}`,
          Tiles: (col.Tiles ?? []).map((tile: any, ti: number) => ({
            ...tile,
            Id: `tile-p${ts}${i}${ci}${ti}`,
          })),
        })),
      };
    }
    if (block.InfoType === 'Images') return { ...block, InfoId: `img-p${ts}${i}` };
    if (block.InfoType === 'Description') return { ...block, InfoId: `desc-p${ts}${i}` };
    return { ...block, InfoId: `cta-p${ts}${i}` };
  });
  let content = prev;
  for (const blk of freshBlocks) {
    content = applyInsertBlock(content, blk, insertBeforeInfoId);
  }
  return content;
}

export function applyCopyTile(prev: any[], tileId: string, ts = Date.now()): any[] {
  return prev.map((block: any) => {
    if (block.InfoType !== 'TileGrid') return block;
    let changed = false;
    const newCols = (block.Columns ?? []).map((col: any) => {
      const tiles: any[] = col.Tiles ?? [];
      const idx = tiles.findIndex((t: any) => t.Id === tileId);
      if (idx === -1) return col;
      changed = true;
      const copy = { ...tiles[idx], Id: `tile-${ts}`, Action: undefined };
      return { ...col, Tiles: [...tiles.slice(0, idx + 1), copy, ...tiles.slice(idx + 1)] };
    });
    return changed ? { ...block, Columns: newCols } : block;
  });
}

export function applyMoodColorRemapToPages(
  pages: any[],
  originalColorNames: string[],
  selectedColorNames: string[],
): any[] {
  const colorMap: Record<string, string> = {};
  for (let i = 0; i < originalColorNames.length; i++) {
    if (originalColorNames[i] && selectedColorNames[i]) {
      colorMap[originalColorNames[i]] = selectedColorNames[i];
    }
  }
  if (Object.keys(colorMap).length === 0) return pages;

  return pages.map((page: any) => {
    if (!page?.PageStructure) return page;
    let parsed: any;
    try { parsed = JSON.parse(page.PageStructure); } catch { return page; }

    const infoContent: any[] = parsed?.InfoContent ?? [];
    const remapped = infoContent.map((block: any) => {
      if (block.InfoType !== 'TileGrid') return block;
      return {
        ...block,
        Columns: (block.Columns ?? []).map((col: any) => ({
          ...col,
          Tiles: (col.Tiles ?? []).map((tile: any) => {
            const mapped = colorMap[tile.BGColor];
            return mapped !== undefined ? { ...tile, BGColor: mapped } : tile;
          }),
        })),
      };
    });

    return { ...page, PageStructure: JSON.stringify({ ...parsed, InfoContent: remapped }) };
  });
}
