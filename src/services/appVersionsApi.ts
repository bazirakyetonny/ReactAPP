import { apiGet, apiPost } from "./apiClient";

export interface SDTAppVersion {
  AppVersionId: string;
  AppVersionName: string;
  AppVersionDescription: string;
  AppVersionLanguage: string;
  IsActive: boolean;
  Pages: SDTAppVersionPage[];
  TranslateLanguages: string;
  ThemeId: string;
  MoodId: string;
}

export interface SDTAppVersionPage {
  PageId: string;
  PageName: string;
  PageType: string;
}

export interface SDTAppVersionHistory {
  AppVersionHistoryNumber: number;
  AppVersionHistoryDate: string;
  AppVersionHistoryDescription: string;
}

export interface AppVersionHistoryEntry {
  AppVersionId: string;
  AppVersionName: string;
  AppVersionNumber: number;
  PublishDate: string;
  PublishedBy: string;
  IsActive: boolean;
}

const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export function getAppVersions(): Promise<SDTAppVersion[]> {
  return apiGet<{ AppVersions: SDTAppVersion[] }>(
    "/api/toolbox/v2/appversions"
  ).then((d) => d.AppVersions ?? []);
}

export function getActiveAppVersion(): Promise<SDTAppVersion> {
  return apiGet<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/appversion"
  ).then((d) => d.AppVersion);
}

export function getAppVersionHistory(
  appVersionId: string
): Promise<SDTAppVersionHistory[]> {
  return apiGet<{ History: SDTAppVersionHistory[] }>(
    "/api/toolbox/v2/app-version-history",
    { AppVersionId: appVersionId }
  ).then((d) => d.History ?? []);
}

export function getVersionHistory(
  appVersionId: string
): Promise<AppVersionHistoryEntry[]> {
  return apiGet<
    AppVersionHistoryEntry[] | { History: AppVersionHistoryEntry[] }
  >("/api/toolbox/v2/app-version-history", { AppVersionId: appVersionId }).then(
    (d: any) => (Array.isArray(d) ? d : d.History ?? [])
  );
}

export interface CreateAppVersionPayload {
  AppVersionName: string;
  AppVersionDescription?: string;
  AppVersionLanguage?: string;
  IsActive?: boolean;
  TranslateLanguages?: string[];
  MoodId?: string;
  ThemeId?: string;
  VersionTemplatePagesCollection?: unknown[];
  TemplateCategoryId?: string;
}

export function createAppVersion(
  payload: CreateAppVersionPayload
): Promise<SDTAppVersion> {
  return apiPost<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/create-appversion",
    {
      AppVersionName: payload.AppVersionName,
      AppVersionDescription: payload.AppVersionDescription ?? "",
      AppVersionLanguage: payload.AppVersionLanguage ?? "",
      IsActive: payload.IsActive ?? false,
      TranslateLanguages: JSON.stringify(payload.TranslateLanguages ?? []),
      MoodId: payload.MoodId ?? NULL_UUID,
      ThemeId: payload.ThemeId ?? NULL_UUID,
      VersionTemplatePagesCollection:
        payload.VersionTemplatePagesCollection ?? [],
      TemplateCategoryId: payload.TemplateCategoryId ?? NULL_UUID,
    }
  ).then((d) => d.AppVersion);
}

export function copyAppVersion(
  appVersionId: string,
  appVersionName: string
): Promise<SDTAppVersion> {
  return apiPost<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/copy-appversion",
    {
      AppVersionId: appVersionId,
      AppVersionName: appVersionName,
    }
  ).then((d) => d.AppVersion);
}

export function copyHistoryVersion(
  appVersionId: string,
  historyNumber: number,
  appVersionName: string
): Promise<SDTAppVersion> {
  return apiPost<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/copy-history-version",
    {
      AppVersionId: appVersionId,
      AppVersionHistoryNumber: historyNumber,
      AppVersionName: appVersionName,
    }
  ).then((d) => d.AppVersion);
}

export function restoreHistoryVersion(
  appVersionId: string,
  historyNumber: number
): Promise<void> {
  return apiPost<unknown>("/api/toolbox/v2/restore-history-version", {
    AppVersionId: appVersionId,
    AppVersionHistoryNumber: historyNumber,
  }).then(() => undefined);
}

export function updateAppVersion(
  appVersionId: string,
  appVersionName: string,
  appVersionDescription: string
): Promise<SDTAppVersion> {
  return apiPost<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/update-appversion",
    {
      AppVersionId: appVersionId,
      AppVersionName: appVersionName,
      AppVersionDescription: appVersionDescription,
    }
  ).then((d) => d.AppVersion);
}

export function updateAppVersionCategory(
  appVersionId: string,
  templateCategoryId: string
): Promise<void> {
  return apiPost<unknown>("/api/toolbox/v2/update-appversion-category", {
    AppVersionId: appVersionId,
    TemplateCategoryId: templateCategoryId,
  }).then(() => undefined);
}

export function activateAppVersion(
  appVersionId: string
): Promise<SDTAppVersion> {
  return apiPost<{ AppVersion: SDTAppVersion }>(
    "/api/toolbox/v2/activate-appversion",
    {
      AppVersionId: appVersionId,
    }
  ).then((d) => d.AppVersion);
}

export function deleteVersion(appVersionId: string): Promise<string> {
  return apiPost<{ result: string }>("/api/toolbox/v2/delete-version", {
    AppVersionId: appVersionId,
  }).then((d) => d.result);
}

export function createAiAppVersion(appVersion: unknown): Promise<void> {
  return apiPost<unknown>("/api/toolbox/v2/create-ai-appversion", {
    AppVersion: appVersion,
  }).then(() => undefined);
}

export function updateVersionTranslationLanguages(
  appVersionId: string,
  languages: string[]
): Promise<void> {
  return apiPost<unknown>(
    "/api/toolbox/v2/update-version-translation-languages",
    {
      AppVersionId: appVersionId,
      TranslateLanguages: JSON.stringify(languages),
    }
  ).then(() => undefined);
}

export function publishAppVersion(
  appVersionId: string,
  notify = false
): Promise<void> {
  return apiPost<unknown>("/api/toolbox/v2/publish-appversion", {
    AppVersionId: appVersionId,
    Notify: notify,
  }).then(() => undefined);
}
