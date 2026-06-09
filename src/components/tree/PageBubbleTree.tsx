import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PageBubbleTree.css';
import { usePageGraph } from './usePageGraph';
import type { GraphNode, GraphEdge } from './usePageGraph';
import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../../types';
import { PhoneNodeContent, NODE_W, NODE_H, NODE_RX } from './PhoneNodeContent';
import { DeletePageModal } from '../phone/DeletePageButton';

const TOOLBAR_H = 44;

interface PageBubbleTreeProps {
  allPages: any[];
  infoContent: any[];
  navContents: Record<string, any[]>;
  navStack: string[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  themeCtaColors?: ThemeCtaColor[];
  appVersionId?: string;
  onClose: () => void;
  onNavigateToPath: (pageIds: string[]) => void;
  onDeletePage: (pageId: string) => void;
  onBeforeDeletePage?: () => void;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  fx: number | null;
  fy: number | null;
}

function borderPoint(fromX: number, fromY: number, nodeX: number, nodeY: number) {
  const cx = nodeX + NODE_W / 2, cy = nodeY + NODE_H / 2;
  const dx = fromX - cx, dy = fromY - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const t = Math.min((NODE_W / 2) / Math.abs(dx || 1e-9), (NODE_H / 2) / Math.abs(dy || 1e-9));
  return { x: cx + dx * t, y: cy + dy * t };
}

export function PageBubbleTree({
  allPages,
  infoContent,
  navContents,
  navStack,
  themeColors,
  themeIcons,
  themeCtaColors,
  appVersionId,
  onClose,
  onNavigateToPath,
  onDeletePage,
  onBeforeDeletePage,
}: PageBubbleTreeProps) {
  const { nodes, edges, homeId, getPath } = usePageGraph(allPages, infoContent, navContents);

  const initialFocus = navStack.length > 0 ? navStack[navStack.length - 1] : homeId;
  const [focusedPageId, setFocusedPageId] = useState(initialFocus);
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);
  const [deleteModalPageId, setDeleteModalPageId] = useState<string | null>(null);

  const simNodesRef = useRef<SimNode[]>([]);
  const [tick, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, GraphEdge> | null>(null);
  const svgSizeRef = useRef({ width: 0, height: 0 });

  const { visibleNodes, visibleEdges } = (() => {
    if (viewMode === 'all') {
      return { visibleNodes: nodes as SimNode[], visibleEdges: edges };
    }
    // Full BFS path from home to the focused page
    const pathIds = new Set([homeId, ...getPath(focusedPageId)]);
    // Direct children of the focused page
    const childIds = new Set(
      edges.filter(e => e.source === focusedPageId).map(e => e.target as string)
    );
    const visibleIds = new Set([...pathIds, ...childIds]);
    return {
      visibleNodes: (nodes as SimNode[]).filter(n => visibleIds.has(n.id)),
      visibleEdges: edges.filter(e => visibleIds.has(e.source as string) && visibleIds.has(e.target as string)),
    };
  })();

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    svgSizeRef.current = { width, height };

    const diagramCenterY = TOOLBAR_H + (height - TOOLBAR_H) / 2;
    const oldPositions = new Map(simNodesRef.current.map(n => [n.id, { x: n.x, y: n.y }]));
    const safeW = Math.max(width - NODE_W, 1);
    const safeH = Math.max(height - TOOLBAR_H - NODE_H, 1);
    const freshNodes: SimNode[] = visibleNodes.map(n => {
      const old = oldPositions.get(n.id);
      return {
        ...n,
        x: old?.x ?? (NODE_W / 2 + Math.random() * safeW),
        y: old?.y ?? (TOOLBAR_H + NODE_H / 2 + Math.random() * safeH),
        fx: null,
        fy: null,
      };
    });
    simNodesRef.current = freshNodes;

    if (simRef.current) simRef.current.stop();

    const linksCopy = visibleEdges.map(e => ({ source: e.source, target: e.target, tileId: e.tileId }));

    const sim = d3.forceSimulation<SimNode, any>(freshNodes)
      .force('link', d3.forceLink<SimNode, any>(linksCopy).id(d => d.id).distance(270).strength(0.4))
      .force('charge', d3.forceManyBody<SimNode>().strength(-1400))
      .force('center', d3.forceCenter(width / 2, diagramCenterY))
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(diagramCenterY).strength(0.04))
      .force('collision', d3.forceCollide<SimNode>().radius(NODE_W * 0.85))
      .on('tick', () => {
        for (const n of simNodesRef.current) {
          n.x = Math.max(0, Math.min(n.x, width - NODE_W));
          n.y = Math.max(TOOLBAR_H, Math.min(n.y, height - NODE_H));
        }
        setTick(t => t + 1);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodes.map(n => n.id).join(','), viewMode]);

