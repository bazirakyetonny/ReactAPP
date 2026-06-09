import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../../types';
import { resolveColor, resolveCtaColor, resolveIconSVG } from '../../utils/tileUtils';
import { ctaIcons } from '../../data/ctaIcons';

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

/** Replaces all SVG fill values (except "none") with `color` — mirrors `.phone-tile-icon svg * { fill: currentColor }` */
function applyFillColor(svg: string, color: string): string {
  return svg
    .replace(/\bfill="([^"]+)"/g, (_, val) => val === 'none' ? 'fill="none"' : `fill="${color}"`)
    .replace(/\bfill='([^']+)'/g, (_, val) => val === 'none' ? "fill='none'" : `fill='${color}'`);
}

function wordWrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word.length > maxChars ? word.slice(0, maxChars) : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRoundCta(block: any): boolean {
  return block.InfoType === 'Cta' && (block.CtaAttributes?.CtaButtonType ?? 'FullWidth') === 'Round';
}

type BlockGroup =
  | { kind: 'single'; block: any }
  | { kind: 'round-row'; blocks: any[] };

function groupBlocks(content: any[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  let i = 0;
  const raw = content.slice(0, MAX_BLOCKS);
  while (i < raw.length) {
    if (isRoundCta(raw[i])) {
      const row: any[] = [];
      while (i < raw.length && isRoundCta(raw[i]) && row.length < 3) {
        row.push(raw[i++]);
      }
      groups.push({ kind: 'round-row', blocks: row });
    } else {
      groups.push({ kind: 'single', block: raw[i++] });
    }
  }
  return groups;
}

export function PhoneNodeContent({
  content,
  themeColors,
  themeIcons,
  themeCtaColors,
}: {
  content: any[];
  themeColors?: ThemeColors;
  themeIcons?: ThemeIcon[];
  themeCtaColors?: ThemeCtaColor[];
}) {
  const contentW = NODE_W - PAD_X * 2;
  const elements: JSX.Element[] = [];
  let curY = CONTENT_Y + 2;
  let key = 0;

  const groups = groupBlocks(content);

  for (const group of groups) {
    if (curY > NODE_H - 4) break;

    if (group.kind === 'round-row') {
      const { blocks } = group;
      const r = 5;
      if (curY + r * 2 > NODE_H - 4) break;

      const n = blocks.length;
      const rowGap = 4;
      const slotW = (contentW - rowGap * (n - 1)) / n;
      const hasAnyLabel = blocks.some((b: any) => b.CtaAttributes?.CtaLabel);

      blocks.forEach((ctaBlock: any, ci: number) => {
        const slotX = PAD_X + ci * (slotW + rowGap);
        const cx = slotX + slotW / 2;
        const attrs = ctaBlock.CtaAttributes ?? {};
        const rawBg = resolveCtaColor(attrs.CtaBGColor, themeCtaColors);
        const bg = rawBg === 'transparent' ? '#4c80f1' : rawBg;
        const textColor: string = attrs.CtaColor || '#ffffff';
        const rawLabel: string = attrs.CtaLabel ?? '';
        const maxChars = Math.max(Math.floor(slotW / 2.2), 3);
        const label = rawLabel.length > maxChars ? rawLabel.slice(0, maxChars - 1) + '…' : rawLabel;

        elements.push(<circle key={key++} cx={cx} cy={curY + r} r={r} fill={bg} />);
        elements.push(<circle key={key++} cx={cx} cy={curY + r} r={1.5} fill={textColor} opacity={0.85} />);

        if (label && hasAnyLabel && curY + r * 2 + 6 < NODE_H - 4) {
          elements.push(
            <text key={key++} x={cx} y={curY + r * 2 + 6} fontSize={3.5} fill="#334155" textAnchor="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {label.toUpperCase()}
            </text>
          );
        }
      });

      curY += r * 2 + (hasAnyLabel ? 10 : 3);
      continue;
    }

    const block = group.block;

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
          const hasBgImage = !!tile.BGImageUrl;
          const bg = hasBgImage ? undefined : resolveColor(tile.BGColor ?? tile.Color ?? '', themeColors);
          const noColor = !hasBgImage && bg === 'transparent';
          const fgColor: string = tile.Color ?? (noColor ? '#64748b' : '#ffffff');
          const align: string = tile.Align ?? 'center';

          if (hasBgImage) {
            elements.push(
              <image
                key={key++}
                href={tile.BGImageUrl}
                x={cx}
                y={ty}
                width={colW}
                height={clampedH}
                preserveAspectRatio="xMidYMid slice"
                style={{ pointerEvents: 'none' }}
              />
            );
            const dimOpacity = Number(tile.Opacity ?? 0) / 100;
            elements.push(
              <rect key={key++} x={cx} y={ty} width={colW} height={clampedH} rx={2} fill={`rgba(0,0,0,${dimOpacity.toFixed(2)})`} />
            );
          } else {
            elements.push(
              noColor
                ? <rect key={key++} x={cx + 0.5} y={ty + 0.5} width={colW - 1} height={clampedH - 1} rx={2} fill="none" stroke="#94a3b8" strokeWidth={0.75} strokeDasharray="2 1.5" />
                : <rect key={key++} x={cx} y={ty} width={colW} height={clampedH} rx={2} fill={bg!} />
            );
          }

          const iconSvg = resolveIconSVG(tile, themeIcons);
          const hasIcon = !!iconSvg && clampedH >= 10;
          const hasLabel = !!tile.Text && clampedH >= 8;
          // Show icon + label as a grouped unit (icon above, label below)
          const showBoth = hasIcon && hasLabel && clampedH >= 14;
          // groupH = icon(6) + gap(2) + text-cap(4) = 12
          const groupTopY = showBoth
            ? (align === 'center' ? ty + Math.max(1, (clampedH - 12) / 2) : ty + 2)
            : 0;

          if (hasIcon) {
            const tintedSvg = applyFillColor(iconSvg, fgColor);
            const iconX = align === 'left' ? cx + 2
              : align === 'right' ? cx + colW - 8
              : cx + colW / 2 - 3;
            const iconY = showBoth ? groupTopY : ty + clampedH / 2 - 3;
            elements.push(
              <image
                key={key++}
                href={`data:image/svg+xml,${encodeURIComponent(tintedSvg)}`}
                x={iconX}
                y={iconY}
                width={6}
                height={6}
                style={{ pointerEvents: 'none' }}
              />
            );
          }

          if (hasLabel && (!hasIcon || clampedH >= 12)) {
            const label = (tile.Text as string).length > 7 ? (tile.Text as string).slice(0, 6) + '…' : tile.Text;
            const labelX = align === 'left' ? cx + 2
              : align === 'right' ? cx + colW - 2
              : cx + colW / 2;
            const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
            // baseline = groupTop + icon(6) + gap(2) + cap(3) = groupTop + 11
            const labelY = showBoth
              ? groupTopY + 11
              : align === 'center' ? ty + clampedH / 2 + 2 : ty + 5;
            elements.push(
              <text
                key={key++}
                x={labelX}
                y={labelY}
                fontSize={4}
                fill={fgColor}
                textAnchor={anchor}
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

    } else if (block.InfoType === 'Cta') {
      const attrs = block.CtaAttributes ?? {};
      const ctaType: string = attrs.CtaButtonType || 'FullWidth';
      const rawBg = resolveCtaColor(attrs.CtaBGColor, themeCtaColors);
      const bg = rawBg === 'transparent' ? '#4c80f1' : rawBg;
      const textColor: string = attrs.CtaColor || '#ffffff';
      const rawLabel: string = attrs.CtaLabel ?? '';
      const displayLabel = rawLabel.length > 11 ? rawLabel.slice(0, 10) + '…' : rawLabel;

      if (ctaType === 'FullWidth') {
        const barH = 9;
        const clampedH = Math.min(barH, NODE_H - curY - 4);
        if (clampedH < 4) break;
        elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedH} rx={clampedH / 2} fill={bg} />);
        if (displayLabel && clampedH >= 6) {
          elements.push(
            <text key={key++} x={PAD_X + contentW / 2} y={curY + clampedH / 2 + 1.5} fontSize={3.5} fill={textColor} textAnchor="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {displayLabel}
            </text>
          );
        }
        curY += clampedH + 3;

      } else if (ctaType === 'Icon') {
        const barH = TILE_H;
        const clampedH = Math.min(barH, NODE_H - curY - 4);
        if (clampedH < 4) break;
        elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedH} rx={3} fill={bg} />);
        const boxSize = clampedH - 2;
        elements.push(<rect key={key++} x={PAD_X + 1} y={curY + 1} width={boxSize} height={boxSize} rx={1.5} fill="rgba(255,255,255,0.2)" />);
        const iconEntry = ctaIcons.find(i => i.name === attrs.CtaButtonIcon);
        if (iconEntry) {
          const tintedIcon = applyFillColor(iconEntry.svg, textColor);
          const iconSize = boxSize - 6;
          const iconPad = (boxSize - iconSize) / 2;
          elements.push(
            <image
              key={key++}
              href={`data:image/svg+xml,${encodeURIComponent(tintedIcon)}`}
              x={PAD_X + 1 + iconPad}
              y={curY + 1 + iconPad}
              width={iconSize}
              height={iconSize}
              style={{ pointerEvents: 'none' }}
            />
          );
        }
        if (displayLabel && clampedH >= 7) {
          elements.push(
            <text key={key++} x={PAD_X + boxSize + 4} y={curY + clampedH / 2 + 1.5} fontSize={3.5} fill={textColor} textAnchor="start" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {displayLabel}
            </text>
          );
        }
        elements.push(
          <text key={key++} x={PAD_X + contentW - 2} y={curY + clampedH / 2 + 2} fontSize={6} fill={textColor} textAnchor="end" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            ›
          </text>
        );
        curY += clampedH + 3;

      } else {
        // Image type (default)
        const barH = TILE_H;
        const clampedH = Math.min(barH, NODE_H - curY - 4);
        if (clampedH < 4) break;
        elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedH} rx={3} fill={bg} />);
        const boxSize = clampedH - 2;
        if (attrs.CtaButtonImgUrl) {
          elements.push(
            <image
              key={key++}
              href={attrs.CtaButtonImgUrl}
              x={PAD_X + 1}
              y={curY + 1}
              width={boxSize}
              height={boxSize}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }}
            />
          );
        } else {
          elements.push(<rect key={key++} x={PAD_X + 1} y={curY + 1} width={boxSize} height={boxSize} rx={1.5} fill="rgba(255,255,255,0.25)" />);
          const bx = PAD_X + 1, by = curY + 1;
          elements.push(
            <path key={key++}
              d={`M${bx + 1},${by + boxSize - 1} L${bx + boxSize / 2},${by + 2} L${bx + boxSize - 1},${by + boxSize - 1}`}
              fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={0.8}
            />
          );
        }
        if (displayLabel && clampedH >= 7) {
          elements.push(
            <text key={key++} x={PAD_X + boxSize + 4} y={curY + clampedH / 2 + 1.5} fontSize={3.5} fill={textColor} textAnchor="start" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {displayLabel}
            </text>
          );
        }
        elements.push(
          <text key={key++} x={PAD_X + contentW - 2} y={curY + clampedH / 2 + 2} fontSize={6} fill={textColor} textAnchor="end" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            ›
          </text>
        );
        curY += clampedH + 3;
      }

    } else if (block.InfoType === 'Description') {
      const plainText = stripHtml(block.InfoValue ?? '');
      const wrapped = wordWrap(plainText, 34).slice(0, 2);
      const line1 = wrapped[0] ?? null;
      const line2 = wrapped[1] ?? null;
      const barH = line2 ? 14 : 8;
      const clampedBarH = Math.min(barH, NODE_H - curY - 4);
      if (clampedBarH < 5) break;
      elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedBarH} rx={2} fill="#f3f4f6" />);
      if (line1) {
        const y1 = line2 ? curY + 5 : curY + clampedBarH / 2 + 1.5;
        elements.push(
          <text key={key++} x={PAD_X + 2} y={y1} fontSize={3.5} fill="#374151" textAnchor="start" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {line1}
          </text>
        );
      }
      if (line2) {
        elements.push(
          <text key={key++} x={PAD_X + 2} y={curY + 10} fontSize={3.5} fill="#6b7280" textAnchor="start" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {line2}
          </text>
        );
      }
      curY += clampedBarH + 3;

    } else if (block.InfoType === 'Images') {
      const imgH = 22;
      const clampedImgH = Math.min(imgH, NODE_H - curY - 4);
      if (clampedImgH < 6) break;
      const imgUrls: string[] = (block.Images ?? [])
        .map((img: any) => img.InfoImageValue as string)
        .filter(Boolean)
        .slice(0, 3);
      if (imgUrls.length > 0) {
        const n = imgUrls.length;
        const gap = 1;
        const slotW = (contentW - gap * (n - 1)) / n;
        imgUrls.forEach((url, ii) => {
          elements.push(
            <image
              key={key++}
              href={url}
              x={PAD_X + ii * (slotW + gap)}
              y={curY}
              width={slotW}
              height={clampedImgH}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }}
            />
          );
        });
      } else {
        // No images yet — placeholder
        elements.push(<rect key={key++} x={PAD_X} y={curY} width={contentW} height={clampedImgH} rx={2} fill="#bfdbfe" />);
        const cx = PAD_X + contentW / 2, cy = curY + clampedImgH / 2;
        elements.push(<circle key={key++} cx={cx} cy={cy} r={4} fill="none" stroke="#3b82f6" strokeWidth={1} />);
        elements.push(<circle key={key++} cx={cx} cy={cy} r={1.5} fill="#3b82f6" />);
      }
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
