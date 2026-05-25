import type { ThemeColors, ThemeIcon, ThemeCtaColor } from '../types';

export function resolveCtaColor(ctaBGColor: string | undefined, ctaColors: ThemeCtaColor[] | undefined): string {
  if (!ctaBGColor) return 'transparent';
  if (ctaBGColor.startsWith('#')) return ctaBGColor;
  return ctaColors?.find(c => c.CtaColorName === ctaBGColor)?.CtaColorCode ?? '#4c80f1';
}

export function resolveColor(bgColor: string, themeColors: ThemeColors | undefined): string {
  if (!bgColor) return 'transparent';
  if (bgColor.startsWith('#')) return bgColor;
  return (themeColors as any)?.[bgColor] ?? '#e5e7eb';
}

export function resolveIconSVG(tile: any, themeIcons: ThemeIcon[] | undefined): string | null {
  if (themeIcons) {
    if (tile.IconId) {
      const match = themeIcons.find((i) => i.IconId === tile.IconId);
      if (match?.IconSVG) return match.IconSVG;
    }
    if (tile.IconCodeName) {
      const match = themeIcons.find((i) => i.IconCodeName && i.IconCodeName === tile.IconCodeName);
      if (match?.IconSVG) return match.IconSVG;
    }
    if (tile.Icon) {
      const lower = (tile.Icon as string).toLowerCase();
      const match = themeIcons.find(
        (i) =>
          i.IconId === tile.Icon ||
          (i.IconCodeName && i.IconCodeName.toLowerCase() === lower) ||
          i.IconName.toLowerCase() === lower,
      );
      if (match?.IconSVG) return match.IconSVG;
    }
  }
  return tile.IconSVG ?? null;
}
