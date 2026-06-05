import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";
import "./SelectionOverlay.css";

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 9.5V2A1.5 1.5 0 0 1 3.5.5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="3.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5.5" y1="8.5" x2="12" y2="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8.5" y1="8.5" x2="2" y2="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

interface Bounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SelectionOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  multiSelectedTileIds?: Set<string>;
  multiSelectedCtaIds?: Set<string>;
  multiSelectedImageIds?: Set<string>;
  multiSelectedDescriptionIds?: Set<string>;
  onCopy?: () => void;
  onCut?: () => void;
}

export function SelectionOverlay({
  containerRef,
  multiSelectedTileIds,
  multiSelectedCtaIds,
  multiSelectedImageIds,
  multiSelectedDescriptionIds,
  onCopy,
  onCut,
}: SelectionOverlayProps) {
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const hasSelection =
      (multiSelectedTileIds?.size ?? 0) > 0 ||
      (multiSelectedCtaIds?.size ?? 0) > 0 ||
      (multiSelectedImageIds?.size ?? 0) > 0 ||
      (multiSelectedDescriptionIds?.size ?? 0) > 0;

    if (!hasSelection) {
      setBounds(null);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const scrollTop = root.scrollTop;
    const scrollLeft = root.scrollLeft;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const expandBounds = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const top = r.top - rootRect.top + scrollTop;
      const left = r.left - rootRect.left + scrollLeft;
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, left + r.width);
      maxY = Math.max(maxY, top + r.height);
    };

    root.querySelectorAll<HTMLElement>("[data-tile-id]").forEach((el) => {
      if (multiSelectedTileIds?.has(el.dataset.tileId!)) expandBounds(el);
    });

    root.querySelectorAll<HTMLElement>("[data-cta-id]").forEach((el) => {
      if (multiSelectedCtaIds?.has(el.dataset.ctaId!)) {
        // Use the visual child element to avoid the full-width wrapper padding
        const visual =
          el.querySelector<HTMLElement>(".phone-cta-fullwidth, .phone-cta-round-wrap") ?? el;
        expandBounds(visual);
      }
    });

    root.querySelectorAll<HTMLElement>("[data-image-id]").forEach((el) => {
      if (multiSelectedImageIds?.has(el.dataset.imageId!)) {
        const visual =
          el.querySelector<HTMLElement>(".phone-image-single, .phone-image-carousel, .phone-image-empty") ?? el;
        expandBounds(visual);
      }
    });

    root.querySelectorAll<HTMLElement>("[data-description-id]").forEach((el) => {
      if (multiSelectedDescriptionIds?.has(el.dataset.descriptionId!)) {
        const visual = el.querySelector<HTMLElement>(".phone-desc-content") ?? el;
        expandBounds(visual);
      }
    });

    const PAD = 5;
    setBounds(
      minX < Infinity
        ? {
            top: minY - PAD,
            left: minX - PAD,
            width: maxX - minX + PAD * 2,
            height: maxY - minY + PAD * 2,
          }
        : null,
    );
  }, [containerRef, multiSelectedTileIds, multiSelectedCtaIds, multiSelectedImageIds, multiSelectedDescriptionIds]);

  if (!bounds) return null;

  return (
    <div
      className="selection-outline-container"
      style={{ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <svg
        className="selection-outline-svg"
        aria-hidden="true"
      >
        <rect
          className="marching-ants"
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(74, 144, 217, 0.06)"
          stroke="#4a90d9"
          strokeWidth="2"
          strokeDasharray="8 4"
          rx="3"
        />
      </svg>

      <div className="selection-actions">
          <button
            className="selection-action-btn"
            title="Copy"
            type="button"
            onClick={onCopy}
          >
            <CopyIcon />
          </button>
          <button
            className="selection-action-btn"
            title="Cut"
            type="button"
            onClick={onCut}
          >
            <CutIcon />
          </button>
        </div>
    </div>
  );
}