  const attachDrag = useCallback((el: SVGGElement | null, nodeId: string) => {
    if (!el) return;
    const drag = d3.drag<SVGGElement, unknown>()
      .on('start', () => {
        const n = simNodesRef.current.find(n => n.id === nodeId);
        if (n && simRef.current) { n.fx = n.x; n.fy = n.y; simRef.current.alphaTarget(0.3).restart(); }
      })
      .on('drag', (event) => {
        const n = simNodesRef.current.find(n => n.id === nodeId);
        if (n) {
          const { width, height } = svgSizeRef.current;
          n.fx = Math.max(0, Math.min(event.x, width - NODE_W));
          n.fy = Math.max(TOOLBAR_H, Math.min(event.y, height - NODE_H));
        }
      })
      .on('end', () => {
        const n = simNodesRef.current.find(n => n.id === nodeId);
        if (n && simRef.current) { n.fx = null; n.fy = null; simRef.current.alphaTarget(0); }
      });
    d3.select(el).call(drag);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    window.addEventListener('click', dismiss);
    return () => window.removeEventListener('click', dismiss);
  }, [contextMenu]);

  const focusPath = getPath(focusedPageId);
  const breadcrumbIds = [homeId, ...focusPath];

  function handleNodeClick(nodeId: string) {
    setFocusedPageId(nodeId);
    setViewMode('focused');
  }

  function handleEdgeClick(edge: GraphEdge) {
    const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
    const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
    // Build path by following the drawn stroke: path-to-source + target.
    // This ensures we always navigate via the clicked edge, not BFS shortest path.
    const pathToSource = getPath(srcId);
    const fullPath = [...pathToSource, targetId];
    setFocusedPageId(targetId);
    onNavigateToPath(fullPath);
  }

