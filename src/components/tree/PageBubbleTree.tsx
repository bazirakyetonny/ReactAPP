import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PageBubbleTree.css';
import { usePageGraph } from './usePageGraph';
import type { GraphNode, GraphEdge } from './usePageGraph';
import type { ThemeColors, ThemeIcon } from '../../types';
import { resolveColor } from '../../utils/tileUtils';

// ── Node dimensions ───────────────────────────────────────────────────────────
const NODE_W = 90;
const NODE_H = 140;
const NODE_RX = 12;

// ── Phone chrome layout constants ─────────────────────────────────────────────
const STATUS_H = 11;
const CONTENT_Y = STATUS_H + 1; // 12 — tiles start right after status bar
const PAD_X = 4;
const COL_GAP = 2;
const TILE_GAP = 2;
const TILE_H = 18;
const MAX_BLOCKS = 6;

// ── Props ─────────────────────────────────────────────────────────────────────
interface PageBubbleTreeProps {
  allPages: any[];
  infoContent: any[];
  navContents: Record<string, any[]>;
  navStack: string[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  onClose: () => void;
  onNavigateToPath: (pageIds: string[]) => void;
  onDeletePage: (pageId: string) => void;
}

// ── D3 simulation node (must be mutable for D3 to write x/y) ─────────────────
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

// ── Tile content inside the mini phone ───────────────────────────────────────
function PhoneNodeContent({
  content,
  themeColors,
}: {
  content: any[];
  themeColors?: ThemeColors;
}) {
  const contentW = NODE_W - PAD_X * 2;
  const elements: React.ReactElement[] = [];
  let curY = CONTENT_Y + 2;
  let key = 0;

  for (const block of content.slice(0, MAX_BLOCKS)) {
    if (curY > NODE_H - 4) break;

    if (block.InfoType === 'TileGrid') {
      const cols: any[] = block.Columns ?? [];
      const nCols = Math.min(cols.length, 3);
      if (nCols === 0) continue;
      const colW = (contentW - COL_GAP * (nCols - 1)) / nCols;
      let maxTy = curY;

      cols.slice(0, 3).forEach((col: any, ci: number) => {
        const cx = PAD_X + ci * (colW + COL_GAP);
        let ty = curY;
        for (const tile of (col.Tiles ?? []).slice(0, 6)) {
          if (ty >= NODE_H - 4) break;
          const rawH = Number(tile.Height) || 80;
          const scaledH = Math.max(Math.round((rawH / 80) * TILE_H), TILE_H);
          const clampedH = Math.min(scaledH, NODE_H - ty - 4);
          const bg = resolveColor(tile.BGColor ?? tile.Color ?? '', themeColors);
          const noColor = bg === 'transparent';

          elements.push(
            noColor
              ? <rect key={key++} x={cx + 0.5} y={ty + 0.5} width={colW - 1} height={clampedH - 1} rx={2} fill="none" stroke="#94a3b8" strokeWidth={0.75} strokeDasharray="2 1.5" />
              : <rect key={key++} x={cx} y={ty} width={colW} height={clampedH} rx={2} fill={bg} />
          );

          if (tile.Name && clampedH >= 8) {
            const label = (tile.Name as string).length > 7 ? (tile.Name as string).slice(0, 6) + '…' : tile.Name;
            elements.push(
              <text
                key={key++}
                x={cx + colW / 2}
                y={ty + clampedH / 2 + 2}
                fontSize={4}
                fill={noColor ? '#64748b' : '#ffffff'}
                textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            );
          }

          ty += clampedH + TILE_GAP;
        }
        maxTy = Math.max(maxTy, ty);
      });
      curY = maxTy + 2;

    } else if (block.InfoType === 'Description') {
      const barH = 8;
      elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={barH} rx={2} fill="#e5e7eb" />);
      elements.push(<rect key={key++} x={PAD_X + 2} y={curY + 2} width={contentW * 0.7} height={1.5} rx={0.5} fill="#9ca3af" />);
      elements.push(<rect key={key++} x={PAD_X + 2} y={curY + 5} width={contentW * 0.5} height={1.5} rx={0.5} fill="#9ca3af" />);
      curY += barH + 3;

    } else if (block.InfoType === 'Images') {
      const imgH = 22;
      const clampedImgH = Math.min(imgH, NODE_H - curY - 4);
      elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedImgH} rx={2} fill="#bfdbfe" />);
      const cx = PAD_X + contentW / 2, cy = curY + clampedImgH / 2;
      elements.push(<circle key={key++} cx={cx} cy={cy} r={4} fill="none" stroke="#3b82f6" strokeWidth={1} />);
      elements.push(<circle key={key++} cx={cx} cy={cy} r={1.5} fill="#3b82f6" />);
      curY += clampedImgH + 3;
    }
  }

  return <>{elements}</>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function PageBubbleTree({
  allPages,
  infoContent,
  navContents,
  navStack,
  themeColors,
  themeIcons: _themeIcons,
  onClose,
  onNavigateToPath,
  onDeletePage,
}: PageBubbleTreeProps) {
  const { nodes, edges, homeId, getPath } = usePageGraph(allPages, infoContent, navContents);

  const initialFocus = navStack.length > 0 ? navStack[navStack.length - 1] : homeId;
  const [focusedPageId, setFocusedPageId] = useState(initialFocus);
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);

  const simNodesRef = useRef<SimNode[]>([]);
  const [tick, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, GraphEdge> | null>(null);

  const { visibleNodes, visibleEdges } = (() => {
    if (viewMode === 'all') {
      return { visibleNodes: nodes as SimNode[], visibleEdges: edges };
    }
    const childIds = new Set(edges.filter(e => e.source === focusedPageId).map(e => e.target));
    const ancestorIds = new Set<string>([homeId]);
    for (const id of navStack) {
      ancestorIds.add(id);
      if (id === focusedPageId) break;
    }
    if (!ancestorIds.has(focusedPageId)) ancestorIds.add(focusedPageId);
    const visibleIds = new Set([...ancestorIds, ...childIds]);
    return {
      visibleNodes: (nodes as SimNode[]).filter(n => visibleIds.has(n.id)),
      visibleEdges: edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target)),
    };
  })();

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();

    const oldPositions = new Map(simNodesRef.current.map(n => [n.id, { x: n.x, y: n.y }]));
    const freshNodes: SimNode[] = visibleNodes.map(n => {
      const old = oldPositions.get(n.id);
      return { ...n, x: old?.x ?? width / 2, y: old?.y ?? height / 2, fx: null, fy: null };
    });
    simNodesRef.current = freshNodes;

    if (simRef.current) simRef.current.stop();

    const linksCopy = visibleEdges.map(e => ({ source: e.source, target: e.target, tileId: e.tileId }));

    const sim = d3.forceSimulation<SimNode, any>(freshNodes)
      .force('link', d3.forceLink<SimNode, any>(linksCopy).id(d => d.id).distance(220).strength(0.4))
      .force('charge', d3.forceManyBody<SimNode>().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius(NODE_W * 0.65))
      .on('tick', () => setTick(t => t + 1));

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
        if (n) { n.fx = event.x; n.fy = event.y; }
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
    const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
    const targetPath = getPath(targetId);
    onNavigateToPath(targetPath.length > 0 ? targetPath : [targetId]);
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
      {/* ── Toolbar ── */}
      <div className="tree-toolbar">
        <div className="tree-breadcrumbs">
          {breadcrumbIds.map((id, i) => {
            const name = nodes.find(n => n.id === id)?.name ?? id;
            return (
              <span key={id} className="tree-breadcrumb-item">
                {i > 0 && <span className="tree-breadcrumb-sep">›</span>}
                <button className="tree-breadcrumb-btn" onClick={() => setFocusedPageId(id)}>
                  {name}
                </button>
              </span>
            );
          })}
        </div>
        <div className="tree-toolbar-actions">
          <button className={`tree-toolbar-btn${viewMode === 'all' ? ' active' : ''}`} title="All Pages" onClick={() => setViewMode('all')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button className={`tree-toolbar-btn${viewMode === 'focused' ? ' active' : ''}`} title="Selected Page" onClick={() => setViewMode('focused')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1"/>
              <line x1="5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
          <button className="tree-toolbar-btn tree-minimize-btn" title="Minimize" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3L7 7M7 7V4M7 7H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 13L9 9M9 9V12M9 9H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── SVG canvas ── */}
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
          // Bezier midpoint (t=0.5) and tangent direction
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
              {/* ── Page name above the frame ── */}
              <text
                x={NODE_W / 2}
                y={-6}
                fontSize={7}
                fontWeight="600"
                fill="#1e3a5f"
                textAnchor="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {displayName}
              </text>

              {/* ── Phone shell border + shadow (drawn first as background) ── */}
              <rect width={NODE_W} height={NODE_H} rx={NODE_RX} className="tree-node-shell" />

              {/* ── Everything inside is clipped to the rounded phone shape ── */}
              <clipPath id={`phone-${node.id}`}>
                <rect width={NODE_W} height={NODE_H} rx={NODE_RX} />
              </clipPath>
              <g clipPath={`url(#phone-${node.id})`}>
                {/* Content area background (below status bar) */}
                <rect y={CONTENT_Y} width={NODE_W} height={NODE_H - CONTENT_Y} fill="#f9fafb" />

                {/* Status bar — transparent, dark text on white phone shell */}
                <text x={5} y={8} fontSize={4.5} fill="rgba(0,0,0,0.5)" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>9:36</text>
                <circle cx={NODE_W - 5} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />
                <circle cx={NODE_W - 10} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />
                <circle cx={NODE_W - 15} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />

                {/* Separator under status bar */}
                <rect y={STATUS_H} width={NODE_W} height={0.5} fill="#e2e8f0" />

                {/* Tile content */}
                <PhoneNodeContent content={node.content} themeColors={themeColors} />
              </g>
            </g>
          );
        })}
      </svg>

      {/* ── Context menu ── */}
      {contextMenu && (
        <div
          className="tree-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="tree-context-item tree-context-danger"
            onClick={() => { onDeletePage(contextMenu.pageId); setContextMenu(null); }}
          >
            Delete page
          </button>
        </div>
      )}
    </div>
  );
}
