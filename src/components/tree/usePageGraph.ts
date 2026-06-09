import { useMemo } from 'react';

export interface GraphNode {
  id: string;
  name: string;
  content: any[];
  isOrphan: boolean;
  hasChildren: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  tileId: string;
}

export interface PageGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  homeId: string;
  /** Returns navStack-compatible path (pageIds excluding home) from home to pageId. */
  getPath: (pageId: string) => string[];
}

function getPageContent(page: any, infoContent: any[], navContents: Record<string, any[]>): any[] {
  if (page.PageName?.toLowerCase() === 'home') return infoContent;
  if (navContents[page.PageId] !== undefined) return navContents[page.PageId];
  try {
    return JSON.parse(page.PageStructure)?.InfoContent ?? [];
  } catch {
    return [];
  }
}

function extractEdges(pageId: string, content: any[], validPageIds: Set<string>): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const block of content) {
    if (block.InfoType === 'TileGrid') {
      for (const col of block.Columns ?? []) {
        for (const tile of col.Tiles ?? []) {
          const targetId = tile.Action?.ObjectId;
          if (targetId && validPageIds.has(targetId)) {
            edges.push({ source: pageId, target: targetId, tileId: tile.Id });
          }
        }
      }
    } else if (block.InfoType === 'Cta') {
      const ctaAction = block.CtaAttributes?.Action;
      const targetId = ctaAction?.ObjectId;
      if (targetId && validPageIds.has(targetId)) {
        edges.push({ source: pageId, target: targetId, tileId: block.InfoId });
      }
    }
  }
  return edges;
}

export function usePageGraph(
  allPages: any[],
  infoContent: any[],
  navContents: Record<string, any[]>,
): PageGraph {
  return useMemo(() => {
    const homePage = allPages.find((p) => p.PageName?.toLowerCase() === 'home');
    const homeId = homePage?.PageId ?? '';

    const nodes: GraphNode[] = allPages.map((page) => ({
      id: page.PageId,
      name: page.PageName ?? 'Unnamed',
      content: getPageContent(page, infoContent, navContents),
      isOrphan: false,
      hasChildren: false,
    }));

    const validPageIds = new Set(allPages.map((p: any) => p.PageId as string));
    const allEdges: GraphEdge[] = nodes.flatMap((n) => extractEdges(n.id, n.content, validPageIds));

    // BFS from home to find reachable pages
    const reachable = new Set<string>([homeId]);
    const queue = [homeId];
    const adj = new Map<string, string[]>();
    for (const e of allEdges) {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source)!.push(e.target);
    }
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adj.get(cur) ?? []) {
        if (!reachable.has(next)) { reachable.add(next); queue.push(next); }
      }
    }

    const sourcesWithChildren = new Set(allEdges.map(e => e.source));
    for (const node of nodes) {
      node.isOrphan = !reachable.has(node.id);
      node.hasChildren = sourcesWithChildren.has(node.id);
    }

    // Module pages (Map, MyActivity, Calendar, BulletinBoard) that are not linked
    // from any other page add noise to the tree — hide them.
    const MODULE_TYPES = new Set(['Map', 'MyActivity', 'Calendar', 'BulletinBoard']);
    const pageTypeById = new Map(allPages.map((p: any) => [p.PageId as string, p.PageType as string]));
    const hiddenIds = new Set(
      nodes
        .filter(n => n.isOrphan && MODULE_TYPES.has(pageTypeById.get(n.id) ?? ''))
        .map(n => n.id)
    );
    const visibleNodes = nodes.filter(n => !hiddenIds.has(n.id));
    const visibleEdges = allEdges.filter(e => !hiddenIds.has(e.source) && !hiddenIds.has(e.target));

    // BFS to find shortest path from home to a pageId (returns navStack slice, excluding home)
    function getPath(targetId: string): string[] {
      if (targetId === homeId) return [];
      const parent = new Map<string, string | null>([[homeId, null]]);
      const bfsQ = [homeId];
      while (bfsQ.length) {
        const cur = bfsQ.shift()!;
        if (cur === targetId) break;
        for (const next of adj.get(cur) ?? []) {
          if (!parent.has(next)) { parent.set(next, cur); bfsQ.push(next); }
        }
      }
      if (!parent.has(targetId)) return [targetId];
      const path: string[] = [];
      let cur: string | null = targetId;
      while (cur && cur !== homeId) { path.unshift(cur); cur = parent.get(cur) ?? null; }
      return path;
    }

    return { nodes: visibleNodes, edges: visibleEdges, homeId, getPath };
  }, [allPages, infoContent, navContents]);
}
