import { useLayoutEffect, useCallback, useState } from "react";

interface NavPathsOverlayProps {
  stageRef: React.RefObject<HTMLDivElement | null>;
  activeNavTileIds: Set<string>;
  selectedTileId?: string | null;
  selectedCtaId?: string | null;
}

interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PathData {
  key: string;
  d: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  srcScreen: ScreenRect;
  dstScreen: ScreenRect;
  gapLeft: number;
  gapRight: number;
}

const COLOR = "#3d5a9e";
const NODE_R = 4;
const BIG = 10000;

function sCurve(x1: number, y1: number, x2: number, y2: number): string {
  const tension = Math.max(40, Math.abs(x2 - x1) * 0.4);
  return `M ${x1} ${y1} C ${x1 + tension} ${y1} ${x2 - tension} ${y2} ${x2} ${y2}`;
}

export function NavPathsOverlay({
  stageRef,
  activeNavTileIds,
  selectedTileId,
  selectedCtaId,
}: NavPathsOverlayProps) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const recompute = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const { scrollLeft, scrollTop, scrollWidth, scrollHeight } = stage;

    const cx = (clientX: number) => clientX - stageRect.left + scrollLeft;
    const cy = (clientY: number) => clientY - stageRect.top + scrollTop;

    const toEdges = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        leftX: cx(r.left),
        rightX: cx(r.right),
        midY: cy(r.top + r.height / 2),
      };
    };

    const getScreenRect = (el: Element): ScreenRect => {
      const frame = el.closest(".phone-frame");
      const screen = frame?.querySelector(".phone-screen");
      if (!screen) return { x: -BIG, y: -BIG, w: BIG * 2, h: BIG * 2 };
      const r = screen.getBoundingClientRect();
      return { x: cx(r.left), y: cy(r.top), w: r.width, h: r.height };
    };

    const getFrameEdges = (el: Element) => {
      const frame = el.closest(".phone-frame");
      if (!frame) return { leftX: -BIG, rightX: BIG };
      const r = frame.getBoundingClientRect();
      return { leftX: cx(r.left), rightX: cx(r.right) };
    };

    const uniqueEls = new Set<HTMLElement>(
      stage.querySelectorAll<HTMLElement>(".phone-tile-wrap--nav-active"),
    );
    if (selectedTileId) {
      const sel = stage.querySelector<HTMLElement>(
        `[data-tile-id="${selectedTileId}"]`,
      );
      if (sel) uniqueEls.add(sel);
    }
    if (selectedCtaId) {
      const sel = stage.querySelector<HTMLElement>(
        `[data-cta-id="${selectedCtaId}"]`,
      );
      if (sel) uniqueEls.add(sel);
    }

    const points = Array.from(uniqueEls)
      .map((el) => {
        const { leftX, rightX, midY } = toEdges(el);
        return {
          el,
          key: el.dataset.tileId ?? el.dataset.ctaId ?? el.id,
          leftX,
          rightX,
          midY,
        };
      })
      .sort((a, b) => a.leftX - b.leftX);

    const newPaths: PathData[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const src = points[i];
      const dst = points[i + 1];
      const x1 = src.rightX;
      const y1 = src.midY;
      const x2 = dst.leftX;
      const y2 = dst.midY;

      newPaths.push({
        key: `${src.key}-${dst.key}`,
        d: sCurve(x1, y1, x2, y2),
        x1, y1, x2, y2,
        srcScreen: getScreenRect(src.el),
        dstScreen: getScreenRect(dst.el),
        gapLeft: getFrameEdges(src.el).rightX,
        gapRight: getFrameEdges(dst.el).leftX,
      });
    }

    setPaths(newPaths);
    setSize({ w: scrollWidth, h: scrollHeight });
  }, [stageRef, activeNavTileIds, selectedTileId, selectedCtaId]);

  useLayoutEffect(() => {
    recompute();
    const stage = stageRef.current;
    if (!stage) return;

    const obs = new ResizeObserver(recompute);
    obs.observe(stage);

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recompute);
    };
    stage.addEventListener("scroll", onScroll, { passive: true, capture: true });

    return () => {
      obs.disconnect();
      stage.removeEventListener("scroll", onScroll, { capture: true });
      cancelAnimationFrame(rafId);
    };
  }, [recompute]);

  if (size.w === 0) return null;

  return (
    <svg
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size.w,
        height: size.h,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        {paths.map(({ key, srcScreen, dstScreen, gapLeft, gapRight }) => (
          <clipPath key={`cp-${key}`} id={`ncl-${key}`}>
            {/* source phone-screen visible area */}
            <rect
              x={srcScreen.x}
              y={srcScreen.y}
              width={srcScreen.w}
              height={srcScreen.h}
            />
            {/* gap between the two phone frames — no clipping needed here */}
            <rect
              x={gapLeft}
              y={-BIG}
              width={Math.max(0, gapRight - gapLeft)}
              height={BIG * 2}
            />
            {/* target phone-screen visible area */}
            <rect
              x={dstScreen.x}
              y={dstScreen.y}
              width={dstScreen.w}
              height={dstScreen.h}
            />
          </clipPath>
        ))}
      </defs>

      {paths.map(({ key, d, x1, y1, x2, y2 }) => (
        <g key={key} clipPath={`url(#ncl-${key})`}>
          <path
            d={d}
            fill="none"
            stroke={COLOR}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={x1} cy={y1} r={NODE_R} fill={COLOR} />
          <circle cx={x2} cy={y2} r={NODE_R} fill={COLOR} />
        </g>
      ))}
    </svg>
  );
}
