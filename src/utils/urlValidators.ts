import { i18n } from "../i18n/i18n";

export function validateWeblinkUrl(v: string): string | null {
  const trimmed = v.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return i18n.t("cta_modal_forms.url_error");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return i18n.t("cta_modal_forms.url_error");
  }

  // Reject bare hostnames with no dot (e.g. "https://hello")
  if (!parsed.hostname.includes(".")) {
    return i18n.t("cta_modal_forms.url_error");
  }

  const host = parsed.hostname.replace(/^www\./i, "");
  if (host === "youtube.com" || parsed.hostname === "youtu.be") {
    const videoId = parsed.searchParams.get("v");
    if (
      host !== "youtube.com" ||
      parsed.pathname !== "/watch" ||
      !videoId ||
      !/^[a-zA-Z0-9_-]+$/.test(videoId)
    ) {
      return i18n.t("cta_modal_forms.youtube_url_error");
    }
  }

  return null;
}

export function normalizeYoutubeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get("v");
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    // fall through
  }
  return url;
}
