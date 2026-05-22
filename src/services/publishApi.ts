import { apiPost } from './apiClient';

export interface SDTPageUrl {
  PageId: string;
  Url: string;
}

export interface SDTDebugResults {
  [key: string]: unknown;
}

export function analyzeVersion(
  appVersionId: string,
  pageUrlList: SDTPageUrl[]
): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/analyze-version', {
    AppVersionId: appVersionId,
    PageUrlList: pageUrlList,
  }).then(() => undefined);
}

export function debugUrls(pageUrlList: SDTPageUrl[]): Promise<SDTDebugResults> {
  return apiPost<{ DebugResults: SDTDebugResults }>('/api/toolbox/v2/debug', {
    PageUrlList: pageUrlList,
  }).then((d) => d.DebugResults);
}
