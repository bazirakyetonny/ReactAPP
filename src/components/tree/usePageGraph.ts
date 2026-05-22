import { useMemo } from 'react';

export interface GraphNode {
  id: string;
  name: string;
  content: any[];
  isOrphan: boolean;
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

function extractEdges(pageId: string, content: any[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const block of content) {
    for (const col of block.Columns ?? []) {
      for (const tile of col.Tiles ?? []) {
        if ((tile.Action?.ObjectType === 'Information' || tile.Action?.ObjectType === 'BulletinBoard') && tile.Action?.ObjectId) {
          edges.push({ source: pageId, target: tile.Action.ObjectId, tileId: tile.Id });
        }
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
    }));

    const allEdges: GraphEdge[] = nodes.flatMap((n) => extractEdges(n.id, n.content));

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

    for (const node of nodes) node.isOrphan = !reachable.has(node.id);

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

    return { nodes, edges: allEdges, homeId, getPath };
  }, [allPages, infoContent, navContents]);
}
