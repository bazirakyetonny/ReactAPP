import { apiPost } from './apiClient';

export interface TranslatedVersion {
  AppVersionId: string;
  LanguageCode: string;
  Pages: unknown[];
}

export interface TranslatedPage {
  DynamicTranslationPrimaryKey: string;
  Language: string;
  [key: string]: unknown;
}

export function getTranslatedVersion(
  appVersionId: string,
  languageCode: string
): Promise<TranslatedVersion> {
  return apiPost<TranslatedVersion>('/api/toolbox/v2/get-translated-version', {
    AppVersionId: appVersionId,
    LanguageCode: languageCode,
  });
}

export function updateTranslatedPage(
  dynamicTranslationPrimaryKey: string,
  language: string,
  translatedPage: unknown
): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/update-translated-page', {
    DynamicTranslationPrimaryKey: dynamicTranslationPrimaryKey,
    Language: language,
    SDT_TranslatedPage: translatedPage,
  }).then(() => undefined);
}

export function checkTranslationsBeforePublish(appVersionId: string): Promise<unknown> {
  return apiPost<unknown>('/api/toolbox/v2/check-translations-before-publish', {
    AppVersionId: appVersionId,
  });
}

export interface TranslateAppVersionPayload {
  appVersionId: string;
  languageFrom: string;
  languageTo?: string;
  languageToCollection?: string[];
  activePageId?: string;
}

export function translateAppVersion(payload: TranslateAppVersionPayload): Promise<void> {
  const body: Record<string, unknown> = {
    AppVersionId: payload.appVersionId,
    LanguageFrom: payload.languageFrom,
  };
  if (payload.languageToCollection) {
    body.LanguageToCollection = payload.languageToCollection;
    if (payload.activePageId) body.ActivePageId = payload.activePageId;
  } else {
    body.LanguageTo = payload.languageTo;
  }
  return apiPost<unknown>('/api/toolbox/translate-appversion', body).then(() => undefined);
}

export function translateAppVersionBeforePublish(
  appVersionId: string,
  languageFrom: string,
  languageToCollection: string[]
): Promise<void> {
  return apiPost<unknown>('/api/toolbox/translate-appversion-before-publish', {
    AppVersionId: appVersionId,
    LanguageFrom: languageFrom,
    LanguageToCollection: languageToCollection,
  }).then(() => undefined);
}

export function translatePageAfterSave(
  activePageId: string,
  languageFrom: string,
  languageToCollection: string[]
): Promise<void> {
  return apiPost<unknown>('/api/toolbox/translate-page-after-save', {
    ActivePageId: activePageId,
    LanguageFrom: languageFrom,
    LanguageToCollection: languageToCollection,
  }).then(() => undefined);
}

export function getTranslatedPage(
  dynamicTranslationPrimaryKey: string,
  language: string
): Promise<TranslatedPage> {
  return apiPost<TranslatedPage>('/api/toolbox/v2/get-translated-page', {
    DynamicTranslationPrimaryKey: dynamicTranslationPrimaryKey,
    Language: language,
  });
}
