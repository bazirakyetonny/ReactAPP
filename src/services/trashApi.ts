import { apiGet, apiPost } from './apiClient';

export interface TrashItem {
  TrashId: string;
  Type: string;
  Version: string;
  Page: string;
  DeletedAt: string;
}

export function getTrash(): Promise<TrashItem[]> {
  return apiGet<{ TrashItems: TrashItem[] }>('/api/toolbox/v2/get-trash').then(
    (d) => d.TrashItems ?? []
  );
}

export function restoreTrash(type: string, trashId: string): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/restore-trash', {
    Type: type,
    TrashId: trashId,
  }).then(() => undefined);
}

export function deleteTrash(type: string, trashId: string): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/delete-trash', {
    Type: type,
    TrashId: trashId,
  }).then(() => undefined);
}

export function bulkRestoreTrash(trashItems: TrashItem[]): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/bulk-restore-trash', {
    TrashItems: trashItems,
  }).then(() => undefined);
}

export function bulkDeleteTrash(trashItems: TrashItem[]): Promise<void> {
  return apiPost<unknown>('/api/toolbox/v2/bulk-delete-trash', {
    TrashItems: trashItems,
  }).then(() => undefined);
}
