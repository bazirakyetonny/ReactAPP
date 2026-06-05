import { checkLink } from './linkChecker';

export interface AnalysisIssue {
  id: string;
  category: 1 | 2;
  subcategory: 'invalid-url' | 'long-text';
  pageId: string;
  pageName: string;
  blockId: string;
  /** tile.Id when the issue is a specific tile within a TileGrid */
  subItemId?: string;
  location: string;
  detail: string;
  value: string;
  /** Language code when the issue is in a translated page; undefined = main language */
  language?: string;
}

/** Passed to the canvas to draw a red highlight on the current analysis issue */
export interface AnalysisHighlight {
  blockId: string;
  tileId?: string;
  message: string;
}

interface UrlCandidate {
  url: string;
  pageId: string;
  pageName: string;
  blockId: string;
  /** tile.Id when the URL belongs to a specific tile within a TileGrid */
  tileId?: string;
  location: string;
}

export function gatherUrlCandidates(
  blocks: any[],
  pageId: string,
  pageName: string,
): UrlCandidate[] {
  const candidates: UrlCandidate[] = [];
  for (const block of blocks) {
    if (block.InfoType === 'Images') {
      for (const img of block.Images ?? []) {
        const url = img.InfoImageValue?.trim();
        if (url) candidates.push({ url, pageId, pageName, blockId: block.InfoId, location: 'Image block' });
      }
    }
    if (block.InfoType === 'TileGrid') {
      for (const col of block.Columns ?? []) {
        for (const tile of col.Tiles ?? []) {
          const label = tile.Text || tile.Id;
          if (tile.BGImageUrl?.trim())
            candidates.push({ url: tile.BGImageUrl.trim(), pageId, pageName, blockId: block.InfoId, tileId: tile.Id, location: `Tile '${label}' background` });
          const ot = tile.Action?.ObjectType;
          if ((ot === 'WebLink' || ot === 'DynamicForm') && tile.Action?.ObjectUrl?.trim())
            candidates.push({ url: tile.Action.ObjectUrl.trim(), pageId, pageName, blockId: block.InfoId, tileId: tile.Id, location: `Tile '${label}' link` });
        }
      }
    }
    if (block.InfoType === 'Cta') {
      const attrs = block.CtaAttributes ?? {};
      const ctaLabel = attrs.CtaLabel || 'button';
      if (attrs.CtaButtonImgUrl?.trim())
        candidates.push({ url: attrs.CtaButtonImgUrl.trim(), pageId, pageName, blockId: block.InfoId, location: `CTA '${ctaLabel}' image` });
      if (attrs.CtaType === 'Weblink' && attrs.CtaAction?.trim())
        candidates.push({ url: attrs.CtaAction.trim(), pageId, pageName, blockId: block.InfoId, location: `CTA '${ctaLabel}' link` });
      if (attrs.CtaType === 'Form' && attrs.CtaObjectUrl?.trim())
        candidates.push({ url: attrs.CtaObjectUrl.trim(), pageId, pageName, blockId: block.InfoId, location: `CTA '${ctaLabel}' form URL` });
    }
  }
  return candidates;
}

export async function checkUrlCandidates(candidates: UrlCandidate[]): Promise<AnalysisIssue[]> {
  if (candidates.length === 0) return [];
  const results = await Promise.all(
    candidates.map(c =>
      checkLink({ url: c.url, type: /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(c.url) ? 'image' : 'weblink' })
    )
  );
  return candidates
    .filter((_, i) => !results[i])
    .map((c, i) => ({
      id: `url-${c.blockId}-${c.tileId ?? i}`,
      category: 1 as const,
      subcategory: 'invalid-url' as const,
      pageId: c.pageId,
      pageName: c.pageName,
      blockId: c.blockId,
      subItemId: c.tileId,
      location: c.location,
      detail: `Unreachable URL: ${c.url}`,
      value: c.url,
    }));
}

/** Returns a string that changes only when the actual URL values in content change.
 *  Used by useAnalysis to avoid rerunning HTTP checks on non-URL edits. */
