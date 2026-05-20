import type { ThemeColors, ThemeIcon } from '../types';

export function resolveColor(bgColor: string, themeColors: ThemeColors | undefined): string {
  if (!bgColor) return 'transparent';
  if (bgColor.startsWith('#')) return bgColor;
  return (themeColors as any)?.[bgColor] ?? '#e5e7eb';
}

export function resolveIconSVG(tile: any, themeIcons: ThemeIcon[] | undefined): string | null {
  if (themeIcons) {
    if (tile.IconCodeName) {
      const match = themeIcons.find((i) => i.IconCodeName === tile.IconCodeName);
      if (match?.IconSVG) return match.IconSVG;
    }
    if (tile.Icon) {
      const lower = (tile.Icon as string).toLowerCase();
      const match = themeIcons.find(
        (i) =>
          (i.IconCodeName && i.IconCodeName.toLowerCase() === lower) ||
          i.IconName.toLowerCase() === lower,
      );
      if (match?.IconSVG) return match.IconSVG;
    }
  }
  return tile.IconSVG ?? null;
}
