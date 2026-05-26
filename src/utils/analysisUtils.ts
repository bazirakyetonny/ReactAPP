import { checkLink } from './linkChecker';

export interface AnalysisIssue {
  id: string;
  category: 1 | 2;
  subcategory: 'invalid-url' | 'long-text';
  pageId: string;
  pageName: string;
  blockId: string;
  location: string;
  detail: string;
  value: string;
}

interface UrlCandidate {
  url: string;
  pageId: string;
  pageName: string;
  blockId: string;
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
            candidates.push({ url: tile.BGImageUrl.trim(), pageId, pageName, blockId: block.InfoId, location: `Tile '${label}' background` });
          const ot = tile.Action?.ObjectType;
          if ((ot === 'WebLink' || ot === 'DynamicForm') && tile.Action?.ObjectUrl?.trim())
            candidates.push({ url: tile.Action.ObjectUrl.trim(), pageId, pageName, blockId: block.InfoId, location: `Tile '${label}' link` });
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
      id: `url-${c.blockId}-${i}`,
      category: 1 as const,
      subcategory: 'invalid-url' as const,
      pageId: c.pageId,
      pageName: c.pageName,
      blockId: c.blockId,
      location: c.location,
      detail: `Unreachable URL: ${c.url}`,
      value: c.url,
    }));
}

const MAX_CHARS: Record<string, number> = {};

function maxCharsForTile(colCount: number, tileCount: number): number {
  if (colCount >= 3) return 12;
  if (colCount === 2) return 15;
  return tileCount === 1 ? 30 : 15;
}

// Suppress unused warning — exported for tests
export { MAX_CHARS };

export function checkTileText(
  blocks: any[],
  pageId: string,
  pageName: string,
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
            id: `text-${tile.Id}`,
            category: 2,
            subcategory: 'long-text',
            pageId,
            pageName,
            blockId: block.InfoId,
            location: `Tile '${preview}'`,
            detail: `Text (${text.length} chars) exceeds ${maxChars}-char limit for ${colCount}-column, ${tileCount}-tile column`,
            value: text,
          });
        }
      }
    }
  }
  return issues;
}
