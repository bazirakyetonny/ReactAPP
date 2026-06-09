import type { ThemeColors, ThemeIcon } from '../../types';
import { resolveColor, resolveCtaColor, resolveIconSVG } from '../../utils/tileUtils';

export const NODE_W = 90;
export const NODE_H = 140;
export const NODE_RX = 12;

const STATUS_H = 11;
const CONTENT_Y = STATUS_H + 1;
const PAD_X = 4;
const COL_GAP = 2;
const TILE_GAP = 2;
const TILE_H = 18;
const MAX_BLOCKS = 6;

export function PhoneNodeContent({
  content,
  themeColors,
  themeIcons,
}: {
  content: any[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
}) {
  const contentW = NODE_W - PAD_X * 2;
  const elements: JSX.Element[] = [];
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

          const iconSvg = resolveIconSVG(tile, themeIcons);
          if (iconSvg && clampedH >= 8) {
            const tintedSvg = iconSvg.replace(/currentColor/g, noColor ? '#64748b' : 'rgba(255,255,255,0.85)');
            elements.push(
              <image
                key={key++}
                href={`data:image/svg+xml,${encodeURIComponent(tintedSvg)}`}
                x={cx + colW - 7}
                y={ty + 1}
                width={6}
                height={6}
                style={{ pointerEvents: 'none' }}
              />
            );
          }

          ty += clampedH + TILE_GAP;
        }
        maxTy = Math.max(maxTy, ty);
      });
      curY = maxTy + 2;

    } else if (block.InfoType === 'Cta') {
      const ctaH = 10;
      const clampedCtaH = Math.min(ctaH, NODE_H - curY - 4);
      if (clampedCtaH < 4) break;
      const rawBg = resolveCtaColor(block.CtaAttributes?.CtaBGColor, undefined);
      const bg = rawBg === 'transparent' ? '#4c80f1' : rawBg;
      elements.push(
        <rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedCtaH} rx={clampedCtaH / 2} fill={bg} />
      );
      if (block.CtaAttributes?.CtaLabel && clampedCtaH >= 6) {
        const label = (block.CtaAttributes.CtaLabel as string).length > 10
          ? (block.CtaAttributes.CtaLabel as string).slice(0, 9) + '…'
          : block.CtaAttributes.CtaLabel;
        elements.push(
          <text key={key++} x={PAD_X + contentW / 2} y={curY + clampedCtaH / 2 + 1.5} fontSize={4} fill="#ffffff" textAnchor="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {label}
          </text>
        );
      }
      curY += clampedCtaH + 3;

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

  return (
    <>
      <rect y={CONTENT_Y} width={NODE_W} height={NODE_H - CONTENT_Y} fill="#f9fafb" />
      <text x={5} y={8} fontSize={4.5} fill="rgba(0,0,0,0.5)" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none' }}>9:36</text>
      <circle cx={NODE_W - 5} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />
      <circle cx={NODE_W - 10} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />
      <circle cx={NODE_W - 15} cy={5.5} r={1.5} fill="rgba(0,0,0,0.25)" />
      <rect y={STATUS_H} width={NODE_W} height={0.5} fill="#e2e8f0" />
      {elements}
    </>
  );
}
