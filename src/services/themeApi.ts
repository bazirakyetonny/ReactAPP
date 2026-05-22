import { apiGet, apiPost } from './apiClient';

export interface SDTLocationTheme {
  ThemeId: string;
  ThemeName: string;
  ThemeFontFamily: string;
  ThemeColors: unknown;
  ThemeCtaColors: unknown;
  ThemeIcons: unknown;
  [key: string]: unknown;
}

export function getLocationTheme(): Promise<SDTLocationTheme> {
  return apiGet<{ SDT_LocationTheme: SDTLocationTheme }>('/api/toolbox/location-theme').then(
    (d) => d.SDT_LocationTheme
  );
}

export function updateAppVersionTheme(appVersionId: string, themeId: string): Promise<void> {
  return apiPost<unknown>('/api/toolbox/update-appversion-theme', {
    AppVersionId: appVersionId,
    ThemeId: themeId,
  }).then(() => undefined);
}
