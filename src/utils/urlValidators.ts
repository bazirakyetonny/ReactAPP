import { i18n } from "../i18n/i18n";

export function validateWeblinkUrl(v: string): string | null {
  const trimmed = v.trim();
  if (!/^https?:\/\/.+/.test(trimmed)) return i18n.t("cta_modal_forms.url_error");
  if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i.test(trimmed)) {
    return /^https:\/\/(www\.)?youtube\.com\/watch\?([^#]*&)?v=[a-zA-Z0-9_-]+/.test(trimmed)
      ? null
      : i18n.t("cta_modal_forms.youtube_url_error");
  }
  return null;
}

export function normalizeYoutubeUrl(url: string): string {
  const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : url;
}
