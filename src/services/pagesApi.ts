import { apiGet, apiPost } from './apiClient';

export interface SDTPage {
  PageId: string;
  PageName: string;
  PageType: string;
  PageStructure: string;
  PageThumbnail: string;
  AppVersionId: string;
}

export interface SDTPageStructure {
  PageId: string;
  PageName: string;
  PageType: string;
  Children: SDTPageStructure[];
}

export interface SDTPublishPage {
  PageId: string;
  PageOrder?: number;
  IsVisible?: boolean;
}

export interface SDTPageUrl {
  PageId: string;
  Url: string;
}

export function getPagesList(): Promise<SDTPage[]> {
  return apiGet<{ SDT_PageCollection: SDTPage[] }>('/api/toolbox/pages/list').then(
    (d) => d.SDT_PageCollection ?? []
  );
}

export function getSinglePage(pageId: string): Promise<SDTPage> {
  return apiGet<{ SDT_Page: SDTPage }>('/api/toolbox/singlepage', { Pageid: pageId }).then(
    (d) => d.SDT_Page
  );
}

export function getPagesTree(): Promise<SDTPageStructure[]> {
  return apiGet<{ SDT_PageStructureCollection: SDTPageStructure[] }>('/api/toolbox/pages/tree').then(
    (d) => d.SDT_PageStructureCollection ?? []
  );
}

export function createMenuPage(appVersionId: string, pageName: string): Promise<SDTPage[]> {
  return apiPost<{ MenuPage: SDTPage[] }>('/api/toolbox/v2/create-menu-page', {
    appVersionId,
    pageName,
  }).then((d) => d.MenuPage ?? []);
}

export function createInfoPage(appVersionId: string, pageName: string): Promise<any> {
  return apiPost<any>('/api/toolbox/v2/create-info-page', {
    appVersionId,
    pageName,
  }).then((d) => d.MenuPage ?? d);
}

export interface CreateLinkPagePayload {
  appVersionId: string;
  pageName: string;
  url: string;
  WWPFormId?: number;
  WWPFormReferenceName?: string;
}

export interface UpdateLinkPagePayload {
  appVersionId: string;
  pageId: string;
  url: string;
  WWPFormId?: number;
  WWPFormReferenceName?: string;
}

export function updateLinkPage(payload: UpdateLinkPagePayload): Promise<any> {
  return apiPost<any>('/api/toolbox/v2/update-link-page', {
    AppVersionId: payload.appVersionId,
    PageId: payload.pageId,
    Url: payload.url,
    WWPFormId: payload.WWPFormId ?? 0,
    WWPFormReferenceName: payload.WWPFormReferenceName ?? '',
  }).then((d) => {
    if (d?.MenuPage) return Array.isArray(d.MenuPage) ? d.MenuPage[0] : d.MenuPage;
    return d;
  });
}

export function createLinkPage(payload: CreateLinkPagePayload): Promise<any> {
  return apiPost<any>('/api/toolbox/v2/create-link-page', {
    appVersionId: payload.appVersionId,
    pageName: payload.pageName,
    url: payload.url,
    WWPFormId: payload.WWPFormId ?? 0,
    WWPFormReferenceName: payload.WWPFormReferenceName ?? '',
  }).then((d) => {
    if (d?.MenuPage) return Array.isArray(d.MenuPage) ? d.MenuPage[0] : d.MenuPage;
    return d;
  });
}

export function createServicePage(appVersionId: string, productServiceId: string): Promise<SDTPage[]> {
  return apiPost<{ ContentPage: SDTPage[] }>('/api/toolbox/v2/create-service-page', {
    appVersionId,
    ProductServiceId: productServiceId,
  }).then((d) => d.ContentPage ?? []);
}

export function createContentPage(appVersionId: string, pageName: string): Promise<string> {
  return apiPost<{ result: string }>('/api/toolbox/v2/create-content-page', {
    appVersionId,
    PageName: pageName,
  }).then((d) => d.result);
}

export function createServiceCta(payload: unknown): Promise<unknown> {
  return apiPost<unknown>('/api/toolbox/v2/create-service-cta', payload);
}

export interface SavePagePayload {
  AppVersionId: string;
  PageId: string;
  PageName: string;
  PageType: string;
  PageStructure: string;
}

export function savePage(payload: SavePagePayload): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/save-page', payload).then(() => undefined);
}

export function savePageThumbnail(pageId: string, pageThumbnailData: string): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/save-page-thumbnail', {
    PageId: pageId,
    PageThumbnailData: pageThumbnailData,
  }).then(() => undefined);
}

export function updatePageTitle(
  appVersionId: string,
  pageId: string,
  pageName: string
): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/update-page-title', {
    AppVersionId: appVersionId,
    PageId: pageId,
    PageName: pageName,
  }).then(() => undefined);
}

export function deletePage(appVersionId: string, pageId: string): Promise<unknown> {
  return apiPost<{ AppVersion: unknown }>('/api/toolbox/v2/delete-page', {
    AppVersionId: appVersionId,
    PageId: pageId,
  }).then((d) => d.AppVersion);
}

export function createPageLegacy(pageName: string, pageJsonContent = '{}'): Promise<string> {
  return apiPost<{ result: string }>('/api/toolbox/create-page', {
    PageName: pageName,
    PageJsonContent: pageJsonContent,
  }).then((d) => d.result);
}

export function updatePagesBatch(
  pagesList: SDTPublishPage[],
  isNotifyResidents = false
): Promise<string> {
  return apiPost<{ result: string }>('/api/toolbox/update-pages-batch', {
    PagesList: pagesList,
    IsNotifyResidents: isNotifyResidents,
  }).then((d) => d.result);
}

export function addPageChildren(parentPageId: string, childPageId: string): Promise<string> {
  return apiPost<{ result: string }>('/api/toolbox/add-page-children', {
    ParentPageId: parentPageId,
    ChildPageId: childPageId,
  }).then((d) => d.result);
}

export function createDynamicFormPage(formId: string, pageName: string): Promise<SDTPage> {
  return apiPost<{ SDT_Page: SDTPage }>('/api/toolbox/create-dynamic-form-page', {
    FormId: formId,
    PageName: pageName,
  }).then((d) => d.SDT_Page);
}

export function updatePageGroups(pageData: unknown): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/update-page-groups', pageData).then(() => undefined);
}