export function extractUrlFingerprint(
  infoContent: any[],
  navContents: Record<string, any[]>,
): string {
  const parts: string[] = [];
  function scan(blocks: any[]) {
    for (const b of blocks) {
      if (b.InfoType === 'Images') {
        for (const img of b.Images ?? []) if (img.InfoImageValue) parts.push(img.InfoImageValue);
      } else if (b.InfoType === 'TileGrid') {
        for (const col of b.Columns ?? []) {
          for (const tile of col.Tiles ?? []) {
            if (tile.BGImageUrl) parts.push(tile.BGImageUrl);
            if (tile.Action?.ObjectUrl) parts.push(tile.Action.ObjectUrl);
          }
        }
      } else if (b.InfoType === 'Cta') {
        const a = b.CtaAttributes ?? {};
        if (a.CtaButtonImgUrl) parts.push(a.CtaButtonImgUrl);
        if (a.CtaAction) parts.push(a.CtaAction);
        if (a.CtaObjectUrl) parts.push(a.CtaObjectUrl);
      }
    }
  }
  scan(infoContent);
  for (const blocks of Object.values(navContents)) scan(blocks);
  return parts.join('|');
}

function maxCharsForTile(colCount: number, tileCount: number): number {
  if (colCount >= 3) return 12;
  if (colCount === 2) return 15;
  return tileCount === 1 ? 30 : 15;
}

function isRoundCta(block: any): boolean {
  return block.InfoType === 'Cta' && (block.CtaAttributes?.CtaButtonType ?? 'Image') === 'Round';
}

export function checkCtaText(
  blocks: any[],
  pageId: string,
  pageName: string,
  language?: string,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.InfoType !== 'Cta') { i++; continue; }

    const type: string = block.CtaAttributes?.CtaButtonType ?? 'Image';

    if (type === 'Round') {
      // Group consecutive Round CTAs into rows of up to 3 (mirrors DraggableScreen grouping)
      const row: any[] = [];
      while (i < blocks.length && isRoundCta(blocks[i]) && row.length < 3) {
        row.push(blocks[i++]);
      }
      const rowSize = row.length;
      const maxChars = rowSize >= 3 ? 8 : rowSize === 2 ? 15 : 30;
      for (const b of row) {
        const label: string = b.CtaAttributes?.CtaLabel ?? '';
        if (label.length > maxChars) {
          const preview = label.length > 20 ? `${label.slice(0, 20)}…` : label;
          issues.push({
            id: `cta-text-${b.InfoId}${language ? `-${language}` : ''}`,
            category: 2,
            subcategory: 'long-text',
            pageId,
            pageName,
            blockId: b.InfoId,
            location: `Round CTA '${preview}'`,
            detail: `Label (${label.length} chars) exceeds ${maxChars}-char limit for a ${rowSize}-button row`,
            value: label,
            language,
          });
        }
      }
    } else {
      const maxChars = type === 'FullWidth' ? 30 : 20; // Icon and Image → 20
      const label: string = block.CtaAttributes?.CtaLabel ?? '';
      if (label.length > maxChars) {
        const preview = label.length > 20 ? `${label.slice(0, 20)}…` : label;
        issues.push({
          id: `cta-text-${block.InfoId}${language ? `-${language}` : ''}`,
          category: 2,
          subcategory: 'long-text',
          pageId,
          pageName,
          blockId: block.InfoId,
          location: `${type} CTA '${preview}'`,
          detail: `Label (${label.length} chars) exceeds ${maxChars}-char limit for ${type} button`,
          value: label,
          language,
        });
      }
      i++;
    }
  }
  return issues;
}

export function checkTileText(
  blocks: any[],
  pageId: string,
  pageName: string,
  language?: string,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  for (const block of blocks) {
    if (block.InfoType !== 'TileGrid') continue;
    const cols: any[] = block.Columns ?? [];
    const colCount = cols.length;
    for (const col of cols) {
      const tiles: any[] = col.Tiles ?? [];
      const tileCount = tiles.length;
      const maxChars = maxCharsForTile(colCount, tileCount);
      for (const tile of tiles) {
        const text: string = tile.Text ?? '';
        if (text.length > maxChars) {
          const preview = text.length > 20 ? `${text.slice(0, 20)}…` : text;
          issues.push({
            id: `text-${tile.Id}${language ? `-${language}` : ''}`,
            category: 2,
            subcategory: 'long-text',
            pageId,
            pageName,
            blockId: block.InfoId,
            subItemId: tile.Id,
            location: `Tile '${preview}'`,
            detail: `Text (${text.length} chars) exceeds ${maxChars}-char limit for ${colCount}-column, ${tileCount}-tile column`,
            value: text,
            language,
          });
        }
      }
    }
  }
  return issues;
}
