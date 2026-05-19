const BASE = 'http://localhost:8082/Comforta_version21DevelopmentNETPostgreSQL/api';

export interface MediaItem {
  MediaId: string;
  MediaName: string;
  MediaImage: string;
  MediaSize: number;
  MediaType: string;
  MediaUrl: string;
  IsCropped: boolean;
}

export async function getMedia(): Promise<MediaItem[]> {
  const res = await fetch(`${BASE}/toolbox/media`);
  if (!res.ok) throw new Error(`getMedia failed: ${res.status}`);
  const data = await res.json();
  if (data.error?.Status && data.error.Status !== 'OK' && data.error.Status !== '') {
    throw new Error(data.error.Message || 'getMedia error');
  }
  return data.SDT_MediaCollection ?? [];
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${BASE}/media/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      MediaName: file.name,
      MediaImageData: base64,
      MediaSize: file.size,
      MediaType: file.type,
    }),
  });
  if (!res.ok) throw new Error(`uploadMedia failed: ${res.status}`);
  const data = await res.json();
  if (data.error?.Status && data.error.Status !== 'OK' && data.error.Status !== '') {
    throw new Error(data.error.Message || 'uploadMedia error');
  }
  return data;
}

export async function deleteMedia(mediaId: string): Promise<void> {
  const res = await fetch(`${BASE}/media/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Mediaid: mediaId }),
  });
  if (!res.ok) throw new Error(`deleteMedia failed: ${res.status}`);
  const data = await res.json();
  if (data.error?.Status && data.error.Status !== 'OK' && data.error.Status !== '') {
    throw new Error(data.error.Message || 'deleteMedia error');
  }
}