  function handleNodeContextMenu(e: React.MouseEvent, node: SimNode) {
    if (!node.isOrphan) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId: node.id });
  }

  const posMap = new Map(simNodesRef.current.map(n => [n.id, { x: n.x, y: n.y }]));
  void tick;

  return (
    <div className="page-bubble-tree" onClick={() => setContextMenu(null)}>
      <svg ref={svgRef} className="tree-svg">
        {/* Links */}
        {visibleEdges.map((edge, i) => {
          const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
          const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
          const src = posMap.get(srcId);
          const tgt = posMap.get(tgtId);
          if (!src || !tgt) return null;
          const sc = { x: src.x + NODE_W / 2, y: src.y + NODE_H / 2 };
          const tc = { x: tgt.x + NODE_W / 2, y: tgt.y + NODE_H / 2 };
          const sPt = borderPoint(tc.x, tc.y, src.x, src.y);
          const tPt = borderPoint(sc.x, sc.y, tgt.x, tgt.y);
          const qx = (sc.x + tc.x) / 2, qy = (sc.y + tc.y) / 2;
          const midX = 0.25 * sPt.x + 0.5 * qx + 0.25 * tPt.x;
          const midY = 0.25 * sPt.y + 0.5 * qy + 0.25 * tPt.y;
          const angle = Math.atan2(tPt.y - sPt.y, tPt.x - sPt.x) * (180 / Math.PI);
          const d = `M${sPt.x},${sPt.y} Q${qx},${qy} ${tPt.x},${tPt.y}`;
          return (
            <g key={i}>
              <path fill="none" stroke="transparent" strokeWidth={14} d={d}
                onClick={(e) => { e.stopPropagation(); handleEdgeClick(edge); }}
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }} />
              <path className="tree-link" d={d} style={{ pointerEvents: 'none' }} />
              <polygon points="-4,-3 0,0 -4,3" fill="#64748b"
                transform={`translate(${midX},${midY}) rotate(${angle})`}
                style={{ pointerEvents: 'none' }} />
            </g>
          );
        })}

        {/* Nodes */}
        {visibleNodes.map(node => {
          const pos = posMap.get(node.id) ?? { x: 0, y: 0 };
          const isFocused = node.id === focusedPageId;
          const displayName = node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name;
          return (
            <g
              key={node.id}
              className={`tree-node${isFocused ? ' focused' : ''}${node.isOrphan ? ' orphan' : ''}`}
              transform={`translate(${pos.x},${pos.y})`}
              ref={(el) => attachDrag(el, node.id)}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
              onContextMenu={(e) => handleNodeContextMenu(e, node as SimNode)}
            >
              <text
                x={NODE_W / 2}
                y={-5}
                fontSize={12}
                fontWeight="600"
                fill="#1e3a5f"
                textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {displayName}
              </text>

              {/* Stacked shadow layers indicate this page has linked child pages */}
              {node.hasChildren && !isFocused && (
                <rect x={3} y={-2} width={NODE_W} height={NODE_H} rx={NODE_RX} className="tree-node-stack-shadow" />
              )}

              <rect width={NODE_W} height={NODE_H} rx={NODE_RX} className="tree-node-shell" />

              <clipPath id={`phone-${node.id}`}>
                <rect width={NODE_W} height={NODE_H} rx={NODE_RX} />
              </clipPath>
              <g clipPath={`url(#phone-${node.id})`}>
                <PhoneNodeContent content={node.content} themeColors={themeColors} themeIcons={themeIcons} themeCtaColors={themeCtaColors} />
              </g>
            </g>
          );
        })}

        {/* Toolbar rendered last so it always sits above diagram content */}
        <foreignObject x={0} y={0} width="100%" height={TOOLBAR_H}>
          <div className="tree-toolbar">
            <div className="tree-breadcrumbs">
              {breadcrumbIds.map((id, i) => {
                const name = nodes.find(n => n.id === id)?.name ?? id;
                return (
                  <span key={id} className="tree-breadcrumb-item">
                    {i > 0 && <span className="tree-breadcrumb-sep">›</span>}
                    <button type="button" className="tree-breadcrumb-btn" onClick={() => setFocusedPageId(id)}>
                      {name}
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="tree-toolbar-actions">
              <button type="button" className={`tree-toolbar-btn${viewMode === 'all' ? ' active' : ''}`} title="All Pages" onClick={() => setViewMode('all')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              </button>
              <button type="button" className={`tree-toolbar-btn${viewMode === 'focused' ? ' active' : ''}`} title="Selected Page" onClick={() => setViewMode('focused')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1"/>
                  <line x1="5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </button>
              <button type="button" className="tree-toolbar-btn tree-minimize-btn" title="Minimize" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3L7 7M7 7V4M7 7H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 13L9 9M9 9V12M9 9H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </foreignObject>
      </svg>

      {contextMenu && (
        <div
          className="tree-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="tree-context-item tree-context-danger"
            onClick={() => { setDeleteModalPageId(contextMenu.pageId); setContextMenu(null); }}
          >
            Delete page
          </button>
        </div>
      )}

      {deleteModalPageId && appVersionId && (
        <DeletePageModal
          appVersionId={appVersionId}
          pageId={deleteModalPageId}
          onClose={() => setDeleteModalPageId(null)}
          onBeforeDelete={onBeforeDeletePage}
          onDeleted={(pageId) => { setDeleteModalPageId(null); onDeletePage(pageId); }}
        />
      )}
    </div>
  );
}
