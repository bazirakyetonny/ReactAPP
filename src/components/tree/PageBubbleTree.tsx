import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './PageBubbleTree.css';
import { usePageGraph } from './usePageGraph';
import type { GraphNode, GraphEdge } from './usePageGraph';
import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../../types';
import { PhoneNodeContent, NODE_W, NODE_H, NODE_RX } from './PhoneNodeContent';
import { DeletePageModal } from '../phone/DeletePageButton';
import { i18n } from '../../i18n/i18n';

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
  onActivatePage?: (pageId: string) => void;
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
  onActivatePage,
  onDeletePage,
  onBeforeDeletePage,
}: PageBubbleTreeProps) {
  const { nodes, edges, homeId, getPath } = usePageGraph(allPages, infoContent, navContents);

  const initialFocus = navStack.length > 0 ? navStack[navStack.length - 1] : homeId;
  const [focusedPageId, setFocusedPageId] = useState(initialFocus);
  // Start with the exact navStack path the editor has open, not BFS shortest
  const [currentPath, setCurrentPath] = useState<string[]>(navStack);
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);
  const [deleteModalPageId, setDeleteModalPageId] = useState<string | null>(null);

  const simNodesRef = useRef<SimNode[]>([]);
  const [tick, setTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, GraphEdge> | null>(null);
  const svgSizeRef = useRef({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  function showTooltip(e: React.MouseEvent, text: string) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  }
  function moveTooltip(e: React.MouseEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  }
  function hideTooltip() { setTooltip(null); }

  const { visibleNodes, visibleEdges } = (() => {
    if (viewMode === 'all') {
      return { visibleNodes: nodes as SimNode[], visibleEdges: edges };
    }
    // Use currentPath (editor navStack on open, BFS after in-tree navigation)
    const pathIds = new Set([homeId, ...currentPath]);
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

  const breadcrumbIds = [homeId, ...currentPath];

  // Resolve the path to a node using the current tree context instead of BFS.
  // Walks [home, ...currentPath] from deepest to shallowest to find which
  // context ancestor has an edge into nodeId, then builds the path via that ancestor.
  function pathToInContext(nodeId: string): string[] {
    if (nodeId === homeId) return [];
    const idx = currentPath.indexOf(nodeId);
    if (idx !== -1) return currentPath.slice(0, idx + 1);
    const contextNodes = [homeId, ...currentPath];
    for (let i = contextNodes.length - 1; i >= 0; i--) {
      const parentId = contextNodes[i];
      const linked = edges.some(e => e.source === parentId && e.target === nodeId);
      if (linked) {
        if (parentId === homeId) return [nodeId];
        return [...currentPath.slice(0, currentPath.indexOf(parentId) + 1), nodeId];
      }
    }
    return getPath(nodeId);
  }

  function handleNodeClick(nodeId: string) {
    const path = pathToInContext(nodeId);
    setFocusedPageId(nodeId);
    setCurrentPath(path);
    setViewMode('focused');
    const node = nodes.find(n => n.id === nodeId);
    if (!node?.isOrphan) {
      onNavigateToPath(path);
    }
  }

  function handleEdgeClick(edge: GraphEdge) {
    const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
    const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
    const fullPath = [...pathToInContext(srcId), targetId];
    onNavigateToPath(fullPath);
    onActivatePage?.(targetId);
    onClose();
  }

  function handleNodeContextMenu(e: React.MouseEvent, node: SimNode) {
    if (!node.isOrphan) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId: node.id });
  }

  const posMap = new Map(simNodesRef.current.map(n => [n.id, { x: n.x, y: n.y }]));
  void tick;

  return (
    <div ref={containerRef} className="page-bubble-tree" onClick={() => { setContextMenu(null); hideTooltip(); }}>
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
                onMouseEnter={(e) => {
                  const tgtNode = nodes.find(n => n.id === tgtId);
                  if (tgtNode) showTooltip(e, i18n.t('tree.open_navigation_detail', { name: tgtNode.name }));
                }}
                onMouseMove={moveTooltip}
                onMouseLeave={hideTooltip}
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }} />
              <path className="tree-link" d={d} style={{ pointerEvents: 'none' }} />
              <polygon points="-6,-4 0,0 -6,4" fill="#64748b"
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
              onMouseEnter={(e) => showTooltip(e, i18n.t('tree.open_navigation_path', { name: node.name }))}
              onMouseMove={moveTooltip}
              onMouseLeave={hideTooltip}
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
                <rect x={6} y={-5} width={NODE_W} height={NODE_H} rx={NODE_RX} className="tree-node-stack-shadow tree-node-stack-shadow--far" />
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
                    <button type="button" className="tree-breadcrumb-btn" onClick={() => {
                      const pathSlice = i === 0 ? [] : currentPath.slice(0, i);
                      setFocusedPageId(id);
                      setCurrentPath(pathSlice);
                      setViewMode('focused');
                      onNavigateToPath(pathSlice);
                    }}>
                      {name}
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="tree-toolbar-actions">
              <button
                type="button"
                className="tree-toolbar-btn"
                title={viewMode === 'focused' ? i18n.t("tree.all_pages") : i18n.t("navbar.select_frame")}
                onClick={() => setViewMode(viewMode === 'focused' ? 'all' : 'focused')}
              >
                {viewMode === 'focused' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="19.48" height="19.48" viewBox="0 0 19.48 19.48" aria-hidden="true">
                    <path d="M1.34.049A1.865,1.865,0,0,0,.2.928C0,1.318,0,1.265,0,4.256,0,7.208,0,7.143.185,7.532A2.195,2.195,0,0,0,.9,8.274c.432.229.27.219,3.353.219H7.03l.232-.073A1.81,1.81,0,0,0,8.42,7.259c.072-.228.072-.231.072-3,0-3.084.01-2.922-.219-3.354a2.141,2.141,0,0,0-.75-.716C7.145,0,7.139,0,4.221,0,2.094,0,1.5.014,1.34.049m11.012,0a1.6,1.6,0,0,0-.807.444,1.7,1.7,0,0,0-.493.791,17.676,17.676,0,0,0-.06,2.972c0,2.773,0,2.776.072,3A1.81,1.81,0,0,0,12.222,8.42l.232.073h2.776a17.635,17.635,0,0,0,2.97-.06,1.637,1.637,0,0,0,.722-.421,1.745,1.745,0,0,0,.472-.692l.073-.192.01-2.784c.01-3.079.014-3.019-.2-3.416A2.092,2.092,0,0,0,18.55.2c-.38-.2-.366-.2-3.321-.2-2.1,0-2.721.011-2.878.045M6.913,1.572l.068.062V4.243c0,2.534,0,2.611-.062,2.672a.424.424,0,0,1-.2.083c-.078.011-1.247.016-2.6.011L1.658,7l-.074-.074L1.51,6.851,1.5,4.294c-.007-1.789,0-2.582.026-2.642a.266.266,0,0,1,.106-.12c.049-.023.88-.032,2.641-.028,2.478.006,2.573.008,2.639.068M17.84,1.531a.27.27,0,0,1,.116.122c.025.059.033.857.026,2.641l-.008,2.557-.074.074L17.826,7l-2.459.01c-1.353,0-2.522,0-2.6-.011a.424.424,0,0,1-.2-.083c-.061-.061-.062-.138-.062-2.672a12.422,12.422,0,0,1,.056-2.658.424.424,0,0,1,.106-.068c.027-.01,1.184-.019,2.572-.02,1.811,0,2.546.007,2.6.034M1.2,11.083a2.093,2.093,0,0,0-.381.181,2.185,2.185,0,0,0-.636.693C0,12.342,0,12.28,0,15.23c0,2.991,0,2.938.2,3.328a2.106,2.106,0,0,0,.725.724c.4.211.337.207,3.415.2l2.784-.01L7.32,19.4a1.745,1.745,0,0,0,.691-.472,1.638,1.638,0,0,0,.421-.722,17.642,17.642,0,0,0,.06-2.971V12.455l-.073-.232a1.827,1.827,0,0,0-1.242-1.178c-.095-.022-1.133-.034-2.955-.034H1.413l-.212.072m11.093-.037a1.844,1.844,0,0,0-1.229,1.177l-.073.232v2.776a17.642,17.642,0,0,0,.06,2.971,1.638,1.638,0,0,0,.421.722,1.745,1.745,0,0,0,.691.472l.192.073,2.784.01c3.078.01,3.018.014,3.415-.2a2.1,2.1,0,0,0,.725-.725c.211-.4.207-.337.2-3.416l-.01-2.784-.072-.19a1.607,1.607,0,0,0-.381-.6,1.831,1.831,0,0,0-.757-.491,16.118,16.118,0,0,0-3.022-.061c-1.582,0-2.869.016-2.94.033M6.917,12.569c.063.063.064.108.064,2.676v2.612l-.085.068c-.085.066-.1.067-2.629.067-1.821,0-2.566-.01-2.624-.037a.27.27,0,0,1-.116-.122c-.025-.059-.033-.857-.026-2.639.008-2.459.011-2.556.07-2.622l.062-.068H4.242c2.566,0,2.611,0,2.675.065m10.995,0c.059.066.062.163.07,2.622.007,1.782,0,2.58-.026,2.639a.27.27,0,0,1-.116.122c-.058.027-.8.037-2.624.037-2.524,0-2.544,0-2.629-.067l-.085-.068V15.245c0-2.568,0-2.613.065-2.676s.108-.065,2.674-.065H17.85l.062.068" transform="translate(0 -0.003)" fill="#7c8791" fillRule="evenodd"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="19.48" height="19.48" viewBox="0 0 19.48 19.48" aria-hidden="true">
                    <path d="M2.162.021,1.918.07A2.6,2.6,0,0,0,.182,1.546C0,2,0,2.07.008,4.423l.01,2.162.082.26A2.605,2.605,0,0,0,1.75,8.515L2,8.6H6.581l.243-.076A2.552,2.552,0,0,0,8.1,7.639a2.333,2.333,0,0,0,.423-.811L8.6,6.585V2l-.085-.25A2.616,2.616,0,0,0,7.232.263C6.72.011,6.841.022,4.4.014c-1.2,0-2.207,0-2.242.007M6.572,1.454a1.364,1.364,0,0,1,.57.559l.09.183V6.422L7.147,6.6A1.217,1.217,0,0,1,6.6,7.15l-.179.085L4.35,7.244c-2.056.008-2.07.008-2.257-.063A1.261,1.261,0,0,1,1.472,6.6l-.09-.182V2.2l.079-.162a1.2,1.2,0,0,1,.717-.624,20.779,20.779,0,0,1,2.194-.034c2.028.006,2.049.007,2.2.077m4.67,3.175a.818.818,0,0,0-.24.214.488.488,0,0,0-.1.377.475.475,0,0,0,.1.379.825.825,0,0,0,.257.221c.146.075.193.081.857.1.648.017.712.024.843.093a1.323,1.323,0,0,1,.511.5c.094.171.094.175.112.874.017.665.022.71.1.857a.826.826,0,0,0,.221.257.474.474,0,0,0,.379.1.491.491,0,0,0,.377-.1.774.774,0,0,0,.222-.259c.081-.158.083-.175.081-.828a2.753,2.753,0,0,0-.265-1.5,1.9,1.9,0,0,0-.479-.636,1.866,1.866,0,0,0-.636-.478,2.758,2.758,0,0,0-1.5-.251c-.665,0-.7,0-.838.075M5.021,10.914a.8.8,0,0,0-.411.359c-.073.149-.076.184-.073.838A2.675,2.675,0,0,0,4.8,13.591a1.9,1.9,0,0,0,.48.636,1.894,1.894,0,0,0,.636.479,2.75,2.75,0,0,0,1.5.265c.653,0,.67,0,.828-.081a.774.774,0,0,0,.259-.222.488.488,0,0,0,.1-.375.586.586,0,0,0-.289-.564c-.126-.088-.134-.089-.813-.11a6.165,6.165,0,0,1-.794-.055,1.258,1.258,0,0,1-.694-.6c-.067-.128-.074-.2-.092-.838s-.024-.711-.094-.855a.642.642,0,0,0-.551-.367,1.157,1.157,0,0,0-.249.007m7.849.027a2.158,2.158,0,0,0-.682.25,2.578,2.578,0,0,0-1.208,1.491l-.076.243v4.584l.085.25a2.6,2.6,0,0,0,1.7,1.659l.262.074h2.226a13.652,13.652,0,0,0,2.463-.061,2.588,2.588,0,0,0,1.782-1.783,13.667,13.667,0,0,0,.061-2.464V12.958L19.41,12.7a2.582,2.582,0,0,0-1.68-1.7l-.261-.082L15.276,10.9a22.668,22.668,0,0,0-2.405.038M17.4,12.325a1.3,1.3,0,0,1,.626.577l.091.185v4.226l-.1.188a1.334,1.334,0,0,1-.564.554c-.152.071-.163.071-2.266.071H13.082l-.171-.077a1.335,1.335,0,0,1-.59-.638,8.482,8.482,0,0,1-.068-2.211,8.2,8.2,0,0,1,.07-2.217,1.241,1.241,0,0,1,.629-.643l.2-.08h2.038a8.619,8.619,0,0,1,2.218.066" transform="translate(-0.004 -0.012)" fill="#7c8791" fillRule="evenodd"/>
                  </svg>
                )}
              </button>
              <button type="button" className="tree-toolbar-btn tree-minimize-btn" title={i18n.t("tree.minimise_tree")} onClick={onClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="19.483" height="19.482" viewBox="0 0 19.483 19.482" aria-hidden="true">
                  <path d="M18.914.334a.862.862,0,0,0-.2.066c-.047.023-1.393,1.35-2.993,2.949l-2.91,2.9V4.108c0-1.449-.012-2.19-.037-2.28a.819.819,0,0,0-.529-.486.745.745,0,0,0-.854.385l-.072.134v6.4l.074.139a.769.769,0,0,0,.419.362,23.639,23.639,0,0,0,3.3.045L18.26,8.8l.139-.075a.758.758,0,0,0,.377-.9.914.914,0,0,0-.489-.483c-.084-.024-.864-.036-2.274-.036H13.867L16.773,4.4c1.6-1.6,2.933-2.962,2.966-3.026a.765.765,0,0,0,.062-.321.55.55,0,0,0-.1-.368.757.757,0,0,0-.787-.352m-17,11a.7.7,0,0,0-.533.439.682.682,0,0,0,.16.809.756.756,0,0,0,.29.193c.091.025.814.037,2.28.037H6.254L3.348,15.72C1.75,17.32.415,18.682.382,18.746a.765.765,0,0,0-.062.321.718.718,0,0,0,.366.634.55.55,0,0,0,.368.1.765.765,0,0,0,.321-.062c.064-.033,1.426-1.368,3.026-2.966l2.91-2.906v2.146c0,1.466.012,2.189.037,2.28a.888.888,0,0,0,.482.483.756.756,0,0,0,.9-.377L8.8,18.26l.009-3.152a23.639,23.639,0,0,0-.045-3.3.769.769,0,0,0-.362-.419l-.139-.074-3.118-.005c-1.716,0-3.172.006-3.237.019" transform="translate(-0.32 -0.321)" fill="#7c8791" fillRule="evenodd"/>
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

      {tooltip && (
        <div
          className="tree-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
