import { useState } from "react";
import ReactDOM from "react-dom";
import "./css/UpdateTranslationsModal.css";
import { CheckboxSpan } from '../widgets/CheckboxSpan';
import type { SupportedLanguages } from "../../types";
import { dataStore } from "../../data/datastore";
import { updateVersionTranslationLanguages } from "../../services/appVersionsApi";
import { i18n } from "../../i18n/i18n";

interface UpdateTranslationsModalProps {
  versionId: string;
  versionName: string;
  baseLanguage: string;
  currentTranslateLanguages: string; // JSON-encoded string[]
  onClose: () => void;
  onUpdated: (selectedLanguages: string[]) => void;
}

function parseTranslateLanguages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function UpdateTranslationsModal({
  versionId,
  versionName,
  baseLanguage,
  currentTranslateLanguages,
  onClose,
  onUpdated,
}: UpdateTranslationsModalProps) {
  const languages: SupportedLanguages[] =
    dataStore.get("SupportedLanguages") ?? [];

  const translatable = languages.filter((l) => l.value !== baseLanguage);

  const baseLabel =
    languages.find((l) => l.value === baseLanguage)?.label ?? baseLanguage;

  const [selected, setSelected] = useState<string[]>(
    parseTranslateLanguages(currentTranslateLanguages),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateVersionTranslationLanguages(versionId, selected);
      onUpdated(selected);
    } catch {
      setError(i18n.t("navbar.appversion.update_translations_error"));
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <div className="utl-overlay" onMouseDown={onClose}>
      <div className="utl-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="utl-header">
          <span className="utl-title">{versionName}</span>
          <button
            className="utl-close"
            type="button"
            aria-label={i18n.t("version_history.close")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="utl-body">
          <div className="utl-field">
            <span className="utl-label">{i18n.t("navbar.appversion.version_default_language")}</span>
            <div className="utl-base-lang">{baseLabel}</div>
          </div>

          <div className="utl-field">
            <span className="utl-label">{i18n.t("navbar.appversion.version_translation_languages")}</span>
            <div className="utl-check-list">
              {translatable.length === 0 ? (
                <p className="utl-empty">{i18n.t("navbar.appversion.no_other_languages")}</p>
              ) : (
                translatable.map((lang) => (
                  <div key={lang.value} className="utl-check-item" onClick={() => toggle(lang.value)}>
                    <CheckboxSpan checked={selected.includes(lang.value)} onChange={() => toggle(lang.value)} ariaLabel={lang.label} />
                    <span>{lang.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {error && <div className="utl-error">{error}</div>}
        </div>

        <div className="utl-footer">
          <button
            className="utl-btn-primary"
            type="button"
            disabled={loading}
            onClick={handleSave}
          >
            {loading ? i18n.t("navbar.appversion.saving") : i18n.t("navbar.appversion.save")}
          </button>
          <button
            className="utl-btn-secondary"
            type="button"
            disabled={loading}
            onClick={onClose}
          >
            {i18n.t("navbar.appversion.cancel")}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modal,
    document.getElementById("root") ?? document.body,
  );
}
