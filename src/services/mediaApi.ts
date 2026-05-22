import { apiGet, apiPost, getBaseUrl } from './apiClient';

export interface MediaItem {
  MediaId: string;
  MediaName: string;
  MediaImage: string;
  MediaSize: number;
  MediaType: string;
  MediaUrl: string;
  IsCropped: boolean;
}

export interface TrnMedia {
  MediaId: string;
  MediaName: string;
  MediaUrl: string;
  MediaSize: number;
  MediaType: string;
}

export function getMedia(): Promise<MediaItem[]> {
  return apiGet<{ SDT_MediaCollection: MediaItem[] }>('/api/toolbox/media').then(
    (d) => d.SDT_MediaCollection ?? []
  );
}

export function deleteMedia(mediaId: string): Promise<string> {
  return apiGet<{ result: string }>('/api/media/delete', {
    MediaId: mediaId,
  }).then((d) => d.result);
}

export interface UploadPayload {
  name: string;
  base64: string;
  size: number;
  type: string;
}

export function uploadMedia(payload: UploadPayload): Promise<TrnMedia> {
  return apiPost<{ BC_Trn_Media: TrnMedia }>(`/api/media/upload`, {
    MediaName: payload.name,
    MediaImageData: payload.base64,
    MediaSize: payload.size,
    MediaType: payload.type,
  }).then((d) => d.BC_Trn_Media);
}

export interface UploadCroppedPayload extends UploadPayload {
  croppedOriginalMediaId: string;
}

export function uploadCroppedMedia(payload: UploadCroppedPayload): Promise<TrnMedia> {
  return apiPost<{ BC_Trn_Media: TrnMedia }>(`/api/media/upload/cropped`, {
    MediaName: payload.name,
    MediaImageData: payload.base64,
    MediaSize: payload.size,
    MediaType: payload.type,
    CroppedOriginalMediaId: payload.croppedOriginalMediaId,
  }).then((d) => d.BC_Trn_Media);
}

export function uploadLogo(logoUrl: string): Promise<void> {
  return apiPost<unknown>('/api/media/upload/logo', { LogoUrl: logoUrl }).then(() => undefined);
}

export function uploadProfileImage(profileImageUrl: string): Promise<void> {
  return apiPost<unknown>('/api/media/upload/profile', {
    ProfileImageUrl: profileImageUrl,
  }).then(() => undefined);
}

/** Returns the full media URL for a given path — convenience for constructing image src values */
export function resolveMediaUrl(mediaPath: string): string {
  return `${getBaseUrl()}${mediaPath}`;
}
